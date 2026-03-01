/**
 * 数据服务接口定义
 * Electron 和 Web 分别实现此接口
 */

import {
  BorrowRecord,
  Device,
  NewBorrowRecord,
  NewDevice,
} from '../../db/schema';
import {
  BorrowFilter,
  DashboardStats,
  DeviceFilter,
  DeviceTypeStat,
  ListOptions,
  ListResult,
} from '../../db/types';

export interface IDataService {
  // ==================== 设备管理 ====================
  getDevices(options?: ListOptions<DeviceFilter>): Promise<ListResult<Device>>;
  getDeviceById(id: number): Promise<Device | null>;
  getDeviceByCode(code: string): Promise<Device | null>;
  createDevice(data: NewDevice): Promise<Device>;
  updateDevice(id: number, data: Partial<NewDevice>): Promise<Device>;
  deleteDevice(id: number): Promise<void>;

  // ==================== 借还管理 ====================
  getBorrowRecords(
    options?: ListOptions<BorrowFilter>,
  ): Promise<ListResult<BorrowRecord>>;
  getBorrowRecordById(id: number): Promise<BorrowRecord | null>;
  getActiveBorrowRecordByDeviceCode(code: string): Promise<BorrowRecord | null>;
  createBorrowRecord(data: NewBorrowRecord): Promise<BorrowRecord>;
  returnBorrowRecord(id: number): Promise<void>;
  deleteBorrowRecord(id: number): Promise<void>;

  // ==================== 统计查询 ====================
  getDashboardStats(): Promise<DashboardStats>;
  getDeviceTypeDistribution(): Promise<DeviceTypeStat[]>;
  getBorrowTrends(period: 'week' | 'month' | 'year'): Promise<DeviceTypeStat[]>;
  getOverdueRecords(): Promise<BorrowRecord[]>;
  getDueSoonRecords(days?: number): Promise<BorrowRecord[]>;

  // ==================== 通知标记 ====================
  markNotified(recordId: number): Promise<void>;
}
