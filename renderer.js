export function onLoad() {
    const style = document.createElement("style");
    document.head.appendChild(style);
    style.id = "liteloader-transitio";
    style.textContent = `* {
        transition: background 0.2s ease-in-out, border 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }
    i.q-icon {
        transition: color 0.2s ease-in-out, background 0.2s ease-in-out, border 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }`;
}
