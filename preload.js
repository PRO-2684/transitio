const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("transitio", {
    rendererReady: () => ipcRenderer.send(
        "PRO-2684.transitio.rendererReady"
    ),
    configChange: (path, arg) => ipcRenderer.send(
        "PRO-2684.transitio.configChange",
        path, arg
    ),
    devMode: (enable) => ipcRenderer.send(
        "PRO-2684.transitio.devMode",
        enable
    ),
    reloadStyle: () => ipcRenderer.send(
        "PRO-2684.transitio.reloadStyle"
    ),
    importStyle: (fname, content) => ipcRenderer.send(
        "PRO-2684.transitio.importStyle",
        fname, content
    ),
    removeStyle: (path) => ipcRenderer.send(
        "PRO-2684.transitio.removeStyle",
        path
    ),
    resetStyle: (path) => ipcRenderer.send(
        "PRO-2684.transitio.resetStyle",
        path
    ),
    open: (type, uri) => ipcRenderer.send(
        "PRO-2684.transitio.open",
        type, uri
    ),
    queryIsDebug: () => ipcRenderer.invoke(
        "PRO-2684.transitio.queryIsDebug"
    ),
    queryDevMode: () => ipcRenderer.invoke(
        "PRO-2684.transitio.queryDevMode"
    ),
    onUpdateStyle: (callback) => ipcRenderer.on(
        "PRO-2684.transitio.updateStyle",
        callback
    ),
    onResetStyle: (callback) => ipcRenderer.on(
        "PRO-2684.transitio.resetStyle",
        callback
    ),
});
