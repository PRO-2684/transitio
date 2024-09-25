// Description: Walks a directory and returns a list of CSS files or a shortcut to a CSS file.
const { normalize } = require("./utils");
const fs = require("fs");
const { shell } = require("electron");

/** Folders to ignore. */
const ignoredFolders = new Set(["node_modules", ".git", ".vscode", ".idea", ".github"]);
/** Valid suffixes for style files. */
const validSuffixes = new Set([".css", ".styl"]);

/**
 * Whether the file name has a valid suffix.
 * @param {string} name File name.
 * @returns {boolean} Whether the file name has a valid suffix.
 */
function hasValidSuffix(name) {
    for (const suffix of validSuffixes) {
        if (name.endsWith(suffix)) {
            return true;
        }
    }
    return false;
}

/**
 * Walks a directory and returns a list of either style files or shortcuts to style files.
 * @param {string} dir Directory to walk.
 * @returns {string[]} List of style files or shortcuts.
 */
function listStyles(dir) {
    const files = [];
    function walk(dir) {
        const dirFiles = fs.readdirSync(dir);
        for (const f of dirFiles) {
            const stat = fs.lstatSync(dir + "/" + f);
            if (stat.isDirectory()) {
                if (!ignoredFolders.has(f)) {
                    walk(dir + "/" + f);
                }
            } else if (hasValidSuffix(f)) {
                files.push(normalize(dir + "/" + f));
            } else if (f.endsWith(".lnk") && shell.readShortcutLink) { // lnk file & on Windows
                const linkPath = dir + "/" + f;
                try {
                    const { target } = shell.readShortcutLink(linkPath);
                    if (hasValidSuffix(target)) {
                        files.push(normalize(linkPath));
                    }
                } catch (e) {
                    log("Failed to read shortcut", linkPath);
                }
            }
        }
    }
    walk(dir);
    return files;
}

module.exports = { listStyles };
