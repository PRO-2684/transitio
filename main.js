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

// 创建 styles 目录 (如果不存在)
if (!fs.existsSync(stylePath)) {
    log(`${stylePath} does not exist, creating...`);
    fs.mkdirSync(stylePath, { recursive: true });
}
// 监听
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

// 获取 CSS 文件内容
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

// 样式更改
function updateStyle(absPath, webContent) {
    absPath = normalize(absPath);
    log("updateStyle", absPath);
    const css = getStyle(absPath);
    if (!css) return;
    // 初始化样式配置
    if (typeof config.styles[absPath] !== "object") {
        config.styles[absPath] = {
            enabled: Boolean(config.styles[absPath] ?? true),
            variables: {}
        };
        updateConfig();
    }
    // 读取基本样式配置
    const enabled = config.styles[absPath].enabled;
    const meta = extractUserStyleMetadata(css);
    meta.name ??= path.basename(absPath, ".css");
    meta.description ??= "此文件没有描述";
    meta.preprocessor ??= "transitio";
    if (meta.preprocessor !== "transitio") {
        log(`Unsupported preprocessor "${meta.preprocessor}" at ${absPath}`)
        return;
    }
    // 读取用户定义的变量，删除不存在的变量
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
    // 向渲染进程发送消息
    const msg = { path: absPath, enabled, css, meta };
    if (webContent) {
        webContent.send("LiteLoader.transitio.updateStyle", msg);
    } else {
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("LiteLoader.transitio.updateStyle", msg);
        });
    }
}

// 重载样式
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

// 导入样式
function importStyle(fname, content) {
    log("importStyle", fname);
    const filePath = path.join(stylePath, fname);
    fs.writeFileSync(filePath, content, "utf-8");
    if (!devMode) {
        updateStyle(filePath);
    }
}

// 监听 `styles` 目录修改
function onStyleChange(eventType, filename) {
    log("onStyleChange", eventType, filename);
    // 理想情况下
    // if (eventType === "change" && filename) {
    //     updateStyle(filename.slice(0, -4));
    // } else {
    //     resetStyle();
    // }
    // 由于特性，重命名文件不会触发 rename，反而会触发 change 事件，不好区分
    reloadStyle(); // 开摆，直接重置所有样式 (反正是开发者模式才会用到)
}

// 监听配置修改
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

// 监听开发者模式开关
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

// 监听目录更改
function watchStyleChange() {
    return fs.watch(stylePath, "utf-8",
        debounce(onStyleChange, updateInterval)
    );
}
