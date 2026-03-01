/**
 * Electron 渲染进程服务层
 */

import { ElectronAuthService } from './ElectronAuthService';
import { ElectronDataService } from './ElectronDataService';

// 单例实例
export const authService = new ElectronAuthService();
export const dataService = new ElectronDataService();

export type * from '@equipment/shared';
