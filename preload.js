const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("transitio", {
    rendererReady: () => ipcRenderer.send(
        "LiteLoader.transitio.rendererReady"
    ),
    configChange: (path, enable) => ipcRenderer.send(
        "LiteLoader.transitio.configChange",
        path, enable
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
    removeStyle: (path) => ipcRenderer.send(
        "LiteLoader.transitio.removeStyle",
        path
    ),
    open: (type, uri) => ipcRenderer.send(
        "LiteLoader.transitio.open",
        type, uri
    ),
    queryIsDebug: () => ipcRenderer.invoke(
        "LiteLoader.transitio.queryIsDebug"
    ),
    queryDevMode: () => ipcRenderer.invoke(
        "LiteLoader.transitio.queryDevMode"
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