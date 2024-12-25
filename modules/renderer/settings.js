// Description: The renderer script for the settings view of Transitio.
import { log, showDebugHint } from "./debug.js";
import { setupSearch } from "./search.js";
import { setupEasterEggs } from "./eggs.js";
import { setupTips } from "./tips.js";

/** Transitio plugin path. */
const pluginPath = LiteLoader.plugins.transitio.path.plugin.replace(":\\", "://").replaceAll("\\", "/"); // Normalized plugin path
/** Transitio data path. */
const dataPath = LiteLoader.plugins.transitio.path.data.replace(":\\", "://").replaceAll("\\", "/");
/** Attribute of `<details>` that stores the style path. */
const configDataAttr = "data-transitio-config";
/** Attribute of `<setting-switch>` that stores the style path. */
const switchDataAttr = "data-transitio-switch";
/** Attribute of `<details>` that indicates the style is deleted. */
const deletedDataAttr = "data-deleted";
/** The `name` attribute of the details element. */
const detailsName = "transitio-setting-details";
/** Supported extensions for style files. */
const supportedExtensions = LiteLoader.plugins.transitio.manifest.supported_extensions;

/** Function to parse the value from the input/select element.
 * @param {HTMLInputElement|HTMLSelectElement} varInput The input/select element.
 * @returns {string|number|boolean} The value of the input element.
 */
function getValueFromInput(varInput) {
    switch (varInput.type) {
        case "number":
        case "range":
            return parseFloat(varInput.value);
        case "checkbox":
            return varInput.checked;
        default: // text, color/colour, select, raw
            return varInput.value;
    }
}
/** Function to set the value to the input/select element, and dispatches a "change" event if value changes. Do nothing if the value is null or undefined.
 * @param {HTMLInputElement|HTMLSelectElement} varInput The input/select element.
 * @param {string|number|boolean|null|undefined} value The value to set.
 * @returns {void}
 */
function setValueToInput(varInput, value) {
    if (value === null || value === undefined) return;
    let changed = false;
    switch (varInput.type) {
        case "checkbox":
            changed = varInput.checked !== value;
            if (changed) varInput.checked = value;
            break;
        default: // text, color/colour, percent/percentage, select, raw
            changed = varInput.value !== String(value); // Convert to string to compare
            if (changed) varInput.value = value;
            break;
    }
    if (changed) {
        varInput.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { fromCallback: true } }));
    }
}
/** Function to add a button to the right side of the setting item.
 * @param {HTMLDivElement} right The right side element.
 * @param {Object} args The `icon`, `title`, and `className` of the button.
 * @returns {HTMLSpanElement} The added button.
 */
function addTransitioMore(right, args) {
    const more = right.appendChild(document.createElement("span"));
    more.textContent = args.icon;
    more.classList.add("transitio-more", args.className);
    more.title = args.title;
    return more;
}
/** Function to add a item representing the UserStyle with name and description.
 * @param {string} path The path of the style file.
 * @param {HTMLElement} container The container to add the item.
 * @returns {HTMLDetailsElement} The added `details` element.
 */
