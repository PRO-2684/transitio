// Walks a directory and returns a list of style files or a shortcut to a style file.
import { normalize } from "../loaders/unified.js";
import { readdirSync, lstatSync } from "fs";
import { shell } from "electron";

/** Folders to ignore. */
const ignoredFolders = new Set(["node_modules", ".git", ".vscode", ".idea", ".github"]);
/** Supported extensions for style files. */
const supportedExtensions = [".css", ".styl"];

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
 * Walks a directory and returns a list of either style files or shortcuts to style files, relative to given directory.
 * @param {string} baseDir Directory to walk, ending with `/`.
 * @returns {string[]} List of style files or shortcuts.
 */
function listStyles(baseDir) {
    const files = [];
    // `dir` must end with `/` or be empty.
    function walk(dir) {
        const dirFiles = readdirSync(baseDir + dir);
        for (const f of dirFiles) {
            const stat = lstatSync(baseDir + dir + f);
            if (stat.isDirectory()) {
                if (!ignoredFolders.has(f)) {
                    walk(dir + f + "/");
                }
            } else if (hasValidExtension(f)) {
                files.push(normalize(dir + f));
            } else if (f.endsWith(".lnk") && shell.readShortcutLink) { // lnk file & on Windows
                const linkPath = dir + f;
                try {
                    const { target } = shell.readShortcutLink(baseDir + linkPath);
                    if (hasValidExtension(target)) {
                        files.push(normalize(linkPath));
                    }
                } catch (e) {
                    log("Failed to read shortcut", linkPath);
                }
            }
        }
    }
    walk("");
    return files;
}

export { listStyles };
