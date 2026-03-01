/**
 * IPC Handlers 统一注册
 */

import { initDefaultUser, registerAuthIpc } from './auth';
import { registerBorrowIpc } from './borrow';
import { registerDeviceIpc } from './devices';
import { registerStatsIpc } from './stats';

export function registerIpcHandlers(): void {
  // 初始化默认用户
  initDefaultUser();

  // 注册各模块 IPC
  registerAuthIpc();
  registerDeviceIpc();
  registerBorrowIpc();
  registerStatsIpc();

  console.log('[IPC] All handlers registered');
}