function addItem(path, container) {
    const details = container.appendChild(document.createElement("details"));
    details.setAttribute(configDataAttr, path);
    details.name = detailsName;
    const summary = details.appendChild(document.createElement("summary"));
    summary.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent opening the details when clicking the summary
    });
    // Summary part
    const item = summary.appendChild(document.createElement("setting-item"));
    item.setAttribute("data-direction", "row");
    const left = item.appendChild(document.createElement("div"));
    const itemName = left.appendChild(document.createElement("setting-text"));
    itemName.setAttribute("data-type", "primary");
    itemName.setAttribute("data-preprocessor", "Unknown");
    const itemDesc = document.createElement("setting-text");
    itemDesc.setAttribute("data-type", "secondary");
    left.appendChild(itemDesc);
    const right = item.appendChild(document.createElement("div"));
    right.classList.add("transitio-menu");
    const homepage = addTransitioMore(right, { icon: "🔗", title: "打开样式主页", className: "transitio-homepage" });
    homepage.addEventListener("click", () => {
        if (!details.hasAttribute(deletedDataAttr) && !homepage.hasAttribute("disabled")) {
            transitio.open("link", homepage.getAttribute("data-homepage-url"));
        }
    });
    const remove = addTransitioMore(right, { icon: "🗑️", title: "删除此样式", className: "transitio-remove" });
    remove.addEventListener("click", () => {
        if (!details.hasAttribute(deletedDataAttr)) {
            transitio.removeStyle(path);
        }
    });
    const showInFolder = addTransitioMore(right, { icon: "📂", title: "在文件夹中显示", className: "transitio-folder" });
    showInFolder.addEventListener("click", () => {
        if (!details.hasAttribute(deletedDataAttr)) {
            transitio.open("show", path);
        }
    });
    const configureBtn = addTransitioMore(right, { icon: "⚙️", title: "配置变量，右键以重置为默认值", className: "transitio-configure" });
    configureBtn.addEventListener("click", () => {
        if (!details.hasAttribute(deletedDataAttr) && !configureBtn.hasAttribute("disabled")) {
            details.toggleAttribute("open");
        }
    });
    configureBtn.addEventListener("mouseup", (e) => {
        if (!details.hasAttribute(deletedDataAttr) && !configureBtn.hasAttribute("disabled")
            && e.button === 2 && !e.ctrlKey && !e.shiftKey && !e.altKey) {
            transitio.resetStyle(path);
        }
    });
    const switch_ = right.appendChild(document.createElement("setting-switch"));
    switch_.setAttribute(switchDataAttr, path);
    switch_.title = "启用/禁用此样式";
    switch_.addEventListener("click", () => {
        if (!details.hasAttribute(deletedDataAttr)) {
            switch_.parentNode.classList.toggle("is-loading", true);
            transitio.configChange(path, switch_.toggleAttribute("is-active")); // Update the UI immediately, so it would be more smooth
        }
    });
    return details;
}
/** Function to create an input element for number-like variables.
 * @param {string} type The type of the variable.
 * @param {Object} args The arguments of the variable.
 * @param {Number} args.defaultValue The default value of the variable.
 * @param {number|undefined} args.min The minimum value of the variable.
 * @param {number|undefined} args.max The maximum value of the variable.
 * @param {number|undefined} args.step The step value of the variable.
 * @returns {HTMLInputElement} The created input element.
 */
function createNumberLikeInput(type, args) {
    const input = document.createElement("input");
    input.type = type;
    input.placeholder = args.defaultValue;
    input.title = `默认值: ${args.defaultValue}, 范围: [${args.min ?? "-∞"}, ${args.max ?? "+∞"}], 步长: ${args.step ?? "1"}`;
    input.min = args.min;
    input.max = args.max;
    input.step = args.step ?? 1;
    input.toggleAttribute("required", true);
    return input;
}
/** Function to create a `range` and a `number` input that're linked together.
 * @param {Object} args The arguments of the variable.
 * @param {Number} args.defaultValue The default value of the variable.
 * @param {number|undefined} args.min The minimum value of the variable.
 * @param {number|undefined} args.max The maximum value of the variable.
 * @param {number|undefined} args.step The step value of the variable.
 * @returns {HTMLInputElement[]} The created input elements.
 */
function createLinkedInputs(args) {
    const range = createNumberLikeInput("range", args);
    const number = createNumberLikeInput("number", args);
    range.addEventListener("input", () => {
        number.value = range.value;
    });
    range.addEventListener("change", () => {
        number.value = range.value;
    });
    number.addEventListener("input", () => {
        if (number.checkValidity()) {
            range.value = number.value;
        }
    });
    number.addEventListener("change", () => {
        if (number.reportValidity()) {
            range.value = number.value;
            range.dispatchEvent(new CustomEvent("change", { bubbles: true, detail: { fromCallback: false } }));
        }
    });
    return [range, number];
}
/** Function to add the element(s) used for inputting variables, with its value set as default.
 * @param {HTMLLabelElement} varItem The parent element of our input element(s).
 * @param {Object} varObj The variable object.
 * @returns {HTMLInputElement|HTMLSelectElement} The primary element used for inputting variables.
 */
