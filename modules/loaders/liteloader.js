const slug = "transitio";
const dataPath = LiteLoader.plugins.transitio.path.data;
const configApi = {
    get: () => LiteLoader.api.config.get(slug, { styles: {} }),
    set: (config) => LiteLoader.api.config.set(slug, config),
};

export {
    dataPath,
    configApi,
}
