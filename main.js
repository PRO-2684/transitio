const fs = require("fs");
const path = require("path");
const { BrowserWindow, ipcMain } = require("electron");
const stylePath = path.join(__dirname, "styles/");


// 防抖
function debounce(fn, time) {
    let timer = null;
    return function (...args) {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, time);
    }
}

function getDesc(css) { // Get the description from the css (first line of comment, if any)
    let firstLine = css.split("\n")[0].trim();
    if (firstLine.startsWith("/*") && firstLine.endsWith("*/")) {
        return firstLine.slice(2, -2).trim();
    } else {
        return null;
    }
}

function getStyle(name) {
    let content = "";
    try {
        content = fs.readFileSync(path.join(stylePath, name + ".css"), "utf-8");
    } catch (err) { }
    return content;
}

// 样式更改
function updateStyle(webContents, name) {
    let content = getStyle(name);
    let comment = getDesc(content);
    let enabled = (comment === null) || !comment.endsWith(" [Disabled]");
    console.log("[Transitio] updateStyle", name); // DEBUG
    webContents.send("LiteLoader.transitio.updateStyle", [name, content, enabled, comment]);
}

// 重置样式
function resetStyle(webContents) {
    webContents.send("LiteLoader.transitio.resetStyle");
    const files = fs.readdirSync(stylePath);
    files.forEach((file) => {
        updateStyle(webContents, file.slice(0, -4));
    });
}

// 监听 `styles` 目录修改
function onStyleChange(webContents, eventType, filename) {
    console.log("[Transitio] onStyleChange", eventType, filename); // DEBUG
    if (eventType === "change" && filename) {
        updateStyle(webContents, filename.slice(0, -4));
    } else {
        resetStyle(webContents);
    }
}

// 监听配置修改
function onConfigChange(event, name, enable) {
    console.log("[Transitio] onConfigChange", name, enable); // DEBUG
    let content = getStyle(name);
    let comment = getDesc(content);
    let current = (comment === null) || !comment.endsWith(" [Disabled]");
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
    content = `/* ${comment} */\n${content}`;
    fs.writeFileSync(path.join(stylePath, name + ".css"), content, "utf-8");
}

function watchStyleChange(webContents) {
    const watcher = fs.watch(stylePath, "utf-8",
        debounce(onStyleChange.bind(null, webContents), 1000)
    );
    webContents.once("destroyed", () => {
        watcher.close();
        console.log("[Transitio] watcher closed"); // DEBUG
    });
}

// 插件加载触发
function onLoad(plugin) {
    ipcMain.on("LiteLoader.transitio.rendererReady", (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        resetStyle(window.webContents);
    });
    ipcMain.on("LiteLoader.transitio.configChange", onConfigChange);
}

// 创建窗口触发
function onBrowserWindowCreated(window, plugin) {
    window.on("ready-to-show", () => {
        const url = window.webContents.getURL();
        if (url.includes("app://./renderer/index.html")) {
            watchStyleChange(window.webContents);
        }
    });
}

module.exports = {
    onLoad,
    onBrowserWindowCreated
}