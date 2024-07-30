// Description: Walks a directory and returns a list of CSS files or a shortcut to a CSS file.
const { normalize } = require("./utils");
const fs = require("fs");
const { shell } = require("electron");
const ignoredFolders = new Set(["node_modules", ".git", ".vscode", ".idea", ".github"]);

/**
 * Walks a directory and returns a list of either CSS files or shortcuts to CSS files.
 * @param {string} dir Directory to walk.
 * @returns {string[]} List of CSS files or shortcuts.
 */
function listCSS(dir) {
    const files = [];
    function walk(dir) {
        const dirFiles = fs.readdirSync(dir);
        for (const f of dirFiles) {
            const stat = fs.lstatSync(dir + "/" + f);
            if (stat.isDirectory()) {
                if (!ignoredFolders.has(f)) {
                    walk(dir + "/" + f);
                }
            } else if (f.endsWith(".css")) {
                files.push(normalize(dir + "/" + f));
            } else if (f.endsWith(".lnk") && shell.readShortcutLink) { // lnk file & on Windows
                const linkPath = dir + "/" + f;
                try {
                    const { target } = shell.readShortcutLink(linkPath);
                    if (target.endsWith(".css")) {
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

module.exports = { listCSS };
