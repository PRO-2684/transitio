// Description: Easter egg at settings view.

/** Function to setup the easter egg at the settings view.
 * @param {HTMLElement} logo - The logo element.
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

export { setupEasterEgg };
