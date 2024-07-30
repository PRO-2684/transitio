import { cssHelper, removeAllStyles } from "./modules/renderer/css.js";
import { initTransitioSettings, transitioSettingsUpdateStyle, transitioSettingsResetStyle } from "./modules/renderer/settings.js";

transitio.onUpdateStyle((event, args) => {
    cssHelper(args.path, args.css, args.enabled, args.meta);
});
transitio.onResetStyle(removeAllStyles);
transitio.rendererReady();

/**
 * Called when the settings window is created.
 * @param {Element} view The settings view element.
 */
async function onSettingWindowCreated(view) {
    const container = await initTransitioSettings(view);
    transitio.onUpdateStyle((event, args) => {
        transitioSettingsUpdateStyle(container, args);
    });
    transitio.onResetStyle(() => {
        transitioSettingsResetStyle(container);
    });
    transitio.rendererReady(); // Call again to ensure the settings view gets the styles data.
}

export {
    onSettingWindowCreated
}
