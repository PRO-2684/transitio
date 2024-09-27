// Description: Showing tips on settings view.

/**
 * Tips to show on settings view.
 * @type {Array<string>}
 */
const tips = [
    "使用 <code>--transitio-debug</code> 参数启动 QQNT 以启用 Debug 模式",
    "在用户样式上右键 <code>⚙️</code> 以重置此样式的所有配置项",
    "未聚焦到输入框的情况下，按 <kbd>Enter</kbd> 或 <kbd>Ctrl</kbd> + <kbd>F</kbd> 可以聚焦到搜索框",
    "为什么要用英文写 Release Notes？因为我懒得切输入法",
    "Transitio 从 <a href='https://github.com/PRO-2684/transitio/releases/tag/v1.3.2'>v1.3.2</a> 开始支持用户变量！",
    "Transitio 从 <a href='https://github.com/PRO-2684/transitio/releases/tag/v1.5.1'>v1.5.1</a> 开始支持 <a href='https://stylus-lang.com/'>Stylus 语言</a>！",
    "对 <a href='https://stylus-lang.com/'>Stylus 语言</a> 的支持使此插件的打包体积增大了 30 倍左右，但仍然保持在 <code>500KB</code> 以下",
    "Transitio <a href='https://github.com/PRO-2684/transitio/tree/v0.1.1'>v0.2.0 之前</a> 只是一个为 QQNT 添加过渡效果的插件，而现在已经发展成为一个用户样式管理器",
    // "搜索框中可以使用 <code>#preprocessor</code> 来筛选使用指定预处理器的样式 (例如 <code>#stylus</code>)", // 暂未实现
];
/**
 * Show a random tip.
 */
function randomTip(el, isFirst = false) {
    const length = isFirst ? 3 : tips.length;
    const tip = tips[Math.floor(Math.random() * length)];
    el.innerHTML = tip;
    el.querySelectorAll("a").forEach((a) => {
        if (a.title === "") {
            a.title = a.href;
        }
        a.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            transitio.open("link", a.href);
        });
    });
}
/**
 * Setup tips on settings view.
 * @param {HTMLElement} view The settings view.
 */
function setupTips(view) {
    const tipsContainer = view.querySelector("#transitio-tips");
    randomTip(tipsContainer, true);
    tipsContainer.addEventListener("click", () => randomTip(tipsContainer));
}

export { setupTips };
