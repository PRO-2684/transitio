// Description: The renderer script for the settings view of Transitio.
import { log, showDebugHint } from "./debug.js";
import { getSelectDefaultValue } from "./css.js";
import { setupSearch } from "./search.js";

/** Transitio plugin path. */
const pluginPath = LiteLoader.plugins.transitio.path.plugin.replace(":\\", "://").replaceAll("\\", "/"); // Normalized plugin path
/** Transitio data path. */
const dataPath = LiteLoader.plugins.transitio.path.data.replace(":\\", "://").replaceAll("\\", "/");
/** Attribute of `<details>` that stores the CSS path. */
const configDataAttr = "data-transitio-config";
/** Attribute of `<setting-switch>` that stores the CSS path. */
const switchDataAttr = "data-transitio-switch";
/** Attribute of `<details>` that indicates the CSS is deleted. */
const deletedDataAttr = "data-deleted";
/** The `name` attribute of the details element. */
const detailsName = "transitio-setting-details";
/** The expiration time of the last focused variable. */
const lastFocusedExpire = 1000;
/** Last focused style path, variable name and expiration time. */
let lastFocused = [null, null, 0];

/** Function to parse the value from the input/select element.
 * @param {Element} varInput The input/select element.
 * @returns {string|number|boolean} The value of the input element.
 */
function getValueFromInput(varInput) {
    switch (varInput.type) {
        case "number":
        case "percent":
        case "percentage":
            return parseFloat(varInput.value);
        case "checkbox":
            return varInput.checked;
        default: // text, color/colour, select, raw
            return varInput.value;
    }
}
/** Function to set the value to the input/select element.
 * @param {Element} varInput The input/select element.
 * @param {string|number|boolean} value The value to set.
 * @returns {void}
 */
function setValueToInput(varInput, value) {
    switch (varInput.type) {
        case "checkbox":
            varInput.checked = value;
            break;
        default: // text, color/colour, number, percent/percentage, select, raw
            varInput.value = value;
            break;
    }
}
/** Function to add a button to the right side of the setting item.
 * @param {Element} right The right side element.
 * @param {Object} args The `icon`, `title`, and `className` of the button.
 * @returns {Element} The added button.
 */
function addTransitioMore(right, args) {
    const more = right.appendChild(document.createElement("span"));
    more.textContent = args.icon;
    more.classList.add("transitio-more", args.className);
    more.title = args.title;
    return more;
}
/** Function to add a item representing the UserStyle with name and description.
 * @param {string} path The path of the CSS file.
 * @param {Element} container The container to add the item.
 * @returns {Element} The added `details` element.
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
    const configureBtn = addTransitioMore(right, { icon: "⚙️", title: "配置变量", className: "transitio-configure" });
    configureBtn.addEventListener("click", () => {
        if (!details.hasAttribute(deletedDataAttr) && !configureBtn.hasAttribute("disabled")) {
            details.toggleAttribute("open");
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
/** Function to construct the element used for inputting variables.
 * @param {Object} varObj The variable object.
 * @returns {Element} The element used for inputting variables.
 */
function constructVarInput(varObj) {
    let varInput;
    let defaultValue = varObj.args[0];
    switch (varObj.type) { // https://github.com/PRO-2684/transitio/wiki/4.-%E7%94%A8%E6%88%B7%E6%A0%B7%E5%BC%8F%E5%BC%80%E5%8F%91#%E7%B1%BB%E5%9E%8B-type
        case "color":
        case "colour":
            varInput = document.createElement("input");
            varInput.type = "color";
            varInput.placeholder = defaultValue;
            varInput.title = `默认值: ${defaultValue}`;
            varInput.toggleAttribute("required", true);
            break;
        case "number": {
            varInput = document.createElement("input");
            varInput.type = "number";
            const [_, min, max, step] = varObj.args;
            varInput.placeholder = defaultValue;
            varInput.title = `默认值: ${defaultValue}, 范围: [${min ?? "-∞"}, ${max ?? "+∞"}], 步长: ${step ?? "1"}`;
            varInput.min = min;
            varInput.max = max;
            varInput.step = step ?? 1;
            varInput.toggleAttribute("required", true);
            break;
        }
        case "percent":
        case "percentage": {
            varInput = document.createElement("input");
            varInput.type = "number";
            const [_, min, max, step] = varObj.args;
            varInput.placeholder = defaultValue;
            const effectiveMin = (min === undefined) ? 0 : min;
            const effectiveMax = (max === undefined) ? 100 : max;
            varInput.title = `默认值: ${defaultValue}%, 范围: [${effectiveMin ?? "-∞"}%, ${effectiveMax ?? "+∞"}%], 步长: ${step ?? "1"}%`;
            varInput.min = effectiveMin;
            varInput.max = effectiveMax;
            varInput.step = step ?? "1";
            varInput.toggleAttribute("required", true);
            break;
        }
        case "checkbox": {
            varInput = document.createElement("input");
            varInput.type = "checkbox";
            defaultValue = Boolean(defaultValue);
            varInput.title = `默认值: ${defaultValue}`;
            break;
        }
        case "select": {
            varInput = document.createElement("select");
            defaultValue = getSelectDefaultValue(varObj.args);
            varInput.title = `默认值: ${defaultValue}`;
            for (let i = 1; i < varObj.args.length; i++) {
                const option = varObj.args[i];
                const value = Array.isArray(option) ? option[0] : option;
                const label = Array.isArray(option) ? option[1] : option;
                const optionElement = document.createElement("option");
                optionElement.value = value;
                optionElement.textContent = label;
                varInput.appendChild(optionElement);
            }
            break;
        }
        default:
            // text, raw
            varInput = document.createElement("input");
            varInput.type = "text";
            varInput.placeholder = defaultValue;
            varInput.title = `默认值: ${defaultValue}`;
            varInput.toggleAttribute("required", true);
    }
    setValueToInput(varInput, varObj.value ?? defaultValue);
    return varInput;
}
/** Function to setup the easter egg at the settings view.
 * @param {HTMLElement} logo The logo element.
 * @returns {void}
 */
