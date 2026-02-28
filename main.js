import {
    existsSync,
    mkdirSync,
    unlinkSync,
    readFileSync,
    writeFileSync,
    watch,
} from "fs";
import { normalize as normalize_platform, basename } from "path";
import { BrowserWindow, ipcMain, webContents, shell, dialog } from "electron";
import { extractUserStyleMetadata } from "./modules/main/parser.js";
import { listStyles } from "./modules/main/walker.js";
import {
    debounce,
    simpleLog,
    dummyLog,
    renderStylus,
    downloadFile,
} from "./modules/main/utils.js";
import { normalize, configApi, stylePath } from "./modules/loaders/unified.js";

const slug = "transitio";
const isDebug = process.argv.includes("--transitio-debug");
const updateInterval = 1000;
const log = isDebug ? simpleLog : dummyLog;
let devMode = false;
let watcher = null;

const supportedPreprocessors = ["none", slug, "stylus"];
const debouncedSet = debounce(configApi.set, updateInterval);

// Create data & `styles` directory if not exists
if (!existsSync(stylePath)) {
    log(`${stylePath} does not exist, creating...`);
    mkdirSync(stylePath, { recursive: true });
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
ipcMain.on("PRO-2684.transitio.removeStyle", (_event, relPath) => {
    log("removeStyle", relPath);
    unlinkSync(stylePath + relPath);
    delete config.styles[relPath];
    updateConfig();
    if (!devMode) {
        const msg = {
            path: relPath,
            enabled: false,
            css: "/* Removed */",
            meta: {
                name: " [已删除] ",
                description: "[此样式已被删除]",
                enabled: false,
                preprocessor: slug,
                vars: {},
            },
        };
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("PRO-2684.transitio.updateStyle", msg);
        });
    }
});
ipcMain.on("PRO-2684.transitio.resetStyle", (_event, relPath) => {
    log("resetStyle", relPath);
    delete config.styles[relPath].variables;
    updateConfig();
    updateStyle(relPath);
});
ipcMain.on("PRO-2684.transitio.open", (_event, type, uri) => {
    log("open", type, uri);
    switch (type) {
        case "link":
            shell.openExternal(uri);
            break;
        case "path":
            shell.openPath(normalize_platform(uri));
            break;
        case "show":
            shell.showItemInFolder(normalize_platform(uri));
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

function updateConfig() {
    log("Calling updateConfig");
    debouncedSet(config);
}

let config = configApi.get();

// Get CSS content
function getStyle(relPath) {
    let realPath = stylePath + relPath;
    if (relPath.endsWith(".lnk") && shell.readShortcutLink) {
        // lnk file & on Windows
        const { target } = shell.readShortcutLink(realPath);
        realPath = target;
    }
    try {
        return readFileSync(realPath, "utf-8");
    } catch (err) {
        log("getStyle", relPath, err);
        return "";
    }
}

// Send updated style to renderer
async function updateStyle(relPath, webContent) {
    relPath = normalize(relPath);
    log("updateStyle", relPath);
    let css = getStyle(relPath);
    if (!css) return;
    // Initialize style configuration
    if (typeof config.styles[relPath] !== "object") {
        config.styles[relPath] = {
            enabled: Boolean(config.styles[relPath] ?? true),
        };
        updateConfig();
    }
    // Read metadata
    const enabled = config.styles[relPath].enabled;
    const meta = extractUserStyleMetadata(css);
    meta.name ??= basename(relPath, ".css");
    meta.description ??= "此文件没有描述";
    meta.preprocessor ??= slug;
    if (!supportedPreprocessors.includes(meta.preprocessor)) {
        log(`Unsupported preprocessor "${meta.preprocessor}" at ${relPath}`);
        return;
    }
    // Read variables config, delete non-existent ones
    const udfVariables = config.styles[relPath].variables ?? {};
    for (const [varName, varValue] of Object.entries(udfVariables)) {
        if (varName in meta.vars) {
            meta.vars[varName].value = varValue;
        } else {
            log(`Variable "${varName}" not found in ${relPath}`);
            delete config.styles[relPath].variables[varName];
            updateConfig();
        }
    }
    if (meta.preprocessor === "stylus") {
        try {
            css = await renderStylus(stylePath + relPath, css, meta.vars);
        } catch (err) {
            log(`Failed to render ${relPath}:`, err);
            css = `/* Stylus 编译失败: ${err.name} (使用 Debug 模式查看终端输出来获得更多信息) */`;
            meta.name += " (编译失败)";
        }
    }
    // Send message to renderer
    const msg = { path: relPath, enabled, css, meta };
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
    for (const relPath of styles) {
        updateStyle(relPath, webContent);
    }
    const removedStyles = new Set(Object.keys(config.styles)).difference(
        new Set(styles),
    );
    for (const relPath of removedStyles) {
        log("Removed style", relPath);
        delete config.styles[relPath];
    }
    if (removedStyles.size) {
        updateConfig();
    }
}

// Import style from renderer
function importStyle(fname, content) {
    log("importStyle", fname);
    const filePath = stylePath + fname;
    writeFileSync(filePath, content, "utf-8");
    if (!devMode) {
        updateStyle(fname);
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
function onConfigChange(_event, relPath, arg) {
    log("onConfigChange", relPath, arg);
    const styleConfig = config.styles[relPath];
    if (typeof arg === "boolean") {
        styleConfig.enabled = arg;
    } else if (typeof arg === "object") {
        styleConfig.variables = Object.assign(styleConfig.variables ?? {}, arg);
    }
    updateConfig();
    updateStyle(relPath);
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
    return watch(stylePath, "utf-8", debounce(onStyleChange, updateInterval));
}
