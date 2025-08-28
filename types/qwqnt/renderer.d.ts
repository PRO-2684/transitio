import { ComponentInternalInstance } from 'vue';
import { C as ContextGlobal, P as Plugin } from './types-context-w9J-Pnz5.js';

declare global {
    interface HTMLElement {
        __VUE__?: ComponentInternalInstance[];
    }
    interface WindowEventMap {
        'vue:component-mount': CustomEvent<ComponentInternalInstance>;
        'vue:component-unmount': CustomEvent<ComponentInternalInstance>;
    }
}

type ContextRenderer = ContextGlobal;
declare global {
    const qwqnt: Readonly<ContextRenderer>;
    interface Window {
        qwqnt: Readonly<ContextRenderer>;
    }
    const __self: Plugin;
}

export type { ContextRenderer };