function setupEasterEgg(logo) {
    const title = document.querySelector(".setting-title");
    function lumos() {
        document.body.classList.remove("q-theme-tokens-dark");
        document.body.classList.add("q-theme-tokens-light");
        document.body.setAttribute("q-theme", "light");
        title.classList.add("lumos");
        setTimeout(() => {
            title.classList.remove("lumos");
        }, 2000);
    }
    function nox() {
        document.body.classList.remove("q-theme-tokens-light");
        document.body.classList.add("q-theme-tokens-dark");
        document.body.setAttribute("q-theme", "dark");
        title.classList.add("nox");
        setTimeout(() => {
            title.classList.remove("nox");
        }, 2000);
    }
    function currentTheme() {
        return document.body.getAttribute("q-theme");
    }
    logo.addEventListener("animationend", () => {
        document.startViewTransition(() => {
            if (currentTheme() == "light") {
                nox();
            } else {
                lumos();
            }
        });
    });
}
/** Function to initialize the settings view.
 * @param {Element} view The settings view element.
 * @returns {Promise<Element>} The container to add the items.
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
    async function importCSS() {
        if (this.files.length == 0) return; // No file selected
        this.parentNode.classList.toggle("is-loading", true);
        let cnt = 0;
        const promises = [];
        for (const file of this.files) {
            if (!file.name.endsWith(".css")) {
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
            alert(`成功导入 ${cnt} 个 CSS 文件`);
        } else {
            alert("没有导入任何 CSS 文件");
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
    $("#transitio-import").addEventListener("change", importCSS);
    // About - Version
    $("#transitio-version").textContent = LiteLoader.plugins.transitio.manifest.version;
    // About - Backgroud image
    ["version", "author", "issues", "submit"].forEach(id => {
        $(`#transitio-about-${id}`).style.backgroundImage = `url("local:///${pluginPath}/icons/${id}.svg")`;
    });
    // Logo
    const logo = $(".logo");
    logo.src = `local:///${pluginPath}/icons/icon.svg`;
    setupEasterEgg(logo);
    // Links
    view.querySelectorAll(".transitio-link").forEach(link => {
        if (!link.getAttribute("title")) {
            link.setAttribute("title", link.getAttribute("data-transitio-url"));
        }
        link.addEventListener("click", openURL);
    });
    const container = $("setting-section.snippets > setting-panel > setting-list");
    return container;
}
/** Function to handle `updateStyle` event on settings view.
 * @param {Element} container The settings container.
 * @param {Object} args The arguments of the event.
 * @returns {void}
 */
function transitioSettingsUpdateStyle(container, args) {
    const { path, meta, enabled } = args;
    const isDeleted = meta.name === " [已删除] ";
    const details = container.querySelector(`details[${configDataAttr}="${path}"]`) || addItem(path, container);
    // Summary part - Name and Description
    const item = details.querySelector("setting-item");
    const itemName = item.querySelector("setting-text");
    const optionalVersion = meta.version ? ` (v${meta.version})` : "";
    itemName.textContent = meta.name + optionalVersion;
    itemName.title = path;
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
    const noVariables = Object.keys(meta.variables).length === 0;
    configureBtn.toggleAttribute("disabled", noVariables);
    const switch_ = item.querySelector(`setting-switch[${switchDataAttr}="${path}"]`);
    switch_.toggleAttribute("is-active", enabled);
    switch_.parentNode.classList.toggle("is-loading", false);
    if (isDeleted) {
        details.toggleAttribute(deletedDataAttr, true);
    }
    // Details part
    for (const el of Array.from(details.children)) { // Remove all existing variables
        if (el.tagName === "SETTING-ITEM") {
            el.remove();
        }
    }
    if (noVariables) { // Close the details if there are no variables
        details.toggleAttribute("open", false);
    }
    const isLastFocusedStyle = lastFocused[0] === path;
    for (const [name, varObj] of Object.entries(meta.variables)) {
        const varItem = details.appendChild(document.createElement("setting-item"));
        varItem.setAttribute("data-direction", "row");
        const varName = varItem.appendChild(document.createElement("setting-text"));
        varName.textContent = varObj.label;
        varName.title = name;
        const varInput = varItem.appendChild(constructVarInput(varObj));
        varInput.addEventListener("change", () => {
            if (varInput.reportValidity()) {
                lastFocused = [path, name, Date.now() + lastFocusedExpire]; // Remember the last focused variable
                transitio.configChange(path, { [name]: getValueFromInput(varInput) });
            }
        });
        if (isLastFocusedStyle && lastFocused[1] === name && lastFocused[2] > Date.now()) {
            varInput.focus(); // Restore the focus
            lastFocused = [null, null, 0]; // Clear the last focused variable
        }
    }
    log("transitioSettingsUpdateStyle", path, enabled);
}
/** Function to handle `resetStyle` event on settings view.
 * @param {Element} container The settings container.
 * @returns {void}
 */
function transitioSettingsResetStyle(container) {
    const details = container.querySelectorAll(`details[${configDataAttr}]`);
    details.forEach((detail) => {
        detail.remove();
    });
}

export { initTransitioSettings, transitioSettingsUpdateStyle, transitioSettingsResetStyle };
