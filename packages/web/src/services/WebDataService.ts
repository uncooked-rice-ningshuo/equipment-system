/**
 * Web 数据服务实现
 * 通过 HTTP API 调用后端
 */

import {
  BorrowFilter,
  BorrowRecord,
  DashboardStats,
  Device,
  DeviceFilter,
  DeviceType,
  DeviceTypeFilter,
  DeviceTypeStat,
  IDataService,
  ListOptions,
  ListResult,
  NewBorrowRecord,
  NewDevice,
  NewDeviceType,
  WeeklyReportRecord,
  WeeklyReportSummary,
} from '@equipment/shared';

const API_BASE = '/api';

/**
 * 通用 fetch 封装
 */
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // 携带 cookie
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

export class WebDataService implements IDataService {
  // ==================== 设备管理 ====================
  async getDevices(
    options?: ListOptions<DeviceFilter>,
  ): Promise<ListResult<Device>> {
    const params = new URLSearchParams();

    if (options?.filters) {
      if (options.filters.code) params.set('code', options.filters.code);
      if (options.filters.name) params.set('name', options.filters.name);
      if (options.filters.status) params.set('status', options.filters.status);
      if (options.filters.type) params.set('type', options.filters.type);
    }

    return fetchAPI(`${API_BASE}/devices?${params}`);
  }

  async getDeviceTypes(
    options?: ListOptions<DeviceTypeFilter>,
  ): Promise<ListResult<DeviceType>> {
    const params = new URLSearchParams();

    if (options?.filters) {
      if (options.filters.name) params.set('name', options.filters.name);
    }

    const query = params.toString();
    return fetchAPI(`${API_BASE}/device-types${query ? `?${query}` : ''}`);
  }

  async createDeviceType(data: NewDeviceType): Promise<DeviceType> {
    return fetchAPI(`${API_BASE}/device-types`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDeviceById(id: number): Promise<Device | null> {
    try {
      return await fetchAPI(`${API_BASE}/devices/${id}`);
    } catch {
      return null;
    }
  }

  async getDeviceByCode(code: string): Promise<Device | null> {
    const { data } = await this.getDevices({ filters: { code } });
    return data[0] || null;
  }

  async createDevice(data: NewDevice): Promise<Device> {
    return fetchAPI(`${API_BASE}/devices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDevice(id: number, data: Partial<NewDevice>): Promise<Device> {
    return fetchAPI(`${API_BASE}/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDevice(id: number): Promise<void> {
    await fetchAPI(`${API_BASE}/devices/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== 借还管理 ====================
  async getBorrowRecords(
    options?: ListOptions<BorrowFilter>,
  ): Promise<ListResult<BorrowRecord>> {
    const params = new URLSearchParams();

    if (options?.filters) {
      if (options.filters.returned !== undefined) {
        params.set('returned', String(options.filters.returned));
      }
      if (options.filters.deviceCode) {
        params.set('deviceCode', options.filters.deviceCode);
      }
      if (options.filters.borrowerName) {
        params.set('borrowerName', options.filters.borrowerName);
      }
      if (options.filters.borrowerClass) {
        params.set('borrowerClass', options.filters.borrowerClass);
      }
    }

    return fetchAPI(`${API_BASE}/borrow?${params}`);
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
    return fetchAPI(`${API_BASE}/borrow`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async returnBorrowRecord(id: number): Promise<void> {
    await fetchAPI(`${API_BASE}/borrow/${id}`, {
      method: 'PUT',
    });
  }

  async deleteBorrowRecord(id: number): Promise<void> {
    await fetchAPI(`${API_BASE}/borrow/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== 统计查询 ====================
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchAPI(`${API_BASE}/stats`);
  }

  async getDeviceTypeDistribution(): Promise<DeviceTypeStat[]> {
    // 从设备列表计算类型分布
    const { data: devices } = await this.getDevices();
    const typeMap = new Map<string, number>();

    for (const device of devices) {
      const type = device.type || '未分类';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    }

    return Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  async getBorrowTrends(
    period: 'week' | 'month' | 'quarter',
  ): Promise<DeviceTypeStat[]> {
    const [{ data: records }, { data: devices }] = await Promise.all([
      this.getBorrowRecords(),
      this.getDevices(),
    ]);

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const typeMap = new Map<string, number>();
    const deviceTypeMap = new Map<number, string>();
    for (const device of devices) {
      deviceTypeMap.set(device.id, device.type || '未分类');
    }

    for (const record of records) {
      const borrowTime = new Date(record.borrowTime);
      if (borrowTime >= startDate) {
        const type = deviceTypeMap.get(record.deviceId) || '未分类';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      }
    }

    return Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  async getOverdueRecords(): Promise<BorrowRecord[]> {
    const { data } = await this.getBorrowRecords({
      filters: { returned: false },
    });
    const now = new Date();
    return data.filter((r) => new Date(r.returnDeadline) < now);
  }

  async getDueSoonRecords(days: number = 7): Promise<BorrowRecord[]> {
    const { data } = await this.getBorrowRecords({
      filters: { returned: false },
    });
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return data.filter((r) => {
      const deadline = new Date(r.returnDeadline);
      return deadline >= now && deadline <= future;
    });
  }

  // ==================== 通知标记 ====================
  async markNotified(recordId: number): Promise<void> {
    // Web 版暂时不需要实现
    console.log('Mark notified:', recordId);
  }

  // ==================== 智能周报 ====================
  async generateWeeklyReport(): Promise<WeeklyReportRecord> {
    return fetchAPI(`${API_BASE}/reports/weekly`, {
      method: 'POST',
    });
  }

  async getWeeklyReportHistory(): Promise<WeeklyReportSummary[]> {
    return fetchAPI(`${API_BASE}/reports/weekly/history`);
  }

  async getWeeklyReportById(id: number): Promise<WeeklyReportRecord | null> {
    try {
      return await fetchAPI(`${API_BASE}/reports/weekly/${id}`);
    } catch {
      return null;
    }
  }
}
