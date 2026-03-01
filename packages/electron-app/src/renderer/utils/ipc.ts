/**
 * IPC 调用工具 - 渲染进程
 */

import type {
  BorrowRecord,
  BorrowTrend,
  CreateBorrowRequest,
  CreateDeviceRequest,
  CreateUserRequest,
  DashboardStats,
  Device,
  DeviceTypeStat,
  ExtendBorrowRequest,
  LoginRequest,
  LoginResponse,
  PaginatedResponse,
  PaginationParams,
  ReturnDeviceRequest,
  UpdateDeviceRequest,
  UpdateUserRequest,
  User,
} from '@equipment/shared';

// 调用主进程 IPC
async function invoke<T>(channel: string, ...args: any[]): Promise<T> {
  if (!window.electron) {
    throw new Error('Electron API not available');
  }
  return window.electron.invoke(channel, ...args);
}

// 认证相关
export const auth = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    invoke('auth:login', data),

  getCurrentUser: (): Promise<User | null> => invoke('auth:getCurrentUser'),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    const token = localStorage.getItem('token');
    return invoke('auth:changePassword', data, token);
  },
};

// 用户管理
export const users = {
  getAll: (
    params?: PaginationParams & { search?: string; role?: string },
  ): Promise<PaginatedResponse<User>> => invoke('users:getAll', params),

  getById: (id: number): Promise<User | null> => invoke('users:getById', id),

  create: (data: CreateUserRequest): Promise<User> => {
    const token = localStorage.getItem('token');
    return invoke('users:create', data, token);
  },

  update: (id: number, data: UpdateUserRequest): Promise<User> => {
    const token = localStorage.getItem('token');
    return invoke('users:update', id, data, token);
  },

  delete: (id: number): Promise<void> => {
    const token = localStorage.getItem('token');
    return invoke('users:delete', id, token);
  },
};

// 设备管理
export const devices = {
  getAll: (
    params?: PaginationParams & {
      search?: string;
      status?: string;
      type?: string;
    },
  ): Promise<PaginatedResponse<Device>> => invoke('devices:getAll', params),

  getById: (id: number): Promise<Device | null> =>
    invoke('devices:getById', id),

  getAvailable: (): Promise<Device[]> => invoke('devices:getAvailable'),

  create: (data: CreateDeviceRequest): Promise<Device> => {
    const token = localStorage.getItem('token');
    return invoke('devices:create', data, token);
  },

  update: (id: number, data: UpdateDeviceRequest): Promise<Device> => {
    const token = localStorage.getItem('token');
    return invoke('devices:update', id, data, token);
  },

  delete: (id: number): Promise<void> => {
    const token = localStorage.getItem('token');
    return invoke('devices:delete', id, token);
  },
};

// 借还管理
export const borrows = {
  getAll: (
    params?: PaginationParams & { search?: string; status?: string },
  ): Promise<PaginatedResponse<BorrowRecord>> =>
    invoke('borrows:getAll', params),

  getMyBorrows: (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<BorrowRecord>> => {
    const token = localStorage.getItem('token');
    return invoke('borrows:getMyBorrows', params, token);
  },

  getOverdue: (): Promise<BorrowRecord[]> => invoke('borrows:getOverdue'),

  getDueSoon: (days: number = 3): Promise<BorrowRecord[]> =>
    invoke('borrows:getDueSoon', days),

  create: (data: CreateBorrowRequest): Promise<BorrowRecord> => {
    const token = localStorage.getItem('token');
    return invoke('borrows:create', data, token);
  },

  returnDevice: (data: ReturnDeviceRequest): Promise<BorrowRecord> => {
    const token = localStorage.getItem('token');
    return invoke('borrows:returnDevice', data, token);
  },

  extend: (data: ExtendBorrowRequest): Promise<BorrowRecord> => {
    const token = localStorage.getItem('token');
    return invoke('borrows:extend', data, token);
  },
};

// 仪表板统计
export const dashboard = {
  getStats: (): Promise<DashboardStats> => invoke('dashboard:getStats'),

  getBorrowTrends: (days: number = 30): Promise<BorrowTrend[]> =>
    invoke('dashboard:getBorrowTrends', days),

  getDeviceTypeStats: (): Promise<DeviceTypeStat[]> =>
    invoke('dashboard:getDeviceTypeStats'),
};

// 导出所有 IPC 方法
export const ipc = {
  auth,
  users,
  devices,
  borrows,
  dashboard,
};

export default ipc;
