// Description: Some utility functions for main.
const stylus = require('stylus');

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
function dummyLog(...args) { }
/**
 * Async wrapper for Stylus render.
 * @param {string} path Path of the Stylus file.
 * @param {string} content Content of the Stylus file.
 * @param {Object} vars Variables to apply.
 */
async function renderStylus(path, content, vars) {
    const varDef = Object.keys(vars).map(key => {
        const variable = vars[key];
        let value = variable.value ?? variable.default;
        if (variable.type === "select") {
            // Map from option name to value
            value = variable.options.find(opt => opt.name === value)?.value;
        }
        return `${key} = ${value}${variable.units ?? ""};\n`;
    }).join("");
    return new Promise((resolve, reject) => {
        stylus(varDef + content)
            .set("filename", path)
            .render((err, css) => {
            if (err) {
                reject(err);
            } else {
                resolve(css);
            }
        });
    });
}

module.exports = { normalize, debounce, simpleLog, dummyLog, renderStylus };
