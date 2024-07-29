const styleDataAttr = "data-transitio-style";
const $ = document.querySelector.bind(document);
const pluginPath = LiteLoader.plugins.transitio.path.plugin.replace(":\\", "://").replaceAll("\\", "/"); // Normalized plugin path
const dataPath = LiteLoader.plugins.transitio.path.data.replace(":\\", "://").replaceAll("\\", "/");
let isDebug = false;
function log(...args) {
    if (isDebug) {
        console.log("[Transitio]", ...args);
    }
}

// Helper function for css
function getSelectDefaultValue(varArgs) {
    // varArgs: [default-index, option1, option2, ...]
    //   option: [value, label] or value
    const defaultIndex = varArgs[0];
    const defaultOption = varArgs[defaultIndex + 1];
    if (Array.isArray(defaultOption)) {
        return defaultOption[0];
    } else {
        return defaultOption;
    }
}
function constructVarValue(varObj) {
    const value = varObj.value ?? varObj.args[0];
    switch (varObj.type) {
        case "text":
            return `"${CSS.escape(value)}"`;
        case "number":
            return isNaN(value) ? value : value.toString();
        case "percent":
        case "percentage":
            return isNaN(value) ? value : `${value}%`;
        case "checkbox":
            // varObj.args: [default-index/boolean, option1, option2, ...]
            //   option: value
            // varObj.value: default-index/boolean
            return value ? varObj.args[2] : varObj.args[1];
        case "select": {
            // varObj.args: [default-index, option1, option2, ...]
            //   option: [value, label] or value
            // varObj.value: value
            return varObj.value ?? getSelectDefaultValue(varObj.args);
        }
        default: // color/colour, raw
            return value.toString();
    }
}
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
function injectCSS(path, css) {
    const style = document.createElement("style");
    style.setAttribute(styleDataAttr, path);
    style.textContent = css;
    document.head.appendChild(style);
    return style;
}
function cssHelper(path, css, enabled, meta) {
    const current = $(`style[${styleDataAttr}="${path}"]`);
    log("Applying variables to", path, meta.variables)
    const processedCSS = enabled ? applyVariables(css, meta.variables) : `/* ${meta.description || "此文件没有描述"} */`;
    if (current) {
        current.textContent = processedCSS;
    } else {
        injectCSS(path, processedCSS);
    }
}

