// Some utility functions for main.
import { basename } from 'path';
import stylus from 'stylus';
import http from 'http';
import https from 'https';
import { existsSync, createWriteStream, unlink } from 'fs';
import { dialog } from 'electron';
import { stylePath } from "../loaders/unified.js"

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

export { debounce, simpleLog, dummyLog, renderStylus };
