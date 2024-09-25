// Description: Debugging utilities for the renderer.
let isDebug = false;
transitio.queryIsDebug().then((result) => {
    isDebug = result;
});

/**
 * Log to console if debug mode is enabled.
 * @param  {...any} args Arguments to log.
 */
function log(...args) {
    if (isDebug) {
        console.log("[Transitio]", ...args);
    }
}
/**
 * Show debug hint on settings page.
 * @param {HTMLElement} view View element.
 */
function showDebugHint(view) {
    if (isDebug) {
        const debug = view.querySelector("#transitio-debug");
        debug.style.color = "red";
        debug.title = "Debug 模式已激活";
    }
}

export { log, showDebugHint };
