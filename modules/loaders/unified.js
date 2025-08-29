const { dataPath, configApi } = globalThis.LiteLoader ?
    await import("./liteloader.js") :
    await import("./qwqnt.js");

export {
    dataPath,
    configApi,
}
