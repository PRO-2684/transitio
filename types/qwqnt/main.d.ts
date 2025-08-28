import { WebContents, BrowserWindow } from 'electron';
import { C as ContextGlobal } from './types-context-w9J-Pnz5.js';

type TransformerSignal = typeof HookTransformer.DO_NOTHING | typeof HookTransformer.CONSUMED;
declare class HookTransformer<T> extends Array<(value: T) => T | TransformerSignal | [TransformerSignal, T]> {
    static DO_NOTHING: symbol;
    static CONSUMED: symbol;
    on: (...items: ((value: T) => T | TransformerSignal | [TransformerSignal, T])[]) => number;
    peek: (callback: (value: T) => void) => number;
    emit(value: T): T;
}
declare class HookPeeker<T extends unknown[]> extends Array<(...args: T) => boolean | undefined | void> {
    on: (...items: ((...args: T) => boolean | undefined | void)[]) => number;
    emit: (...args: T) => boolean;
}

declare module 'electron' {
    interface BrowserWindow {
        readonly webContents: WebContents & {
            getRouting: typeof getRouting;
            insertJavaScript: typeof insertJavaScript;
        };
    }
}
declare function getRouting(this: WebContents): Promise<string | null>;
declare function insertJavaScript(this: WebContents, properties: HTMLScriptElement | {
    src: string;
    isCommonJs?: boolean;
}): void;
declare const hookExports: {
    readonly whenBrowserWindowCreating: HookPeeker<[options: Electron.BrowserWindowConstructorOptions]>;
    readonly whenBrowserWindowCreated: HookTransformer<BrowserWindow>;
};
type HooksElectron = typeof hookExports;

declare function ipcMainExport(channel: string, data: unknown): void;

interface ContextMain extends ContextGlobal {
    main: {
        deasync: {
            loopWhile(predicate: () => boolean): void;
            await<T>(promise: Promise<T>): T;
        };
        hooks: HooksElectron;
        export: typeof ipcMainExport;
    };
}
declare global {
    const qwqnt: Readonly<ContextMain>;
    function alert(message: unknown): void;
}

export type { ContextMain };
