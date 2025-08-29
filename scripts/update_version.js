// Modify the version number at `manifest.json` file:
// `"version": "1.4.0",`, `"tag": "v1.4.0",`
// to the new version number.
// And then `git add manifest.json`.

import { readFileSync, writeFileSync } from "fs";
import { exec } from "child_process";
import { version } from "../package.json";
const manifestPath = "./manifest.json";

const data = readFileSync(manifestPath, "utf8");
const result = data
    .replace(/"version": "\d+\.\d+\.\d+",/, `"version": "${version}",`)
    .replace(/"tag": "v\d+\.\d+\.\d+",/, `"tag": "v${version}",`);
writeFileSync(manifestPath, result, "utf8");
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
