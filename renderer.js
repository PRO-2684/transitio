import { cssHelper, removeAllStyles } from "./modules/renderer/css.js";

transitio.onUpdateStyle((event, args) => {
    cssHelper(args.path, args.css, args.enabled, args.meta);
});
transitio.onResetStyle(removeAllStyles);
transitio.rendererReady();

/**
 * Called when the settings window is created.
 * @param {HTMLElement} view The settings view element.
 */
async function onSettingWindowCreated(view) {
    const { initTransitioSettings, transitioSettingsUpdateStyle, transitioSettingsResetStyle } = await import("./modules/renderer/settings.js");
    const container = await initTransitioSettings(view);
    transitio.onUpdateStyle((event, args) => {
        transitioSettingsUpdateStyle(container, args);
    });
    transitio.onResetStyle(() => {
        transitioSettingsResetStyle(container);
    });
    transitio.rendererReady(); // Call again to ensure the settings view gets the styles data.
}

// https://github.com/QwQ-002/QwQNT-RendererEvents
window.RendererEvents?.onSettingsWindowCreated?.(async () => {
    // https://github.com/QwQ-002/QwQNT-PluginSettings
    const view = await window.PluginSettings?.renderer?.registerPluginSettings?.(qwqnt.framework.plugins.transitio.meta.packageJson);
    if (view) {
        onSettingWindowCreated(view);
    }
});

export { onSettingWindowCreated };
