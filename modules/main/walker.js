// Description: Walks a directory and returns a list of style files or a shortcut to a style file.
const { normalize } = require("./utils");
const fs = require("fs");
const { shell } = require("electron");

/** Folders to ignore. */
const ignoredFolders = new Set(["node_modules", ".git", ".vscode", ".idea", ".github"]);
/** Supported extensions for style files. */
const supportedExtensions = LiteLoader.plugins.transitio.manifest.supported_extensions;

/**
 * Whether the file name has a supported extension.
 * @param {string} name File name.
 * @returns {boolean} Whether the file name has a supported extension.
 */
function hasValidExtension(name) {
    for (const ext of supportedExtensions) {
        if (name.endsWith(ext)) {
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
            } else if (hasValidExtension(f)) {
                files.push(normalize(dir + "/" + f));
            } else if (f.endsWith(".lnk") && shell.readShortcutLink) { // lnk file & on Windows
                const linkPath = dir + "/" + f;
                try {
                    const { target } = shell.readShortcutLink(linkPath);
                    if (hasValidExtension(target)) {
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
