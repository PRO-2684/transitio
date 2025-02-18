// Description: Some utility functions for main.
const path = require('path');
const stylus = require('stylus');
const http = require('http');
const https = require('https');
const fs = require('fs');

const dataPath = LiteLoader.plugins.transitio.path.data;
const stylePath = path.join(dataPath, "styles");

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
        return `${key} = ${value}${variable.units ?? ""};`;
    }).join("\n");
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
/**
 * Download a file to a path.
 * @param {string} url URL to download.
 * @param {string} [savePath] Path to save the file. If not provided, the file will be saved under `styles` with filename from URL.
 * @param {boolean} [overwrite] Whether to overwrite the file if it already exists.
 * @returns {Promise<void>} Promise that resolves when download is complete.
 */
async function downloadFile(url, savePath = null, overwrite = false) {
    return new Promise(async (resolve, reject) => {
        const urlObj = new URL(url);

        let scheme = null;
        if (urlObj.protocol === "http:") {
            scheme = http;
        } else if (urlObj.protocol === "https:") {
            scheme = https;
        } else {
            reject(`Unsupported protocol: ${urlObj.protocol}`);
        }

        if (!savePath) {
            const filename = path.basename(urlObj.pathname);
            if (!filename) {
                reject("Cannot detect filename from URL");
            }
            savePath = path.join(stylePath, filename);
        }
        const stream = fs.createWriteStream(savePath, { flags: overwrite ? "w" : "wx" });

        scheme.get(urlObj, (res) => {
            res.pipe(stream);
            stream.on("finish", () => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }).on("error", (err) => {
                fs.unlink(savePath, () => reject(err))
            });
        }).on("error", (err) => {
            stream.close(() => {
                fs.unlink(savePath, () => reject(err));
            });
        });
    });
}

module.exports = { normalize, debounce, simpleLog, dummyLog, renderStylus, downloadFile };
