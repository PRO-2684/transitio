const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("transitio", {
    rendererReady: () => ipcRenderer.send(
        "LiteLoader.transitio.rendererReady"
    ),
    configChange: (name, enable) => ipcRenderer.send(
        "LiteLoader.transitio.configChange",
        name, enable
    ),
    devMode: (enable) => ipcRenderer.send(
        "LiteLoader.transitio.devMode",
        enable
    ),
    reloadStyle: () => ipcRenderer.send(
        "LiteLoader.transitio.reloadStyle"
    ),
    importStyle: (fname, content) => ipcRenderer.send(
        "LiteLoader.transitio.importStyle",
        fname, content
    ),
    open: (type, uri) => ipcRenderer.send(
        "LiteLoader.transitio.open",
        type, uri
    ),
    onUpdateStyle: (callback) => ipcRenderer.on(
        "LiteLoader.transitio.updateStyle",
        callback
    ),
    onResetStyle: (callback) => ipcRenderer.on(
        "LiteLoader.transitio.resetStyle",
        callback
    ),
});