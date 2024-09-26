// Test `extractUserStyleMetadata` from modules/main/parser.js
const { extractUserStyleMetadata } = require("../modules/main/parser");
const fs = require("fs");

/** Recursively compare two Objects.
 * @param {Object} a The first object.
 * @param {Object} b The second object.
 * @returns {boolean} Whether the two objects are the same.
 */
function isSame(a, b) {
    if (typeof a !== typeof b) return false;
    if (typeof a !== "object") return a === b;
    if (a === null || b === null) return a === b;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!isSame(a[i], b[i])) return false;
        }
        return true;
    }
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
        if (keysA[i] !== keysB[i]) return false;
        if (!isSame(a[keysA[i]], b[keysA[i]])) return false;
    }
    return true;
}

// Read testcases from `tests/input` directory
const testcases = fs.readdirSync("tests/input").map(file => {
    // Filename
    const fname = file.split(".")[0];
    return {
        name: fname,
        input: fs.readFileSync(`tests/input/${file}`, "utf-8"),
        output: fs.readFileSync(`tests/output/${fname}.json`, "utf-8")
    };
});

// Run testcases
let success = true;
for (const { name, input, output } of testcases) {
    process.stdout.write(`- Testcase "${name}": `);
    const metadata = extractUserStyleMetadata(input);
    const expected = JSON.parse(output);
    if (isSame(metadata, expected)) {
        process.stdout.write("✅\n");
    } else {
        success = false;
        process.stdout.write("❌\n");
        console.log("  Expected:\n", expected);
        console.log("  Got:\n", metadata);
        console.log("  Full output:\n", JSON.stringify(metadata));
    }
}

if (success) {
    console.log("✅ All testcases passed!");
} else {
    console.log("❌ Some testcases failed!");
    process.exit(1);
}
