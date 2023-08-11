const styleIdPrefix = "transitio-style-";
const configIdPrefix = "transitio-config-";
const plugin_path = LiteLoader.plugins.transitio.path.plugin;

// Helper function for css
function injectCSS(name, css) {
    let style = document.createElement("style");
    style.id = styleIdPrefix + name;
    style.textContent = css;
    document.head.appendChild(style);
    return style;
}
function cssHelper(name, css, enabled, comment) {
    let current = document.getElementById(styleIdPrefix + name);
    if (current) {
        current.textContent = enabled ? css : `/* ${comment || "此文件没有描述"} */`;
    } else {
        current = injectCSS(name, enabled ? css : `/* ${comment || "此文件没有描述"} */`);
    }
}
async function onLoad() {
    transitio.onUpdateStyle((event, args) => {
        cssHelper(...args);
    });
    transitio.onResetStyle(() => {
        let styles = document.querySelectorAll(`style[id^="${styleIdPrefix}"]`);
        styles.forEach((style) => {
            style.remove();
        });
    });
    transitio.rendererReady();
}
async function onConfigView(view) {
    let r = await fetch(`llqqnt://local-file/${plugin_path}/settings.html`);
    view.innerHTML = await r.text();
    let container = view.querySelector("section.snippets > div.wrap");
    function addItem(name) { // Add a list item with name and description, returns the switch
        let divider = document.createElement("hr");
        divider.className = "horizontal-dividing-line";
        divider.id = configIdPrefix + name + "-divider";
        container.appendChild(divider);
        let item = document.createElement("div");
        item.className = "vertical-list-item";
        item.id = configIdPrefix + name + "-item";
        container.appendChild(item);
        let left = document.createElement("div");
        item.appendChild(left);
        let h2 = document.createElement("h2");
        h2.textContent = name;
        left.appendChild(h2);
        let span = document.createElement("span");
        span.className = "secondary-text";
        left.appendChild(span);
        let switch_ = document.createElement("div");
        switch_.className = "q-switch";
        switch_.id = configIdPrefix + name;
        item.appendChild(switch_);
        let span2 = document.createElement("span");
        span2.className = "q-switch__handle";
        switch_.appendChild(span2);
        switch_.addEventListener("click", () => {
            switch_.classList.toggle("is-active"); // Update the UI immediately, so it would be more smooth
            transitio.configChange(name, switch_.classList.contains("is-active"));
        });
        return switch_;
    }
    transitio.onUpdateStyle((event, args) => {
        let [name, css, enabled, comment] = args;
        let switch_ = view.querySelector("#" + configIdPrefix + name)
            || addItem(name);
        switch_.classList.toggle("is-active", enabled);
        let span = view.querySelector(`div#${configIdPrefix}${name}-item > div > span.secondary-text`);
        span.textContent = comment || "此文件没有描述";
        // console.log("[Transitio] onUpdateStyle", name, enabled); // DEBUG
    });
    transitio.onResetStyle(() => {
        let items = view.querySelectorAll(`[id^="${configIdPrefix}"]`);
        items.forEach((item) => {
            item.remove();
        });
    });
    function devMode() {
        let enabled = this.classList.toggle("is-active");
        transitio.devMode(enabled);
    }
    function importCSS() {
        if (this.files.length == 0) return; // No file selected
        for (let file of this.files) {
            console.log("[Transitio] Importing", file.name);
        }
    }
    transitio.rendererReady(); // We don't have to create a new function for this 😉
    view.querySelector("div#transitio-dev").addEventListener("click", devMode);
    view.querySelector("h2#transitio-reload").addEventListener("dblclick", transitio.reloadStyle);
    view.querySelector("input#transitio-import").addEventListener("change", importCSS);
}

export {
    onLoad,
    onConfigView
}