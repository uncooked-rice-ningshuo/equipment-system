/**
 * Electron Preload Script
 * 安全地暴露 IPC API 到渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron';

// 定义暴露给渲染进程的 API
export interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

// 白名单通道（安全考虑，只允许这些通道）
const validChannels = [
  // 认证
  'auth:login',
  'auth:logout',
  'auth:verify',
  'auth:changePassword',
  // 设备
  'device:list',
  'device:getById',
  'device:create',
  'device:update',
  'device:delete',
  'deviceType:list',
  'deviceType:create',
  // 借还
  'borrow:list',
  'borrow:create',
  'borrow:return',
  'borrow:delete',
  'borrow:getOverdue',
  'borrow:getDueSoon',
  'borrow:markNotified',
  // 统计
  'stats:dashboard',
  'stats:deviceTypeDistribution',
  'stats:borrowTrends',
  // 智能周报
  'report:weeklyGenerate',
  'report:weeklyHistory',
  'report:weeklyGetById',
];

// 暴露 API 到 window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: async (channel: string, ...args: any[]): Promise<any> => {
    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },
} as ElectronAPI);

// 类型声明（供渲染进程使用）
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
