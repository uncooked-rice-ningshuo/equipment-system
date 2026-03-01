/**
 * Electron API 类型声明
 */

declare global {
  interface Window {
    electron: {
      invoke: <T>(channel: string, ...args: any[]) => Promise<T>;
    };
  }
}

export {};