function addVarInput(varItem, varObj) {
    let varInput;
    let defaultValue = varObj.default;
    switch (varObj.type) { // https://github.com/openstyles/stylus/wiki/Writing-UserCSS#type
        case "color":
        case "colour":
            varInput = document.createElement("input");
            varInput.type = "color";
            varInput.title = `默认值: ${defaultValue}`;
            varInput.toggleAttribute("required", true);
            break;
        case "checkbox":
            varInput = document.createElement("input");
            varInput.type = "checkbox";
            varInput.title = `默认值: ${defaultValue}`;
            break;
        case "select": {
            varInput = document.createElement("select");
            varInput.title = `默认值: ${defaultValue}`;
            for (const option of varObj.options) {
                const optionElement = document.createElement("option");
                optionElement.value = option.name;
                optionElement.textContent = option.label;
                varInput.appendChild(optionElement);
            }
            break;
        }
        case "number": {
            const { min, max, step } = varObj;
            varInput = createNumberLikeInput("number", { defaultValue, min, max, step });
            break;
        }
        case "percent":
        case "percentage":
        case "range": {
            const { min, max, step } = varObj;
            const [range, number] = createLinkedInputs({ defaultValue, min, max, step });
            varInput = range;
            varItem.appendChild(number);
            break;
        }
        default:
            // text, raw
            varInput = document.createElement("input");
            varInput.type = "text";
            varInput.title = `默认值: ${defaultValue}`;
            varInput.toggleAttribute("required", true);
    }
    varInput.placeholder = defaultValue;
    setValueToInput(varInput, defaultValue);
    varItem.appendChild(varInput);
    return varInput;
}
/** Function to initialize the settings view.
 * @param {HTMLElement} view The settings view element.
 * @returns {Promise<HTMLElement>} The container to add the items.
 */
async function initTransitioSettings(view) {
    const r = await fetch(`local:///${pluginPath}/settings.html`);
    const $ = view.querySelector.bind(view);
    view.innerHTML = await r.text();
    function devMode() {
        const enabled = this.toggleAttribute("is-active");
        transitio.devMode(enabled);
    }
    function openURI(type, uri) {
        log("Opening", type, uri);
        transitio.open(type, uri);
    }
    function openURL() {
        const url = this.getAttribute("data-transitio-url");
        openURI("link", url);
    }
    function hasValidExtension(name) {
        for (const ext of supportedExtensions) {
            if (name.endsWith(ext)) {
                return true;
            }
        }
        return false;
    }
    async function importStyle() {
        if (this.files.length == 0) return; // No file selected
        this.parentNode.classList.toggle("is-loading", true);
        let cnt = 0;
        const promises = [];
        for (const file of this.files) {
            if (!hasValidExtension(file.name)) {
                log("Ignored", file.name);
                continue;
            }
            promises.push(new Promise((resolve, reject) => {
                cnt++;
                log("Importing", file.name);
                let reader = new FileReader();
                reader.onload = () => {
                    transitio.importStyle(file.name, reader.result);
                    log("Imported", file.name);
                    resolve();
                };
                reader.readAsText(file);
            }));
        }
        await Promise.all(promises);
        this.parentNode.classList.toggle("is-loading", false);
        log("Imported", cnt, "files");
        if (cnt > 0) {
            alert(`成功导入 ${cnt} 个用户样式`);
        } else {
            alert("没有导入任何用户样式`);");
        }
    }
    // Search
    setupSearch(view);
    // Dev mode
    const dev = $("#transitio-dev");
    dev.addEventListener("click", devMode);
    transitio.queryDevMode().then(enabled => {
        log("queryDevMode", enabled);
        dev.toggleAttribute("is-active", enabled);
    });
    // Debug mode
    showDebugHint(view);
    // Buttons
    $("#transitio-reload").addEventListener("dblclick", transitio.reloadStyle);
    $("#transitio-open-folder").addEventListener("click", () => {
        openURI("path", `${dataPath}/styles`); // Relative to the data directory
    });
    const importBtn = $("#transitio-import");
    importBtn.accept = supportedExtensions.join(",");
    importBtn.addEventListener("change", importStyle);
    // About - Version
    $("#transitio-version").textContent = LiteLoader.plugins.transitio.manifest.version;
    // About - Backgroud image
    ["version", "author", "issues", "submit"].forEach(id => {
        $(`#transitio-about-${id}`).style.backgroundImage = `url("local:///${pluginPath}/icons/${id}.svg")`;
    });
    // Logo
    const logo = $(".logo");
    logo.src = `local:///${pluginPath}/icons/icon.svg`;
    // Links
    view.querySelectorAll(".transitio-link").forEach(link => {
        if (!link.getAttribute("title")) {
            link.setAttribute("title", link.getAttribute("data-transitio-url"));
        }
        link.addEventListener("click", openURL);
    });
    setupEasterEggs(view);
    setupTips(view);
    const container = $("setting-section.snippets > setting-panel > setting-list");
    return container;
}
/** Function to add a variable to the UserStyle.
 * @param {HTMLDetailsElement} details The details element.
 * @param {string} path The path of the UserStyle.
 * @param {string} name The name of the variable.
 * @param {Object} varObj The variable object.
 * @returns {HTMLInputElement|HTMLSelectElement} The added variable's input element.
 */
