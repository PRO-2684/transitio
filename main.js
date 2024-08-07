const fs = require("fs");
const path = require("path");
const { BrowserWindow, ipcMain, webContents, shell } = require("electron");
const { extractUserStyleMetadata } = require("./modules/main/parser");
const { listCSS } = require("./modules/main/walker");
const { normalize, debounce, simpleLog, dummyLog } = require("./modules/main/utils");

const isDebug = process.argv.includes("--transitio-debug");
const updateInterval = 1000;
const log = isDebug ? simpleLog : dummyLog;
let devMode = false;
let watcher = null;

const dataPath = LiteLoader.plugins.transitio.path.data;
const stylePath = path.join(dataPath, "styles");
const debouncedSet = debounce(LiteLoader.api.config.set, updateInterval);

// Create `styles` directory if not exists
if (!fs.existsSync(stylePath)) {
    log(`${stylePath} does not exist, creating...`);
    fs.mkdirSync(stylePath, { recursive: true });
}
// IPC events
ipcMain.on("LiteLoader.transitio.rendererReady", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    reloadStyle(window.webContents);
});
ipcMain.on("LiteLoader.transitio.reloadStyle", (event) => {
    reloadStyle();
});
ipcMain.on("LiteLoader.transitio.importStyle", (event, fname, content) => {
    importStyle(fname, content);
});
ipcMain.on("LiteLoader.transitio.removeStyle", (event, absPath) => {
    log("removeStyle", absPath);
    fs.unlinkSync(absPath);
    delete config.styles[absPath];
    updateConfig();
    if (!devMode) {
        const msg = {
            path: absPath, enabled: false, css: "/* Removed */", meta: {
                name: " [已删除] ",
                description: "[此样式已被删除]",
                enabled: false,
                preprocessor: "transitio",
                variables: {}
            }
        };
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("LiteLoader.transitio.updateStyle", msg);
        });
    }
});
ipcMain.on("LiteLoader.transitio.open", (event, type, uri) => {
    log("open", type, uri);
    switch (type) {
        case "link":
            shell.openExternal(uri);
            break;
        case "path":
            shell.openPath(path.normalize(uri));
            break;
        case "show":
            shell.showItemInFolder(path.normalize(uri));
            break;
        default:
            break;
    }
});
ipcMain.on("LiteLoader.transitio.configChange", onConfigChange);
ipcMain.on("LiteLoader.transitio.devMode", onDevMode);
ipcMain.handle("LiteLoader.transitio.queryDevMode", async (event) => {
    log("queryDevMode", devMode);
    return devMode;
});
ipcMain.handle("LiteLoader.transitio.queryIsDebug", async (event) => {
    log("queryIsDebug", isDebug);
    return isDebug;
});

function updateConfig() {
    log("Calling updateConfig");
    debouncedSet("transitio", config);
}

let config = LiteLoader.api.config.get("transitio", { styles: {} });

// Get CSS content
function getStyle(absPath) {
    if (absPath.endsWith(".lnk") && shell.readShortcutLink) { // lnk file & on Windows
        const { target } = shell.readShortcutLink(absPath);
        absPath = target;
    }
    try {
        return fs.readFileSync(absPath, "utf-8");
    } catch (err) {
        log("getStyle", absPath, err);
        return "";
    }
}

// Send updated style to renderer
function updateStyle(absPath, webContent) {
    absPath = normalize(absPath);
    log("updateStyle", absPath);
    const css = getStyle(absPath);
    if (!css) return;
    // Initialize style configuration
    if (typeof config.styles[absPath] !== "object") {
        config.styles[absPath] = {
            enabled: Boolean(config.styles[absPath] ?? true),
            variables: {}
        };
        updateConfig();
    }
    // Read metadata
    const enabled = config.styles[absPath].enabled;
    const meta = extractUserStyleMetadata(css);
    meta.name ??= path.basename(absPath, ".css");
    meta.description ??= "此文件没有描述";
    meta.preprocessor ??= "transitio";
    if (meta.preprocessor !== "transitio") {
        log(`Unsupported preprocessor "${meta.preprocessor}" at ${absPath}`)
        return;
    }
    // Read variables config, delete non-existent ones
    const udfVariables = config.styles[absPath].variables;
    for (const [varName, varValue] of Object.entries(udfVariables)) {
        if (varName in meta.variables) {
            meta.variables[varName].value = varValue;
        } else {
            log(`Variable "${varName}" not found in ${absPath}`);
            delete config.styles[absPath].variables[varName];
            updateConfig();
        }
    }
    // Send message to renderer
    const msg = { path: absPath, enabled, css, meta };
    if (webContent) {
        webContent.send("LiteLoader.transitio.updateStyle", msg);
    } else {
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("LiteLoader.transitio.updateStyle", msg);
        });
    }
}

// Reload all styles
async function reloadStyle(webContent) {
    log("reloadStyle");
    if (webContent) {
        webContent.send("LiteLoader.transitio.resetStyle");
    } else {
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("LiteLoader.transitio.resetStyle");
        });
    }
    config = LiteLoader.api.config.get("transitio", { styles: {} });
    const styles = listCSS(stylePath);
    for (const absPath of styles) {
        updateStyle(absPath, webContent);
    }
}

// Import style from renderer
function importStyle(fname, content) {
    log("importStyle", fname);
    const filePath = path.join(stylePath, fname);
    fs.writeFileSync(filePath, content, "utf-8");
    if (!devMode) {
        updateStyle(filePath);
    }
}

// Reload styles when file changes
function onStyleChange(eventType, filename) {
    log("onStyleChange", eventType, filename);
    // Ideally, we should only update the changed style:
    // if (eventType === "change" && filename) {
    //     updateStyle(filename.slice(0, -4));
    // } else {
    //     resetStyle();
    // }
    // However, Electron's fs.watch is not reliable enough.
    // Renaming a file will trigger a `change` event instead of `rename`, making it hard to distinguish.
    reloadStyle(); // For now, just reload all styles. (Any way, only in dev mode)
}

// Listen to config modification (from renderer)
function onConfigChange(event, absPath, arg) {
    log("onConfigChange", absPath, arg);
    if (typeof arg === "boolean") {
        config.styles[absPath].enabled = arg;
    } else if (typeof arg === "object") {
        Object.assign(config.styles[absPath].variables, arg);
    }
    updateConfig();
    updateStyle(absPath);
}

// Listen to dev mode switch (from renderer)
function onDevMode(event, enable) {
    log("onDevMode", enable);
    devMode = enable;
    if (enable && !watcher) {
        watcher = watchStyleChange();
        log("watcher created");
    } else if (!enable && watcher) {
        watcher.close();
        watcher = null;
        log("watcher closed");
    }
}

// Listen to `styles` directory
function watchStyleChange() {
    return fs.watch(stylePath, "utf-8",
        debounce(onStyleChange, updateInterval)
    );
}
