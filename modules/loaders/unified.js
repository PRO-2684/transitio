// Unified API for ~~LiteLoader &~~ QwQNT, main & renderer

import {
    dataPathOrig,
    pluginPathOrig,
    transitioVersion,
    configApi,
} from "./qwqnt.js";
/** Transitio data path, normalized to use `/`, ending with `/` */
const dataPath = normalize(dataPathOrig) + "/";
/** Transitio style path, normalized to use `/`, ending with `/` */
const stylePath = dataPath + "styles/";
/** Transitio plugin path, normalized to use `/`, ending with `/` */
const pluginPath = normalize(pluginPathOrig) + "/";

/**
 * Normalize a path to Unix style.
 * @param {string} path Path to normalize.
 * @returns {string} Normalized path.
 */
function normalize(path) {
    return path.replace(":\\", "://").replaceAll("\\", "/");
}

export {
    dataPath,
    stylePath,
    pluginPath,
    transitioVersion,
    /** Should only be used in main */
    configApi,
    normalize,
};
