const slug = "transitio";
const dataPathOrig = LiteLoader.plugins[slug].path.data;
const pluginPathOrig = LiteLoader.plugins[slug].path.plugin;
const transitioVersion = LiteLoader.plugins[slug].manifest.version;
const configApi = {
    get: () => LiteLoader.api.config.get(slug, { styles: {} }),
    set: (config) => LiteLoader.api.config.set(slug, config),
};

export {
    dataPathOrig,
    pluginPathOrig,
    transitioVersion,
    configApi,
}
