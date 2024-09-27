// Description: Showing tips on settings view.

/**
 * Tips to show on settings view.
 * @type {Array<string>}
 */
const tips = [
    // Usage tips
    "使用 <code>--transitio-debug</code> 参数启动 QQNT 以启用 <a href='https://github.com/PRO-2684/transitio/wiki/3.-Debug-%E6%A8%A1%E5%BC%8F'>Debug 模式</a>",
    "在用户样式上右键 <code>⚙️</code> 以重置此样式的所有配置项",
    "未聚焦到输入框的情况下，按 <kbd>Enter</kbd> 或 <kbd>Ctrl</kbd> + <kbd>F</kbd> 可以聚焦到搜索框",
    "除了点击 <code>选择文件</code> 按钮，你还可以直接拖拽文件到虚线区域来导入样式",
    "可以在 <code>data/transitio/styles/</code> 目录下创建快捷方式或软链接来导入样式",
    "点击 <code><span style='font-style: italic;'>用户样式列表</span></code> 可以快速打开 Transitio 的用户样式列表，双击 <code>导入用户样式...</code> 可以立即重载所有用户样式",
    "单击此处可以查看更多提示",
    // "按下 <kbd>Alt</kbd> 的同时拖拽文件到虚线区域可以导入用户样式的快捷方式或软链接", // Not implemented
    // "搜索框中可以使用 <code>#preprocessor</code> 来筛选使用指定预处理器的样式 (例如 <code>#stylus</code>)", // Not implemented
    // Dev notes
    "由于 Node.js <code>fs.watch</code> 实现问题，无法正常监控文件修改，因此开发者模式下检测到修改会重载所有样式，导致较大的性能损耗。实际上更推荐重新开关修改的用户样式来更新样式",
    "为什么要用英文写 Release Notes？因为我懒得切输入法",
    "对 <a href='https://stylus-lang.com/'>Stylus 语言</a> 的支持使此插件的打包体积增大了 30 倍左右，但仍然保持在 <code>500KB</code> 以下",
    "Electron 就是个勾八，和 <a href='https://tauri.app/'>Tauri</a> / <a href='https://neutralino.js.org/'>Neutralinojs</a> 比不了一点<br>什么？用户没有安装 WebView？那是用户的问题！",
    // History
    "Transitio 从 <a href='https://github.com/PRO-2684/transitio/releases/tag/v1.3.2'>v1.3.2</a> 开始支持用户变量！",
    "Transitio 从 <a href='https://github.com/PRO-2684/transitio/releases/tag/v1.5.1'>v1.5.1</a> 开始支持 <a href='https://stylus-lang.com/'>Stylus 语言</a>！",
    "Transitio <a href='https://github.com/PRO-2684/transitio/tree/v0.1.1'>v0.2.0 之前</a> 只是一个为 QQNT 添加过渡效果的插件，而现在已经发展成为一个用户样式管理器",
    // Misc
    "<a href='https://b23.tv/BV1GJ411x7h7' title='https://github.com/neverggyu/qq_svip_crack'>一键破解 QQ SVIP 功能</a>",
    "Ciallo～(∠・ω<)⌒☆",
];
/**
 * Current/Next tip index.
 * @type {number}
 */
let idx = Math.floor(Math.random() * 7); // Show usage tips first
/**
 * Show a random tip.
 */
function randomTip(el) {
    const random = Math.floor(Math.random() * (tips.length - 1));
    const tip = tips[idx];
    idx = random < idx ? random : random + 1; // -1, +1: Prevent showing the same tip twice in a row
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
