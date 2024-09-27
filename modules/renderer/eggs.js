// Description: Easter eggs.

/**
 * Lumos and Nox easter egg.
 * @param {HTMLElement} view The settings view element.
 */
function lumosNox(view) {
    const logo = view.querySelector(".logo");
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

/**
 * Wand easter egg.
 * @param {HTMLElement} view The settings view element.
 */
function wand(view) {
    const r = Math.random();
    if (r > 0.01) return;
    const title = document.querySelector(".setting-title");
    title.classList.add("wand");
}

/**
 * Easter eggs.
 * @type {Function[]}
 */
const eggs = [lumosNox, wand];

export { eggs };
