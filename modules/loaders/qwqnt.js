const slug = "transitio";
const dataPathOrig = qwqnt.framework.paths.data + "/" + slug;
const pluginPathOrig = qwqnt.framework.plugins[slug].meta.path;
const transitioVersion = qwqnt.framework.plugins[slug].meta.packageJson.version;
const configApi = {
    get: () => PluginSettings.main.readConfig(slug, { styles: {} }),
    set: (config) => PluginSettings.main.writeConfig(slug, config),
};

export {
    dataPathOrig,
    pluginPathOrig,
    transitioVersion,
    configApi,
}
