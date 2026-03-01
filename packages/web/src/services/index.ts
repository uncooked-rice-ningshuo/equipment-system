/**
 * Web 服务层统一导出
 */

import { WebAuthService } from './WebAuthService';
import { WebDataService } from './WebDataService';

// 单例实例
export const authService = new WebAuthService();
export const dataService = new WebDataService();

export type * from '@equipment/shared';
