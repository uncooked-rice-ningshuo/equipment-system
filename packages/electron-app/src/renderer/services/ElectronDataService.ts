/**
 * Electron 数据服务实现
 * 通过 IPC 与主进程通信
 */

import {
  BorrowFilter,
  BorrowRecord,
  DashboardStats,
  Device,
  DeviceFilter,
  DeviceTypeStat,
  IDataService,
  ListOptions,
  ListResult,
  NewBorrowRecord,
  NewDevice,
} from '@equipment/shared';

export class ElectronDataService implements IDataService {
  // ==================== 设备管理 ====================
  async getDevices(
    options?: ListOptions<DeviceFilter>,
  ): Promise<ListResult<Device>> {
    return window.electronAPI.invoke('device:list', options);
  }

  async getDeviceById(id: number): Promise<Device | null> {
    return window.electronAPI.invoke('device:getById', id);
  }

  async getDeviceByCode(code: string): Promise<Device | null> {
    const { data } = await this.getDevices({
      filters: { code },
    });
    return data[0] || null;
  }

  async createDevice(data: NewDevice): Promise<Device> {
    return window.electronAPI.invoke('device:create', data);
  }

  async updateDevice(id: number, data: Partial<NewDevice>): Promise<Device> {
    return window.electronAPI.invoke('device:update', id, data);
  }

  async deleteDevice(id: number): Promise<void> {
    return window.electronAPI.invoke('device:delete', id);
  }

  // ==================== 借还管理 ====================
  async getBorrowRecords(
    options?: ListOptions<BorrowFilter>,
  ): Promise<ListResult<BorrowRecord>> {
    return window.electronAPI.invoke('borrow:list', options);
  }

  async getBorrowRecordById(id: number): Promise<BorrowRecord | null> {
    const { data } = await this.getBorrowRecords();
    return data.find((r) => r.id === id) || null;
  }

  async getActiveBorrowRecordByDeviceCode(
    code: string,
  ): Promise<BorrowRecord | null> {
    const { data } = await this.getBorrowRecords({
      filters: { deviceCode: code, returned: false },
    });
    return data[0] || null;
  }

  async createBorrowRecord(data: NewBorrowRecord): Promise<BorrowRecord> {
    return window.electronAPI.invoke('borrow:create', data);
  }

  async returnBorrowRecord(id: number): Promise<void> {
    return window.electronAPI.invoke('borrow:return', id);
  }

  async deleteBorrowRecord(id: number): Promise<void> {
    return window.electronAPI.invoke('borrow:delete', id);
  }

  // ==================== 统计查询 ====================
  async getDashboardStats(): Promise<DashboardStats> {
    return window.electronAPI.invoke('stats:dashboard');
  }

  async getDeviceTypeDistribution(): Promise<DeviceTypeStat[]> {
    return window.electronAPI.invoke('stats:deviceTypeDistribution');
  }

  async getBorrowTrends(
    period: 'week' | 'month' | 'year',
  ): Promise<DeviceTypeStat[]> {
    return window.electronAPI.invoke('stats:borrowTrends', period);
  }

  async getOverdueRecords(): Promise<BorrowRecord[]> {
    return window.electronAPI.invoke('borrow:getOverdue');
  }

  async getDueSoonRecords(days?: number): Promise<BorrowRecord[]> {
    return window.electronAPI.invoke('borrow:getDueSoon', days);
  }

  // ==================== 通知标记 ====================
  async markNotified(recordId: number): Promise<void> {
    return window.electronAPI.invoke('borrow:markNotified', recordId);
  }
}
