const fs = require("fs");
const path = require("path");
const { BrowserWindow, ipcMain, webContents, shell } = require("electron");
const { extractUserStyleMetadata } = require("./modules/main/parser");
const { listStyles } = require("./modules/main/walker");
const { normalize, debounce, simpleLog, dummyLog, renderStylus, downloadFile, stylePath, configApi } = require("./modules/main/utils");
const { app, dialog } = require("electron");

const slug = "transitio";
const isDebug = process.argv.includes("--transitio-debug");
const updateInterval = 1000;
const log = isDebug ? simpleLog : dummyLog;
let devMode = false;
let watcher = null;

const supportedPreprocessors = ["none", slug, "stylus"];
const debouncedSet = debounce(configApi.set, updateInterval);

// Create data & `styles` directory if not exists
if (!fs.existsSync(stylePath)) {
    log(`${stylePath} does not exist, creating...`);
    fs.mkdirSync(stylePath, { recursive: true });
}
// IPC events
ipcMain.on("PRO-2684.transitio.rendererReady", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    reloadStyle(window.webContents);
});
ipcMain.on("PRO-2684.transitio.reloadStyle", (_event) => {
    reloadStyle();
});
ipcMain.on("PRO-2684.transitio.importStyle", (_event, fname, content) => {
    importStyle(fname, content);
});
ipcMain.on("PRO-2684.transitio.removeStyle", (_event, absPath) => {
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
                preprocessor: slug,
                vars: {}
            }
        };
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("PRO-2684.transitio.updateStyle", msg);
        });
    }
});
ipcMain.on("PRO-2684.transitio.resetStyle", (_event, absPath) => {
    log("resetStyle", absPath);
    delete config.styles[absPath].variables;
    updateConfig();
    updateStyle(absPath);
});
ipcMain.on("PRO-2684.transitio.open", (_event, type, uri) => {
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
ipcMain.on("PRO-2684.transitio.configChange", onConfigChange);
ipcMain.on("PRO-2684.transitio.devMode", onDevMode);
ipcMain.handle("PRO-2684.transitio.queryDevMode", async (_event) => {
    log("queryDevMode", devMode);
    return devMode;
});
ipcMain.handle("PRO-2684.transitio.queryIsDebug", async (_event) => {
    log("queryIsDebug", isDebug);
    return isDebug;
});

app.whenReady().then(() => {
    // https://github.com/PRO-2684/protocio
    globalThis?.LiteLoader?.api?.registerUrlHandler?.(slug, handleUrlScheme);
});

function updateConfig() {
    log("Calling updateConfig");
    debouncedSet(config);
}

let config = configApi.get();

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
async function updateStyle(absPath, webContent) {
    absPath = normalize(absPath);
    log("updateStyle", absPath);
    let css = getStyle(absPath);
    if (!css) return;
    // Initialize style configuration
    if (typeof config.styles[absPath] !== "object") {
        config.styles[absPath] = {
            enabled: Boolean(config.styles[absPath] ?? true)
        };
        updateConfig();
    }
    // Read metadata
    const enabled = config.styles[absPath].enabled;
    const meta = extractUserStyleMetadata(css);
    meta.name ??= path.basename(absPath, ".css");
    meta.description ??= "此文件没有描述";
    meta.preprocessor ??= slug;
    if (!supportedPreprocessors.includes(meta.preprocessor)) {
        log(`Unsupported preprocessor "${meta.preprocessor}" at ${absPath}`);
        return;
    }
    // Read variables config, delete non-existent ones
    const udfVariables = config.styles[absPath].variables ?? {};
    for (const [varName, varValue] of Object.entries(udfVariables)) {
        if (varName in meta.vars) {
            meta.vars[varName].value = varValue;
        } else {
            log(`Variable "${varName}" not found in ${absPath}`);
            delete config.styles[absPath].variables[varName];
            updateConfig();
        }
    }
    if (meta.preprocessor === "stylus") {
        try {
            css = await renderStylus(absPath, css, meta.vars);
        } catch (err) {
            log(`Failed to render ${absPath}:`, err);
            css = `/* Stylus 编译失败: ${err.name} (使用 Debug 模式查看终端输出来获得更多信息) */`;
            meta.name += " (编译失败)";
        }
    }
    // Send message to renderer
    const msg = { path: absPath, enabled, css, meta };
    if (webContent) {
        webContent.send("PRO-2684.transitio.updateStyle", msg);
    } else {
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("PRO-2684.transitio.updateStyle", msg);
        });
    }
}

// Reload all styles
async function reloadStyle(webContent) {
    log("reloadStyle");
    if (webContent) {
        webContent.send("PRO-2684.transitio.resetStyle");
    } else {
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("PRO-2684.transitio.resetStyle");
        });
    }
    config = configApi.get();
    const styles = listStyles(stylePath);
    for (const absPath of styles) {
        updateStyle(absPath, webContent);
    }
    const removedStyles = new Set(Object.keys(config.styles)).difference(new Set(styles));
    for (const absPath of removedStyles) {
        log("Removed style", absPath);
        delete config.styles[absPath];
    }
    if (removedStyles.size) {
        updateConfig();
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
    // However, Node's fs.watch is not reliable enough.
    // Renaming a file will trigger a `change` event instead of `rename`, making it hard to distinguish.
    reloadStyle(); // For now, just reload all styles. (Any way, only in dev mode)
}

// Listen to config modification (from renderer)
function onConfigChange(_event, absPath, arg) {
    log("onConfigChange", absPath, arg);
    const styleConfig = config.styles[absPath];
    if (typeof arg === "boolean") {
        styleConfig.enabled = arg;
    } else if (typeof arg === "object") {
        styleConfig.variables = Object.assign(styleConfig.variables ?? {}, arg);
    }
    updateConfig();
    updateStyle(absPath);
}

// Listen to dev mode switch (from renderer)
function onDevMode(_event, enable) {
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

// Handle URL scheme
function handleUrlScheme(rest, _url) {
    switch (rest[0]) {
        case "install": {
            if (!rest[1]) {
                log("No URL provided for install action");
                break;
            }
            const url = decodeURIComponent(rest[1]);
            log("Trying to download style from:", url);
            downloadFile(url).then(() => {
                log("Download complete");
                return reloadStyle();
            }).then(() => {
                log("Reload complete");
                dialog.showMessageBox({
                    title: "Download success!",
                    message: `Successfully downloaded ${url} and reloaded styles!`,
                    type: "info",
                });
            }).catch((err) => {
                dialog.showErrorBox({
                    title: "Download failed!",
                    content: `Failed to download ${url}: ${err}`,
                });
                log(`Failed to download ${url}: ${err}`);
            });
            break;
        }
        case "ping": {
            dialog.showMessageBox({
                title: "Pong!",
                message: "Pong!",
                type: "info",
            });
        }
        default:
            log("Unknown action:", rest[0]);
            break;
    }
}