transitio.onUpdateStyle((event, args) => {
    cssHelper(args.path, args.css, args.enabled, args.meta);
});
transitio.onResetStyle(() => {
    const styles = document.querySelectorAll(`style[${styleDataAttr}]`);
    styles.forEach((style) => {
        style.remove();
    });
});
transitio.rendererReady();
isDebug = await transitio.queryIsDebug();
async function onSettingWindowCreated(view) {
    const configDataAttr = "data-transitio-config";
    const switchDataAttr = "data-transitio-switch";
    const deletedDataAttr = "data-deleted";
    const searchHiddenDataAttr = "data-search-hidden";
    log(pluginPath);
    const r = await fetch(`local:///${pluginPath}/settings.html`);
    const $ = view.querySelector.bind(view);
    const detailsName = "transitio-setting-details";
    view.innerHTML = await r.text();
    const container = $("setting-section.snippets > setting-panel > setting-list");
    // Helper functions for the setting window
    function addItem(path) { // Add a item representing the user CSS with name and description, returns the added details element
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
        function addTransitioMore(icon, title, className) {
            const more = right.appendChild(document.createElement("span"));
            more.textContent = icon;
            more.classList.add("transitio-more", className);
            more.title = title;
            return more;
        }
        const homepage = addTransitioMore("🔗", "打开样式主页", "transitio-homepage");
        homepage.addEventListener("click", () => {
            if (!details.hasAttribute(deletedDataAttr) && !homepage.hasAttribute("disabled")) {
                transitio.open("link", homepage.getAttribute("data-homepage-url"));
            }
        });
        const remove = addTransitioMore("🗑️", "删除此样式", "transitio-remove");
        remove.addEventListener("click", () => {
            if (!details.hasAttribute(deletedDataAttr)) {
                transitio.removeStyle(path);
            }
        });
        const showInFolder = addTransitioMore("📂", "在文件夹中显示", "transitio-folder");
        showInFolder.addEventListener("click", () => {
            if (!details.hasAttribute(deletedDataAttr)) {
                transitio.open("show", path);
            }
        });
        const configureBtn = addTransitioMore("⚙️", "配置变量", "transitio-configure");
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
    function constructVarInput(varObj) { // Construct the element used for inputting variables
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
    // Update the setting window
    transitio.onUpdateStyle((event, args) => {
        const { path, meta, enabled } = args;
        const isDeleted = meta.name === " [已删除] ";
        const details = $(`details[${configDataAttr}="${path}"]`) || addItem(path);
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
        for (const [name, varObj] of Object.entries(meta.variables)) {
            const varItem = details.appendChild(document.createElement("setting-item"));
            varItem.setAttribute("data-direction", "row");
            const varName = varItem.appendChild(document.createElement("setting-text"));
            varName.textContent = varObj.label;
            varName.title = name;
            const varInput = varItem.appendChild(constructVarInput(varObj));
            varInput.addEventListener("change", () => {
                if (varInput.reportValidity()) {
                    transitio.configChange(path, { [name]: getValueFromInput(varInput) });
                }
            });
        }
        log("onUpdateStyle", path, enabled);
    });
    transitio.onResetStyle(() => {
        const details = view.querySelectorAll(`[${configDataAttr}]`);
        details.forEach((detail) => {
            detail.remove();
        });
    });
    function devMode() {
        const enabled = this.toggleAttribute("is-active");
        transitio.devMode(enabled);
    }
    function openURI(type, uri) {
        console.log("[Transitio] Opening", type, uri);
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
                console.log("[Transitio] Ignored", file.name);
                continue;
            }
            promises.push(new Promise((resolve, reject) => {
                cnt++;
                console.log("[Transitio] Importing", file.name);
                let reader = new FileReader();
                reader.onload = () => {
                    transitio.importStyle(file.name, reader.result);
                    console.log("[Transitio] Imported", file.name);
                    resolve();
                };
                reader.readAsText(file);
            }));
        }
        await Promise.all(promises);
        this.parentNode.classList.toggle("is-loading", false);
        console.log("[Transitio] Imported", cnt, "files");
        if (cnt > 0) {
            alert(`成功导入 ${cnt} 个 CSS 文件`);
        } else {
            alert("没有导入任何 CSS 文件");
        }
    }
    transitio.rendererReady(); // We don't have to create a new function for this 😉
    // Search
    const inputTags = ["INPUT", "SELECT", "TEXTAREA"];
    const search = $("#transitio-search");
    const listToSearch = $("setting-section.snippets > setting-panel > setting-list");
    function getSummaryText(detail) { // Get a brief summary for searching
        const settingItem = detail.querySelector("summary > setting-item");
        const name = settingItem.querySelector("setting-text").textContent;
        const desc = settingItem.querySelector("setting-text[data-type='secondary']").textContent;
        return `${name}\n${desc}`.toLowerCase();
    }
    function doSearch() { // Main function for searching
        log("Search", search.value);
        const items = listToSearch.querySelectorAll("details");
        const searchWords = search.value.toLowerCase() // Convert to lowercase
            .split(" ") // Split by space
            .map(word => word.trim()) // Remove leading and trailing spaces
            .filter(word => word.length > 0); // Remove empty strings
        items.forEach((detail) => { // Iterate through all `details`
            const summaryText = getSummaryText(detail);
            const isMatch = searchWords.every(word => summaryText.includes(word)); // Check if all words are included
            detail.toggleAttribute(searchHiddenDataAttr, !isMatch); // Hide the `details` if it doesn't match
        });
    }
    document.addEventListener("keydown", (e) => {
        if (!view.checkVisibility()) return; // The setting window is not visible
        if (document.activeElement === search) { // The search bar is focused
            // Escape closes the window
            if (e.key === "Enter") { // Search
                search.scrollIntoView();
            }
        } else if (!inputTags.includes(document.activeElement.tagName)) { // Not focusing on some other input element
            // Focus on the search bar when "Enter" or "Ctrl + F" is pressed
            if (e.key === "Enter" || (e.ctrlKey && e.key === "f")) {
                e.preventDefault();
                search.focus();
                search.scrollIntoView();
            }
        }
    });
    search.addEventListener("change", doSearch);
    // Dev mode
    const dev = $("#transitio-dev");
    dev.addEventListener("click", devMode);
    transitio.queryDevMode().then(enabled => {
        log("queryDevMode", enabled);
        dev.toggleAttribute("is-active", enabled);
    });
    // Debug mode
    if (isDebug) {
        const debug = $("#transitio-debug");
        debug.style.color = "red";
        debug.title = "Debug 模式已激活";
    }
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
    // Easter egg
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
    // Links
    view.querySelectorAll(".transitio-link").forEach(link => {
        if (!link.getAttribute("title")) {
            link.setAttribute("title", link.getAttribute("data-transitio-url"));
        }
        link.addEventListener("click", openURL);
    });
}

export {
    onSettingWindowCreated
}