function addVar(details, path, name, varObj) {
    const varItem = details.appendChild(document.createElement("label"));
    varItem.textContent = varObj.label;
    varItem.title = name;
    const varInput = addVarInput(varItem, varObj);
    varInput.addEventListener("change", (e) => {
        if (!e.detail?.fromCallback && varInput.reportValidity()) {
            const msg = { [name]: getValueFromInput(varInput) };
            log("configChange", path, msg);
            transitio.configChange(path, msg);
        }
    });
    return varInput;
}
/** Function to handle `updateStyle` event on settings view.
 * @param {HTMLElement} container The settings container.
 * @param {Object} args The arguments of the event.
 * @returns {void}
 */
function transitioSettingsUpdateStyle(container, args) {
    // log("transitioSettingsUpdateStyle", args);
    const { path, meta, enabled } = args;
    const isDeleted = meta.name === " [已删除] ";
    const details = container.querySelector(`details[${configDataAttr}="${path}"]`) ?? addItem(path, container);
    // Summary part - Name and Description
    const item = details.querySelector("summary > setting-item");
    const itemName = item.querySelector("setting-text[data-type='primary']");
    const optionalVersion = meta.version ? ` (v${meta.version})` : "";
    itemName.textContent = meta.name + optionalVersion;
    itemName.title = path;
    itemName.setAttribute("data-preprocessor", meta.preprocessor);
    const itemDesc = item.querySelector("setting-text[data-type='secondary']");
    itemDesc.textContent = meta.description || "此文件没有描述";
    itemDesc.title = itemDesc.textContent;
    // Summary part - More
    const homepage = item.querySelector("span.transitio-homepage");
    const url = meta.homepageURL;
    if (url && (url.startsWith("https://") || url.startsWith("http://"))) {
        homepage.setAttribute("data-homepage-url", url);
        homepage.toggleAttribute("disabled", false);
    } else {
        homepage.removeAttribute("data-homepage-url");
        homepage.toggleAttribute("disabled", true);
    }
    const configureBtn = item.querySelector("span.transitio-configure");
    const noVariables = !meta.vars || (Object.keys(meta.vars).length === 0);
    configureBtn.toggleAttribute("disabled", noVariables);
    const switch_ = item.querySelector(`setting-switch[${switchDataAttr}="${path}"]`);
    switch_.toggleAttribute("is-active", enabled);
    switch_.parentNode.classList.toggle("is-loading", false);
    if (isDeleted) {
        details.toggleAttribute(deletedDataAttr, true);
    }
    // Details part
    if (noVariables) { // Close the details if there are no variables
        details.toggleAttribute("open", false);
    } else {
        for (const [name, varObj] of Object.entries(meta.vars)) {
            const varInput = details.querySelector(`label[title="${name}"] > input`)
                ?? details.querySelector(`label[title="${name}"] > select`)
                ?? addVar(details, path, name, varObj);
            setValueToInput(varInput, varObj.value ?? varObj.default);
        }
    }
    log("transitioSettingsUpdateStyle", path, enabled);
}
/** Function to handle `resetStyle` event on settings view.
 * @param {HTMLElement} container The settings container.
 * @returns {void}
 */
function transitioSettingsResetStyle(container) {
    const details = container.querySelectorAll(`details[${configDataAttr}]`);
    details.forEach((detail) => {
        detail.remove();
    });
}

export { initTransitioSettings, transitioSettingsUpdateStyle, transitioSettingsResetStyle };
