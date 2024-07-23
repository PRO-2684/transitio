const styleDataAttr = "data-transitio-style";
const configDataAttr = "data-transitio-config";
const switchDataAttr = "data-transitio-switch";
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
function applyVariables(css, variables) {
    // Regular expression to match the variable pattern `var(--name)`
    const varRegex = /var\(--([^)]+)\)/g;
    return css.replace(varRegex, (match, varName) => {
        const varObj = variables[varName];
        if (!varObj) {
            return match;
        }
        const value = varObj.value ?? varObj["default-value"];
        switch (varObj.type) {
            case "text":
                return `"${CSS.escape(value)}"`;
            case "number": {
                const float = parseFloat(value);
                return isNaN(float) ? match : float.toString();
            }
            case "percent":
            case "percentage": {
                const int = parseInt(value);
                return isNaN(int) ? match : `${int}%`;
            }
            default:
                // color/colour, raw
                return value;
        }
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
    log(pluginPath);
    const r = await fetch(`local:///${pluginPath}/settings.html`);
    const $ = view.querySelector.bind(view);
    const detailsName = "transitio-setting-details";
    view.innerHTML = await r.text();
    const container = $("setting-section.snippets > setting-panel > setting-list");
    function addItem(path) { // Add a list item with name and description, returns the switch
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
            if (!details.hasAttribute("data-deleted") && !homepage.hasAttribute("disabled")) {
                transitio.open("link", homepage.getAttribute("data-homepage-url"));
            }
        });
        const remove = addTransitioMore("🗑️", "删除此样式", "transitio-remove");
        remove.addEventListener("click", () => {
            if (!details.hasAttribute("data-deleted")) {
                transitio.removeStyle(path);
            }
        });
        const showInFolder = addTransitioMore("📂", "在文件夹中显示", "transitio-folder");
        showInFolder.addEventListener("click", () => {
            if (!details.hasAttribute("data-deleted")) {
                transitio.open("show", path);
            }
        });
        const configureBtn = addTransitioMore("⚙️", "配置变量", "transitio-configure");
        configureBtn.addEventListener("click", () => {
            if (!details.hasAttribute("data-deleted") && !configureBtn.hasAttribute("disabled")) {
                details.toggleAttribute("open");
            }
        });
        const switch_ = right.appendChild(document.createElement("setting-switch"));
        switch_.setAttribute(switchDataAttr, path);
        switch_.title = "启用/禁用此样式";
        switch_.addEventListener("click", () => {
            if (!details.hasAttribute("data-deleted")) {
                switch_.parentNode.classList.toggle("is-loading", true);
                transitio.configChange(path, switch_.toggleAttribute("is-active")); // Update the UI immediately, so it would be more smooth
            }
        });
        return details;
    }
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
            details.toggleAttribute("data-deleted", true);
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
            const varInput = varItem.appendChild(document.createElement("input"));
            varName.textContent = varObj.label;
            varName.title = name;
            switch (varObj.type) { // https://github.com/PRO-2684/transitio/wiki/4.-%E7%94%A8%E6%88%B7%E6%A0%B7%E5%BC%8F%E5%BC%80%E5%8F%91#%E7%B1%BB%E5%9E%8B-type
                case "color":
                case "colour":
                    varInput.type = "color";
                    varInput.placeholder = varObj["default-value"];
                    varInput.title = `默认值: ${varObj["default-value"]}`;
                    varInput.value = varObj.value;
                    break;
                case "number": {
                    varInput.type = "number";
                    const [defaultValue, min, max, step] = varObj["default-value"].split(",").map(parseFloat);
                    varInput.placeholder = defaultValue;
                    varInput.title = `默认值: ${defaultValue}, 范围: [${isFinite(min) ? min : "-∞"}, ${isFinite(max) ? max : "+∞"}], 步长: ${step ?? "1"}`;
                    varInput.min = isFinite(min) ? min : null;
                    varInput.max = isFinite(max) ? max : null;
                    varInput.step = step ?? "1";
                    if (varObj.value !== varObj["default-value"]) {
                        varInput.value = varObj.value;
                    } else {
                        varInput.value = defaultValue;
                    }
                    break;
                }
                case "percent":
                case "percentage": {
                    varInput.type = "number";
                    const [defaultValue, min, max, step] = varObj["default-value"].split(",").map(parseFloat);
                    varInput.placeholder = defaultValue;
                    varInput.title = `默认值: ${defaultValue}%, 范围: [${isFinite(min) ? min : "-∞"}%, ${isFinite(max) ? max : "+∞"}%], 步长: ${step ?? "1"}%`;
                    varInput.min = isFinite(min) ? min : 0;
                    varInput.max = isFinite(max) ? max : 100;
                    varInput.step = step ?? "1";
                    if (varObj.value !== varObj["default-value"]) {
                        varInput.value = varObj.value;
                    } else {
                        varInput.value = defaultValue;
                    }
                    break;
                }
                default:
                    // text, raw
                    varInput.type = "text";
                    varInput.placeholder = varObj["default-value"];
                    varInput.title = `默认值: ${varObj["default-value"]}`;
                    varInput.value = varObj.value;
            }
            varInput.toggleAttribute("required", true);
            varInput.addEventListener("change", () => {
                if (varInput.reportValidity()) {
                    transitio.configChange(path, { [name]: varInput.value });
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
    const dev = $("#transitio-dev");
    dev.addEventListener("click", devMode);
    transitio.queryDevMode().then(enabled => {
        log("queryDevMode", enabled);
        dev.toggleAttribute("is-active", enabled);
    });
    if (isDebug) {
        const debug = $("#transitio-debug");
        debug.style.color = "red";
        debug.title = "Debug 模式已激活";
    }
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