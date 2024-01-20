const styleIdPrefix = "transitio-style-";
const configIdPrefix = "transitio-config-";
// Normalized plugin path
const pluginPath = LiteLoader.plugins.transitio.path.plugin.replace(":\\", "://").replaceAll("\\", "/");
let isDebug = false;
let log = () => { }; // Dummy function

// Helper function for css
function injectCSS(name, css) {
    const style = document.createElement("style");
    style.id = styleIdPrefix + name;
    style.textContent = css;
    document.head.appendChild(style);
    return style;
}
function cssHelper(name, css, enabled, comment) {
    const current = document.getElementById(styleIdPrefix + name);
    if (current) {
        current.textContent = enabled ? css : `/* ${comment || "此文件没有描述"} */`;
    } else {
        injectCSS(name, enabled ? css : `/* ${comment || "此文件没有描述"} */`);
    }
}

transitio.onUpdateStyle((event, args) => {
    cssHelper(...args);
});
transitio.onResetStyle(() => {
    const styles = document.querySelectorAll(`style[id^="${styleIdPrefix}"]`);
    styles.forEach((style) => {
        style.remove();
    });
});
transitio.rendererReady();
isDebug = await transitio.queryIsDebug();
if (isDebug) {
    log = console.log.bind(console, "[Transitio]");
}

async function onSettingWindowCreated(view) {
    log(pluginPath);
    const r = await fetch(`local:///${pluginPath}/settings.html`);
    view.innerHTML = await r.text();
    const container = view.querySelector("setting-section.snippets > setting-panel > setting-list");
    function addItem(name) { // Add a list item with name and description, returns the switch
        const item = document.createElement("setting-item");
        item.setAttribute("data-direction", "row");
        item.id = configIdPrefix + name + "-item";
        container.appendChild(item);
        const left = document.createElement("div");
        item.appendChild(left);
        const itemName = document.createElement("setting-text");
        itemName.textContent = name;
        left.appendChild(itemName);
        const itemDesc = document.createElement("setting-text");
        itemDesc.setAttribute("data-type", "secondary");
        left.appendChild(itemDesc);
        const switch_ = document.createElement("setting-switch");
        switch_.id = configIdPrefix + name;
        item.appendChild(switch_);
        switch_.addEventListener("click", () => {
            switch_.parentNode.classList.toggle("is-loading", true);
            transitio.configChange(name, switch_.toggleAttribute("is-active")); // Update the UI immediately, so it would be more smooth
        });
        return switch_;
    }
    transitio.onUpdateStyle((event, args) => {
        const [name, css, enabled, comment] = args;
        const switch_ = view.querySelector("#" + configIdPrefix + name)
            || addItem(name);
        switch_.toggleAttribute("is-active", enabled);
        switch_.parentNode.classList.toggle("is-loading", false);
        const span = view.querySelector(`setting-item#${configIdPrefix}${name}-item > div > setting-text[data-type="secondary"]`);
        span.textContent = comment || "此文件没有描述";
        log("onUpdateStyle", name, enabled);
    });
    transitio.onResetStyle(() => {
        const items = view.querySelectorAll(`[id^="${configIdPrefix}"]`);
        items.forEach((item) => {
            item.remove();
        });
    });
    function $(prop) { // Helper function for transitio selectors
        return view.querySelector(`#transitio-${prop}`);
    }
    function devMode() {
        const enabled = this.classList.toggle("is-active");
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
    const dev = $("dev");
    dev.addEventListener("click", devMode);
    transitio.queryDevMode().then(enabled => {
        log("queryDevMode", enabled);
        dev.toggleAttribute("is-active", enabled);
    });
    if (isDebug) {
        const debug = $("debug");
        debug.style.color = "red";
        debug.title = "Debug 模式已激活";
    }
    $("reload").addEventListener("dblclick", transitio.reloadStyle);
    $("open-folder").addEventListener("click", () => {
        openURI("folder", "styles"); // Relative to the data directory
    });
    $("import").addEventListener("change", importCSS);
    // About - Version
    $("version").textContent = LiteLoader.plugins.transitio.manifest.version;
    view.querySelectorAll(".transitio-link").forEach(link => {
        if (!link.getAttribute("title")) {
            link.setAttribute("title", link.getAttribute("data-transitio-url"));
        }
        link.addEventListener("click", openURL);
    });
    // About - Backgroud image
    ["version", "author", "issues", "submit"].forEach(id => {
        $(`about-${id}`).style.backgroundImage = `url("local:///${pluginPath}/icons/${id}.svg")`;
    });
}

export {
    onSettingWindowCreated
}