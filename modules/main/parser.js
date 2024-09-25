// Description: Transitio's parser module for UserStyle metadata extraction.
const usercssMeta = require("usercss-meta");
const parser = usercssMeta.createParser({
    mandatoryKeys: ["name"],
    parseVar: { // Changes parser for checkbox so that it now returns a boolean. Ref: `./node_modules/usercss-meta/lib/parse-util.js#L66`
        checkbox: function parseBool(state) {
            if (state.lastIndex >= state.text.length) {
                throw new EOFError(state.lastIndex);
            }
            state.index = state.lastIndex;
            state.value = state.text[state.lastIndex] === "1";
            state.lastIndex++;
            usercssMeta.util.eatWhitespace(state);
        }
    },
    validateVar: { // Changes validator for checkbox so that it now asserts a boolean. Ref: `./node_modules/usercss-meta/lib/parse.js#L296`
        checkbox: function validateBool(state) {
            if (!state.value instanceof Boolean) {
                throw new usercssMeta.ParseError({
                    code: 'invalidCheckboxDefault',
                    message: 'value must be 0 or 1',
                    index: state.valueIndex
                });
            }
        }
    }
});

/**
 * Get the description from the first line of the CSS content. (will be deprecated)
 * @param {string} css The CSS content.
 * @returns {string|null} The description or null if not found.
 */
function getDesc(css) {
    const firstLine = css.split("\n")[0].trim();
    if (firstLine.startsWith("/*") && firstLine.endsWith("*/")) {
        return firstLine.slice(2, -2).trim();
    } else {
        return null;
    }
}
/**
 * Parse arguments of `@var` line.
 * @param {string} args The arguments string.
 * @returns {Array|Object|null} The parsed arguments.
 */
function parseVarArgs(args) {
    try {
        const data = JSON.parse(args);
        if (data instanceof Array) {
            return data;
        } else {
            return [data];
        }
    } catch (e) {
        return null;
    }
}
/**
 * Parse `@var` line.
 * @param {string} value The value of the `@var` line.
 * @returns {Array|null} The parsed variable data.
 */
function processVar(value) {
    // Regular expression to match `@var <type> <name> "<label>" <args[]>/<default-value>` pattern
    const varMatch = value.match(/^(\S+)\s+(\S+)\s+"([^"]+)"\s+(.*)$/);
    if (varMatch) {
        const [_, varType, varName, varLabel, rawVarArgs] = varMatch;
        const varArgs = parseVarArgs(rawVarArgs);
        if (!varArgs) {
            return null;
        }
        return [varName, { "type": varType, "label": varLabel, "args": varArgs, "value": null }];
    } else {
        return null;
    }
}
/**
 * Parse the UserStyle metadata from the CSS content.
 * @param {string} css The CSS content.
 * @returns {Object} The UserStyle metadata.
 */
function extractUserStyleMetadata(css) {
    const result = { vars: {} };
    // Regular expression to match the UserStyle block with flexibility for multiple "=" and spaces
    const userStyleRegex = /\/\*\s*=+\s*UserStyle\s*=+\s*([\s\S]*?)\s*=+\s*\/UserStyle\s*=+\s*\*\//;
    const match = css.match(userStyleRegex);
    if (match) { // If the UserStyle block is found
        // Detect if preprocessor is `transitio`
        const content = match[1]; // Extract the content within the UserStyle block
        const isTransitio = content.match(/@preprocessor\s+transitio\s*$/m);
        if (!isTransitio) {
            const result = parser.parse(match[0].replaceAll("\r\n", "\n")).metadata;
            return result;
        } else {
            const lines = content.split('\n'); // Split the content by newline
            lines.forEach(line => {
                // Regular expression to match "@name value" pattern
                const matchLine = line.trim().match(/^@(\S+)\s+(.+)$/);
                if (matchLine) {
                    const name = matchLine[1]; // Extract the name
                    const value = matchLine[2]; // Extract the value
                    if (name === "var") {
                        const varData = processVar(value);
                        if (varData) {
                            const [varName, varObj] = varData;
                            result.vars[varName] = varObj;
                        }
                    } else {
                        result[name] = value; // Store in the result object
                    }
                }
            });
        }
    } else { // Fall back to the old method
        const comment = getDesc(css) || "";
        result["description"] = comment;
        result["preprocessor"] = "none"; // No preprocessor
    }
    return result;
}

module.exports = { extractUserStyleMetadata };
