/**
 * 数据服务接口定义
 * Electron 和 Web 分别实现此接口
 */

import {
  BorrowRecord,
  Device,
  DeviceType,
  NewBorrowRecord,
  NewDevice,
  NewDeviceType,
} from '../../db/schema';
import {
  BorrowFilter,
  DashboardStats,
  DeviceFilter,
  DeviceTypeFilter,
  DeviceTypeStat,
  ListOptions,
  ListResult,
} from '../../db/types';
import { WeeklyReportRecord, WeeklyReportSummary } from '../../report/types';

export interface IDataService {
  // ==================== 设备管理 ====================
  getDevices(options?: ListOptions<DeviceFilter>): Promise<ListResult<Device>>;
  getDeviceById(id: number): Promise<Device | null>;
  getDeviceByCode(code: string): Promise<Device | null>;
  createDevice(data: NewDevice): Promise<Device>;
  updateDevice(id: number, data: Partial<NewDevice>): Promise<Device>;
  deleteDevice(id: number): Promise<void>;

  getDeviceTypes?(
    options?: ListOptions<DeviceTypeFilter>,
  ): Promise<ListResult<DeviceType>>;
  getDeviceTypeById?(id: number): Promise<DeviceType | null>;
  createDeviceType?(data: NewDeviceType): Promise<DeviceType>;
  updateDeviceType?(
    id: number,
    data: Partial<NewDeviceType>,
  ): Promise<DeviceType>;
  deleteDeviceType?(id: number): Promise<void>;

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
  getBorrowTrends(
    period: 'week' | 'month' | 'quarter',
  ): Promise<DeviceTypeStat[]>;
  getOverdueRecords(): Promise<BorrowRecord[]>;
  getDueSoonRecords(days?: number): Promise<BorrowRecord[]>;

  // ==================== 通知标记 ====================
  markNotified(recordId: number): Promise<void>;

  // ==================== 智能周报 ====================
  generateWeeklyReport(): Promise<WeeklyReportRecord>;
  getWeeklyReportHistory(): Promise<WeeklyReportSummary[]>;
  getWeeklyReportById(id: number): Promise<WeeklyReportRecord | null>;
}
