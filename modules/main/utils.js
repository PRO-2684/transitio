// Description: Some utility functions for main.

/**
 * Normalize a path to Unix style.
 * @param {string} path Path to normalize.
 * @returns {string} Normalized path.
 */
function normalize(path) {
    return path.replace(":\\", "://").replaceAll("\\", "/");
}

/**
 * Debounces a function.
 * @param {Function} fn Function to debounce.
 * @param {number} time Debounce time.
 * @returns {Function} Debounced function.
 */
function debounce(fn, time) {
    let timer = null;
    return function (...args) {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, time);
    }
}

/**
 * Logs to the console with colored prefix.
 * @param {...any} args The arguments to log.
 */
function simpleLog(...args) {
    console.log("\x1b[38;2;116;169;246m%s\x1b[0m", "[Transitio]", ...args);
}

/**
 * Logs nothing.
 * @param {...any} args The arguments to log.
 */
function dummyLog(...args) {}

module.exports = { normalize, debounce, simpleLog, dummyLog };
