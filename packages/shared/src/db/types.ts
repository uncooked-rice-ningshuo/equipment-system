/**
 * 数据库类型定义补充
 */

import { BorrowRecord, Device, User } from './schema';

// ==================== 设备相关 ====================
export type DeviceStatus = 'available' | 'borrowed' | 'maintenance' | 'scrap';

export interface DeviceFilter {
  code?: string;
  name?: string;
  status?: DeviceStatus;
  type?: string;
  brand?: string;
}

export type DeviceIpc = Omit<Device, 'createdAt' | 'updatedAt'> & {
  createdAt: number;
  updatedAt: number;
};

// ==================== 借还相关 ====================
export interface BorrowFilter {
  deviceCode?: string;
  deviceName?: string;
  deviceType?: string;
  borrowerName?: string;
  borrowerClass?: string;
  borrowerStudentId?: string;
  borrowTimeStart?: Date;
  borrowTimeEnd?: Date;
  returnTimeStart?: Date;
  returnTimeEnd?: Date;
  returned?: boolean;
}

export interface BorrowRecordWithDevice extends BorrowRecord {
  deviceCode: string;
  deviceName: string;
  deviceBrand: string;
  remainingDays?: number;
}

export type BorrowRecordIpc = Omit<
  BorrowRecord,
  | 'borrowTime'
  | 'returnDeadline'
  | 'actualReturnTime'
  | 'notifyTime'
  | 'createdAt'
> & {
  borrowTime: number;
  returnDeadline: number;
  actualReturnTime: number | null;
  notifyTime: number | null;
  createdAt: number;
};

// ==================== 统计相关 ====================
export interface DashboardStats {
  totalDevices: number;
  borrowedDevices: number;
  availableDevices: number;
  overdueDevices: number;
}

export interface DeviceTypeStat {
  name: string;
  value: number;
}

export interface BorrowTrendStat {
  date: string;
  count: number;
}

// ==================== 列表查询通用 ====================
export interface ListOptions<T = any> {
  filters?: Partial<T>;
  pagination?: {
    page: number;
    pageSize: number;
  };
  sort?: {
    field: keyof T;
    order: 'asc' | 'desc';
  };
}

export interface ListResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== 认证相关 ====================
export interface AuthUser {
  id: number;
  username: string;
  displayName?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: AuthUser;
  message?: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

// ==================== IPC / API 请求/响应类型 ====================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email?: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}

export interface CreateDeviceRequest {
  name: string;
  model?: string;
  serialNumber?: string;
  type?: string;
  description?: string;
  status?: 'available' | 'borrowed' | 'maintenance';
}

export type UpdateDeviceRequest = Partial<CreateDeviceRequest>;

export interface CreateBorrowRequest {
  deviceId: number;
  userId: number;
  borrowDate: Date;
  expectedReturnDate: Date;
  notes?: string;
}

export interface ReturnDeviceRequest {
  borrowId: number;
  returnDate: Date;
  notes?: string;
}

export interface ExtendBorrowRequest {
  borrowId: number;
  newExpectedReturnDate: Date;
}

export interface BorrowTrend {
  date: string;
  borrowCount: number;
  returnCount: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
