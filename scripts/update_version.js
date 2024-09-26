// Modify the version number at `manifest.json` file:
// `"version": "1.4.0",`, `"tag": "v1.4.0",`
// to the new version number.
// And then `git add manifest.json`.

const fs = require("fs");
const { exec } = require("child_process");
const package = require("../package.json");
const manifestPath = "./manifest.json";

const version = package.version;
const data = fs.readFileSync(manifestPath, "utf8");
const result = data
    .replace(/"version": "\d+\.\d+\.\d+",/, `"version": "${version}",`)
    .replace(/"tag": "v\d+\.\d+\.\d+",/, `"tag": "v${version}",`);
fs.writeFileSync(manifestPath, result, "utf8");
console.log(`Updated version to ${version}`);

console.log("Adding manifest.json to git...");
exec("git add manifest.json", (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
