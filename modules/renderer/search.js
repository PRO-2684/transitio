// Description: Search module for settings view.
import { log } from "./debug.js";

/** The name of the highlight object for search */
const searchHighlightName = "transitio-search-highlight";
/** Attribute of `<details>` that indicates the style is hidden by search */
const searchHiddenDataAttr = "data-search-hidden";
/** Attribute of `<setting-text>` that indicates its respective preprocessor hashtag */
const hashtagDataAttr = "data-preprocessor";
/** Attribute of `<setting-text>` that indicates its preprocessor hashtag is highlighted by search */
const hashtagHighlightDataAttr = "data-hashtag-highlight";

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
 * @param {HTMLDetailsElement} details The `details` element to search.
 * @param {Set<string>} keywords The keywords to search.
 * @returns {boolean} Returns `true` if all keywords are found in the `details`.
 */
function searchAllAndHighlight(highlight, details, keywords) {
    const settingItem = details.querySelector("summary > setting-item");
    const nameEl = settingItem.querySelector("setting-text[data-type='primary']");
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
/** Check if the `details` contains one of the `hashtags`.
 * 1. If `hashtags` is empty, revert highlight and return `true`
 * 2. If found, highlight the tag and return `true`
 * 3. If not found, revert highlight and return `false`
 * @param {Set<string>} hashtags The hashtags to search. (without leading `#`)
 * @param {HTMLDetailsElement} details The `details` element to search.
 * @returns {boolean} Returns `true` if the `details` contains one of the `hashtags`.
 */
function matchHashtags(hashtags, details) {
    const itemName = details.querySelector("summary > setting-item setting-text[data-type='primary']");
    if (hashtags.size === 0) { // Case 1
        itemName.removeAttribute(hashtagHighlightDataAttr);
        return true;
    }
    const tag = itemName.getAttribute(hashtagDataAttr);
    const isMatch = hashtags.has(tag);
    itemName.toggleAttribute(hashtagHighlightDataAttr, isMatch); // Case 2 and 3
    return isMatch;
}
/**
 * Check if the `details` satisfies the `atRules`.
 * 1. If `atRules` is empty or all `atRules` are matched, return `true`
 * 2. If not all `atRules` are matched, return `false`
 * @param {Set<string>} atRules The at-rules to search. (without leading `@`)
 * @param {HTMLDetailsElement} details The `details` element to search.
 * @returns {boolean} Returns `true` if the `details` satisfies the `atRules`.
 */
function matchAtRules(atRules, details) {
    const switch_ = details.querySelector("summary > setting-item > .transitio-menu > setting-switch");
    const enabled = switch_.hasAttribute("is-active");
    let isMatch = true;
    for (const atRule of atRules) {
        switch (atRule) {
            case "enabled":
            case "on":
            case "1": // `@enabled`/`@on`/`@1`: Match if enabled
                isMatch = enabled; break;
            case "disabled":
            case "off":
            case "0": // `@disabled`/`@off`/`@0`: Match if disabled
                isMatch = !enabled; break;
        }
        if (!isMatch) break; // Stop if any rule is not matched
    }
    return isMatch;
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
    const words = text.toLowerCase() // Convert to lowercase
        .split(" ") // Split by space
        .map(word => word.trim()) // Remove leading and trailing spaces
        .filter(word => word.length > 0); // Remove empty strings
    // Split the `words` into normal words and hashtags
    const [searchWords, hashtags, atRules] = Array.from({ length: 3 }, () => new Set());
    function trimAndLower(word) {
        return word.slice(1).toLowerCase();
    }
    words.forEach((word) => {
        switch (word[0]) {
            case "#":
                hashtags.add(trimAndLower(word)); break;
            case "@":
                atRules.add(trimAndLower(word)); break;
            default:
                searchWords.add(word);
        }
    });
    items.forEach((details) => { // Iterate through all `details`
        const isMatch = searchAllAndHighlight(highlight, details, searchWords)
            && matchHashtags(hashtags, details)
            && matchAtRules(atRules, details);
        details.toggleAttribute(searchHiddenDataAttr, !isMatch); // Hide the `details` if it doesn't match
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
    CSS.highlights.set(searchHighlightName, highlight);
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
