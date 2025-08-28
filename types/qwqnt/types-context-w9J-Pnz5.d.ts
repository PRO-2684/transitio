declare function storageUrlToPath(url: string): string;
declare function pathToStorageUrl(path: string, options?: {
    prefix?: string;
}): string;
declare const protocolExports: {
    readonly storageUrlToPath: typeof storageUrlToPath;
    readonly pathToStorageUrl: typeof pathToStorageUrl;
};
type ElectronProtocol = typeof protocolExports;

interface PluginManifest {
    inject?: {
        main?: string;
        preload?: string;
        renderer?: string;
    };
    dependencies?: Record<string, string>;
}
interface PluginMeta {
    namespace: string;
    path: string;
    packageJson: any & {
        qwqnt?: PluginManifest;
    };
}
interface Plugin {
    meta: PluginMeta;
}

type TomlValue = string | number | boolean | TomlValue[] | {
    [key: string]: TomlValue;
};
interface CoreExports {
    version: string;
    pathDll: string;
    configs: Record<string, TomlValue> & {
        core: {
            save: string;
            load: string;
        };
    };
}
interface FrameworkExports {
    version: string;
    paths: {
        configs: string;
        data: string;
        plugins: string;
        stylesheets: string;
    };
    protocol: ElectronProtocol;
    plugins: Record<string, Plugin>;
}
interface ContextGlobal {
    core: CoreExports;
    framework: FrameworkExports;
}

export type { ContextGlobal as C, Plugin as P };
