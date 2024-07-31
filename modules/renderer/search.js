// Description: Search module for settings view.
import { log } from "./debug.js";

/** Attribute of `<details>` that indicates the CSS is hidden by search */
const searchHiddenDataAttr = "data-search-hidden";

/** Search `keyword` in the `el` and highlight the matched text.
 * @param {Highlight} highlight The highlight object.
 * @param {HTMLElement} el The element to search.
 * @param {string} keyword The keyword to search.
 * @returns {boolean} Returns `true` if a match is found.
 */
function searchAndHighlight(highlight, el, keyword) {
    if (!el) return false;
    const textContent = el.textContent.toLowerCase();
    let isMatch = false;
    let startIndex = 0;
    let index;
    while ((index = textContent.indexOf(keyword, startIndex)) !== -1) {
        const range = new Range();
        range.setStart(el.firstChild, index);
        range.setEnd(el.firstChild, index + keyword.length);
        highlight.add(range);
        isMatch = true;
        startIndex = index + keyword.length;
    }
    return isMatch;
}
/** Search all `keywords` in the `details` and highlight the matched text.
 * @param {Highlight} highlight The highlight object.
 * @param {HTMLElement} detail The `details` element to search.
 * @param {Set<string>} keywords The keywords to search.
 * @returns {boolean} Returns `true` if all keywords are found in the `details`.
 */
function searchAllAndHighlight(highlight, detail, keywords) {
    const settingItem = detail.querySelector("summary > setting-item");
    const nameEl = settingItem.querySelector("setting-text");
    const descEl = settingItem.querySelector("setting-text[data-type='secondary']");
    let matches = 0;
    for (const keyword of keywords) {
        const nameMatch = searchAndHighlight(highlight, nameEl, keyword);
        const descMatch = searchAndHighlight(highlight, descEl, keyword);
        if (nameMatch || descMatch) {
            matches++;
        }
    }
    return matches === keywords.size;
}
/** Perform search and hide the `details` that doesn't match the search.
 * @param {Highlight} highlight The highlight object.
 * @param {string} text The search text.
 * @param {HTMLElement} container The container element.
 * @returns {void}
 */
function doSearch(highlight, text, container) { // Main function for searching
    log("Search", text);
    highlight.clear(); // Clear previous highlights
    const items = container.querySelectorAll("details");
    const searchWords = new Set( // Use Set to remove duplicates
        text.toLowerCase() // Convert to lowercase
            .split(" ") // Split by space
            .map(word => word.trim()) // Remove leading and trailing spaces
            .filter(word => word.length > 0) // Remove empty strings
    );
    items.forEach((detail) => { // Iterate through all `details`
        const isMatch = searchAllAndHighlight(highlight, detail, searchWords);
        detail.toggleAttribute(searchHiddenDataAttr, !isMatch); // Hide the `details` if it doesn't match
    });
}
/** Setup the search bar for the settings view.
 * @param {HTMLElement} view The settings view.
 * @returns {void}
 */
function setupSearch(view) {
    const inputTags = ["INPUT", "SELECT", "TEXTAREA"];
    const search = view.querySelector("#transitio-search");
    const container = view.querySelector("setting-section.snippets > setting-panel > setting-list");
    const highlight = new Highlight();
    CSS.highlights.set("transitio-search-highlight", highlight);
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
    search.addEventListener("change", () => { doSearch(highlight, search.value, container); });
}

export { setupSearch };
