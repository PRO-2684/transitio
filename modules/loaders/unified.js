const { dataPath, configApi } = globalThis.LiteLoader ?
    await import("./liteloader.js") : // TODO: LiteLoader doesn't support ESM imports - maybe drop support or use tools to auto transform?
    await import("./qwqnt.js");

export {
    dataPath,
    configApi,
}
