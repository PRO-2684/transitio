const fs = require("fs");
const path = require("path");
const { BrowserWindow, ipcMain, webContents } = require("electron");

const isDebug = process.argv.includes("--transitio-debug");
const updateInterval = 1000;
const log = isDebug ? console.log.bind(console, "[Transitio]") : () => { };
let devMode = false;
let watcher = null;

// 加载插件时触发
const dataPath = LiteLoader.plugins.transitio.path.data;
const stylePath = path.join(dataPath, "styles");

// 初始化插件
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
ipcMain.on("LiteLoader.transitio.open", (event, type, uri) => {
    log("open", type, uri);
    switch (type) {
        case "folder": // Relative to dataPath
            LiteLoader.api.openPath(path.join(dataPath, uri));
            break;
        case "link":
            LiteLoader.api.openExternal(uri);
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

// 防抖
function debounce(fn, time) {
    const timer = null;
    return function (...args) {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, time);
    }
}
// 获取 CSS 文件的首行注释
function getDesc(css) {
    const firstLine = css.split("\n")[0].trim();
    if (firstLine.startsWith("/*") && firstLine.endsWith("*/")) {
        return firstLine.slice(2, -2).trim();
    } else {
        return null;
    }
}

function getStyle(name) {
    try {
        return fs.readFileSync(path.join(stylePath, name + ".css"), "utf-8");
    } catch (err) {
        return "";
    }
}

// 样式更改
function updateStyle(name, webContent) {
    const content = getStyle(name);
    let comment = getDesc(content) || "";
    let enabled = true;
    if (comment.endsWith("[Disabled]")) {
        comment = comment.slice(0, -10).trim();
        enabled = false;
    }
    log("updateStyle", name, comment, enabled);
    if (webContent) {
        webContent.send("LiteLoader.transitio.updateStyle", [name, content, enabled, comment]);
    } else {
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("LiteLoader.transitio.updateStyle", [name, content, enabled, comment]);
        });
    }
}

// 重置样式
function reloadStyle(webContent) {
    if (webContent) {
        webContent.send("LiteLoader.transitio.resetStyle");
    } else {
        webContents.getAllWebContents().forEach((webContent) => {
            webContent.send("LiteLoader.transitio.resetStyle");
        });
    }
    const files = fs.readdirSync(stylePath, { withFileTypes: true }).filter((file) => file.name.endsWith(".css") && !file.isDirectory());
    files.forEach((file) => {
        updateStyle(file.name.slice(0, -4), webContent);
    });
}

// 导入样式
function importStyle(fname, content) {
    log("importStyle", fname);
    const filePath = path.join(stylePath, fname);
    fs.writeFileSync(filePath, content, "utf-8");
    if (!devMode) {
        updateStyle(fname.slice(0, -4));
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
function onConfigChange(event, name, enable) {
    log("onConfigChange", name, enable);
    let content = getStyle(name);
    let comment = getDesc(content);
    const current = (comment === null) || !comment.endsWith("[Disabled]");
    if (current === enable) return;
    if (comment === null) {
        comment = "";
    } else {
        content = content.split("\n").slice(1).join("\n");
    }
    if (enable) {
        comment = comment.slice(0, -11);
    } else {
        comment += " [Disabled]";
    }
    content = `/* ${comment} */\n` + content;
    fs.writeFileSync(path.join(stylePath, name + ".css"), content, "utf-8");
    if (!devMode) {
        updateStyle(name);
    }
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

function watchStyleChange() {
    return fs.watch(stylePath, "utf-8",
        debounce(onStyleChange, updateInterval)
    );
}
