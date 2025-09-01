// Utilities related to styles.

/** Attribute name for the style element to store the path of the style file. */
const styleDataAttr = "data-transitio-style";

/**
 * Construct the value of a variable, to be applied into the style. (transitio preprocessor)
 * @param {Object} varObj Variable object.
 * @returns {String} The value of the variable.
 */
function constructVarValue(varObj) {
    const value = varObj.value ?? varObj.default;
    switch (varObj.type) {
        case "text":
            return `"${CSS.escape(value)}"`;
        case "number":
        case "range":
            return isNaN(value) ? value : value.toString();
        case "percent":
        case "percentage":
            return isNaN(value) ? value : `${value}%`;
        case "checkbox":
            return value ? varObj.options[1].value : varObj.options[0].value;
        default: // select, color/colour, raw
            return value.toString();
    }
}
/**
 * Apply variables to the CSS (transitio preprocessor).
 * @param {String} css CSS content.
 * @param {Object} variables A dictionary of variables.
 * @returns {String} The CSS content with variables applied.
 */
function applyVariables(css, variables) {
    // Regular expression to match the variable pattern `var(--name)`
    const varRegex = /var\(--([^)]+)\)/g;
    return css.replace(varRegex, (match, varName) => {
        const varObj = variables[varName];
        if (!varObj) {
            return match;
        }
        return constructVarValue(varObj);
    });
}
/**
 * Inject CSS into the document.
 * @param {String} path Path of the CSS file.
 * @param {String} css CSS content.
 * @returns {HTMLStyleElement} The style element.
 */
function injectCSS(path, css) {
    const style = document.createElement("style");
    style.setAttribute(styleDataAttr, path);
    style.textContent = css;
    document.documentElement.append(style);
    return style;
}
/**
 * Helper function that applies variables to CSS and injects it into the document (or updates an existing style element).
 * @param {String} path Path of the CSS file.
 * @param {String} css CSS content.
 * @param {Boolean} enabled Whether the CSS shall be enabled.
 * @param {Object} meta Metadata of the CSS file.
 */
function cssHelper(path, css, enabled, meta) {
    const current = document.querySelector(`style[${styleDataAttr}="${path}"]`);
    const processedCSS = enabled ? (meta.preprocessor === "transitio" ? applyVariables(css, meta.vars) : css) : `/* ${meta.description || "此文件没有描述"} */`;
    if (current) {
        current.textContent = processedCSS;
    } else {
        injectCSS(path, processedCSS);
    }
}
/**
 * Remove all styles injected by transitio.
 */
function removeAllStyles() {
    const styles = document.querySelectorAll(`style[${styleDataAttr}]`);
    styles.forEach((style) => {
        style.remove();
    });
}

export { cssHelper, removeAllStyles };
