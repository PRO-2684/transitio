// Transitio's parser module for UserStyle metadata extraction.
import { createParser, util, ParseError } from "usercss-meta";

const parser = createParser({
    mandatoryKeys: ["name"],
    parseVar: { // Changes parser for checkbox so that it now returns a boolean. Ref: https://github.com/openstyles/usercss-meta/issues/93
        checkbox: parseBool
    },
    validateVar: { // Changes validator for checkbox so that it now asserts a boolean.
        checkbox: validateBool
    }
});

/**
 * Parses a boolean value.
 * @param {object} state The parser state.
 */
function parseBool(state) {
    util.parseChar(state);
    if (state.value === "0") {
        state.value = false;
    } else if (state.value === "1") {
        state.value = true;
    } else {
        throw new ParseError({
            code: "invalidBool",
            message: "value must be 0 or 1",
            index: state.valueIndex
        });
    }
}
/**
 * Validates a boolean value.
 * @param {object} state The parser state.
 */
function validateBool(state) {
    if (!state.value instanceof Boolean) {
        throw new ParseError({
            code: "invalidCheckboxDefault",
            message: "value must be 0 or 1",
            index: state.valueIndex
        });
    }
}
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
 * @returns {Array|null} The parsed arguments.
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
        const varData = { type: varType, label: varLabel, name: varName, value: null, default: null, options: null };
        switch (varType) {
            case "number":
            case "range":
            case "percent":
            case "percentage": {
                let [defaultValue, min, max, step] = varArgs;
                if (varType.startsWith("percent")) {
                    min ??= 0;
                    max ??= 100;
                }
                varData.default = defaultValue;
                varData.min = min ?? null;
                varData.max = max ?? null;
                varData.step = step ?? null;
                break;
            }
            case "checkbox":
                varData.default = Boolean(varArgs[0]);
                varData.options = varArgs.slice(1).map(v => { return { name: v, label: v, value: v } });
                break;
            case "select": {
                const defaultIndex = varArgs[0];
                const defaultOption = varArgs[defaultIndex + 1];
                if (Array.isArray(defaultOption)) {
                    varData.default = defaultOption[0];
                } else {
                    varData.default = defaultOption;
                }
                varData.options = varArgs.slice(1).map(v => {
                    if (Array.isArray(v)) {
                        return { name: v[0], label: v[1], value: v[0] };
                    } else {
                        return { name: v, label: v, value: v };
                    }
                });
                break;
            }
            default: // text, color, colour, raw
                varData.default = varArgs[0];
                break;
        }
        return [varName, varData];
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

export { extractUserStyleMetadata };
