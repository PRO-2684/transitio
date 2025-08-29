import { join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";

const slug = "transitio";
const dataPath = join(qwqnt.framework.paths.data, slug);
const configPath = join(dataPath, "config.json");
const configApi = {
        get: () => {
            if (existsSync(configPath)) {
                const data = readFileSync(configPath, "utf-8");
                return JSON.parse(data);
            } else {
                return { styles: {} };
            }
        },
        set: (config) => writeFileSync(configPath, JSON.stringify(config, null, 4), "utf-8"),
};

export {
    dataPath,
    configApi,
}
