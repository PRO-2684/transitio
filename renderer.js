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
        if (varObj.type === "text") {
            const escapedValue = CSS.escape(value);
            return `"${escapedValue}"`;
        } else {
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
    const varTypeToInputType = {
        "color": "color",
    };
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
        const remove = right.appendChild(document.createElement("span"));
        remove.textContent = "🗑️";
        remove.classList.add("transitio-more", "transitio-remove");
        remove.title = "删除此样式";
        remove.addEventListener("click", () => {
            if (!details.hasAttribute("data-deleted")) {
                transitio.removeStyle(path);
            }
        });
        const showInFolder = right.appendChild(document.createElement("span"));
        showInFolder.textContent = "📂";
        showInFolder.classList.add("transitio-more", "transitio-folder");
        showInFolder.title = "在文件夹中显示";
        showInFolder.addEventListener("click", () => {
            if (!details.hasAttribute("data-deleted")) {
                transitio.open("show", path);
            }
        });
        const configureBtn = right.appendChild(document.createElement("span"));
        configureBtn.textContent = "⚙️";
        configureBtn.classList.add("transitio-more", "transitio-configure");
        configureBtn.title = "配置变量";
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
        // Summary part
        const item = details.querySelector("setting-item");
        const itemName = item.querySelector("setting-text");
        const optionalVersion = meta.version ? ` (v${meta.version})` : "";
        itemName.textContent = meta.name + optionalVersion;
        itemName.title = path;
        const itemDesc = item.querySelector("setting-text[data-type='secondary']");
        itemDesc.textContent = meta.description || "此文件没有描述";
        itemDesc.title = itemDesc.textContent;
        const switch_ = item.querySelector(`setting-switch[${switchDataAttr}="${path}"]`);
        switch_.toggleAttribute("is-active", enabled);
        switch_.parentNode.classList.toggle("is-loading", false);
        if (isDeleted) {
            details.toggleAttribute("data-deleted", true);
        }
        // Details part
        for (const variable of Array.from(details.children)) { // Remove all existing variables
            if (variable.tagName === "SETTING-ITEM") {
                variable.remove();
            }
        }
        const configureBtn = item.querySelector("span.transitio-configure");
        const noVariables = Object.keys(meta.variables).length === 0;
        configureBtn.toggleAttribute("disabled", noVariables);
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
            varInput.type = varTypeToInputType[varObj.type] ?? "text";
            varInput.value = varObj.value ?? varObj["default-value"];
            varInput.addEventListener("change", () => {
                transitio.configChange(path, { [name]: varInput.value });
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