const fs = require("fs");
const path = require("path");
const { BrowserWindow, ipcMain, shell } = require("electron");

let dataPath = null;
let stylePath = null;
let devMode = false;
let updateInterval = 1000;
let openedContents = new Set();
let watcher = null;

function log(...args) { // DEBUG
    console.log("[Transitio]", ...args);
}
// function log(...args) { }

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
// 获取 CSS 文件的首行注释
function getDesc(css) {
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
function updateStyle(name, webContents) {
    let content = getStyle(name);
    let comment = getDesc(content);
    let enabled = (comment === null) || !comment.endsWith(" [Disabled]");
    log("updateStyle", name);
    if (webContents) {
        webContents.send("LiteLoader.transitio.updateStyle", [name, content, enabled, comment]);
    } else {
        openedContents.forEach((webContents) => {
            webContents.send("LiteLoader.transitio.updateStyle", [name, content, enabled, comment]);
        });
    }
}

// 重置样式
function reloadStyle(webContents) {
    if (webContents) {
        webContents.send("LiteLoader.transitio.resetStyle");
    } else {
        openedContents.forEach((webContents) => {
            webContents.send("LiteLoader.transitio.resetStyle");
        });
    }
    const files = fs.readdirSync(stylePath).filter((file) => file.endsWith(".css"));
    files.forEach((file) => {
        updateStyle(file.slice(0, -4), webContents);
    });
}

// 导入样式
function importStyle(fname, content) {
    log("importStyle", fname);
    let filePath = path.join(stylePath, fname);
    fs.writeFileSync(filePath, content, "utf-8");
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
// 移动文件夹
async function moveDir() {
    // 若有，将 stylePath 目录下内容移动到 dataPath 下，随后删除 stylePath 目录
    // 检查 stylePath 目录是否存在
    const origPath = path.join(__dirname, "styles/");
    if (!fs.existsSync(origPath)) {
        log(`${origPath} does not exist, skipping...`);
        return; // 不存在，说明已经移动过了
    }
    // 检查 dataPath 目录是否存在
    if (!fs.existsSync(stylePath)) {
        log(`${stylePath} does not exist, creating...`);
        fs.mkdirSync(stylePath, { recursive: true });
    }
    // 移动文件
    const files = fs.readdirSync(origPath);
    let promises = [];
    files.forEach((file) => {
        let promise = new Promise((resolve, reject) => {
            log(`moving ${file}...`);
            // fs.renameSync(path.join(origPath, file), path.join(stylePath, file));
            // 考虑跨盘符移动，使用 stream
            let readStream = fs.createReadStream(path.join(origPath, file));
            let writeStream = fs.createWriteStream(path.join(stylePath, file));
            readStream.pipe(writeStream);
            readStream.on("end", () => {
                fs.unlinkSync(path.join(origPath, file));
                resolve();
            });
            readStream.on("error", (err) => {
                reject(err);
            });
            writeStream.on("error", (err) => {
                reject(err);
            });
        });
        promises.push(promise);
    });
    // 等待移动成功时删除 stylePath 目录
    return Promise.all(promises).then(() => {
        log(`removing ${origPath}...`);
        fs.rmdirSync(origPath);
    });
}

// 插件加载触发
async function onLoad(plugin) {
    dataPath = plugin.path.data;
    stylePath = path.join(dataPath, "styles/");
    await moveDir();
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
                shell.openPath(path.join(dataPath, uri));
                break;
            case "link":
                shell.openExternal(uri);
                break;
            default:
                break;
        }
    });
    ipcMain.on("LiteLoader.transitio.configChange", onConfigChange);
    ipcMain.on("LiteLoader.transitio.devMode", onDevMode);
}

// 创建窗口触发
function onBrowserWindowCreated(window, plugin) {
    window.on("ready-to-show", () => {
        const url = window.webContents.getURL();
        if (url.includes("app://./renderer/index.html")) {
            openedContents.add(window.webContents);
            window.webContents.once("destroyed", () => {
                openedContents.delete(window.webContents);
            });
        }
    });
}

module.exports = {
    onLoad,
    onBrowserWindowCreated
}