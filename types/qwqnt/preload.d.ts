import { C as ContextGlobal, P as Plugin } from './types-context-w9J-Pnz5.js';

declare function ipcRendererImport(channel: string): any;

interface ContextPreload extends ContextGlobal {
    preload: {
        import: typeof ipcRendererImport;
    };
}
declare global {
    const qwqnt: Readonly<ContextPreload>;
    const __self: Plugin;
    function evalModule(script: string, self?: unknown): void;
}

export type { ContextPreload };
