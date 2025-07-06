/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare global {
  interface Window {
    CONSOLE_LOG_IGNORE: (...args: any[]) => void;
    CONSOLE_INFO_IGNORE: (...args: any[]) => void;
  }
}

export {};