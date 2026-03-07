import {
  AuthResult,
  AuthUser,
  DeviceType,
  DeviceTypeFilter,
  IAuthService,
  IDataService,
  ListOptions,
  ListResult,
  NewDeviceType,
} from '@equipment/shared';
import { createContext, ReactNode, useContext, useMemo } from 'react';

type LegacyDashboardStats = {
  totalDevices: number;
  borrowedDevices: number;
  availableDevices: number;
  overdueDevices: number;
};

type LegacyBorrowRecord = {
  id: number;
  device_id: number;
  device_code: string;
  device_name: string;
  device_type: string;
  device_brand?: string;
  borrower_name: string;
  borrower_class: string;
  borrower_student_id: string;
  borrower_phone: string;
  borrow_time: Date | string | number;
  return_deadline: Date | string | number;
  actual_return_time: Date | string | number | null;
  notified: boolean;
  notify_time: Date | string | number | null;
  remaining_days?: number;
};

type LegacyStatsService = {
  getDashboardStats: () => Promise<LegacyDashboardStats>;
  getDeviceTypeDistribution: () => Promise<any[]>;
  getBorrowedTrend: (period: 'week' | 'month' | 'quarter') => Promise<any[]>;
  getOverdueRecords: () => Promise<{
    overdue: LegacyBorrowRecord[];
    dueSoon: LegacyBorrowRecord[];
  }>;
  markAsNotified: (recordId: number) => Promise<void>;
};

type LegacyAuthService = {
  login: (credentials: {
    username: string;
    password: string;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (
    username: string,
    oldPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; message?: string }>;
  getCurrentUser: () => Promise<AuthUser | null>;
  isAuthenticated: () => Promise<boolean>;
};

type LegacyDataService = {
  getDevices: (filters?: any) => Promise<any[]>;
  createDevice: (data: any) => Promise<any>;
  updateDevice: (id: number, data: any) => Promise<any>;
  deleteDevice: (id: number) => Promise<void>;
  getDeviceTypes?: (
    options?: ListOptions<DeviceTypeFilter>,
  ) => Promise<ListResult<DeviceType>>;
  createDeviceType?: (data: NewDeviceType) => Promise<DeviceType>;
  getBorrowRecords: (filters?: any) => Promise<LegacyBorrowRecord[]>;
  createBorrowRecord: (data: any) => Promise<LegacyBorrowRecord>;
  updateBorrowRecord: (id: number, data: any) => Promise<any>;
  deleteBorrowRecord: (id: number) => Promise<void>;
};

export type LegacyServices = {
  dataService: LegacyDataService;
  authService: LegacyAuthService;
  statsService: LegacyStatsService;
};

const LegacyServicesContext = createContext<LegacyServices | null>(null);

function toDateOrNull(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function computeRemainingDays(returnDeadline: any) {
  const deadline = toDateOrNull(returnDeadline);
  if (!deadline) return undefined;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((deadline.getTime() - Date.now()) / msPerDay);
}

function sanitizeObject(obj: any) {
  if (!obj || typeof obj !== 'object') return undefined;
  const next: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v === '') continue;
    next[k] = v;
  }
  return next;
}

async function buildDeviceMap(coreDataService: IDataService) {
  const { data } = await coreDataService.getDevices();
  const map = new Map<number, any>();
  for (const device of data) map.set(device.id, device);
  return map;
}

function makeLegacyBorrowRecord(
  record: any,
  device: any | undefined,
): LegacyBorrowRecord {
  return {
    id: record.id,
    device_id: record.deviceId,
    device_code: record.deviceCode,
    device_name: record.deviceName,
    device_type: device?.type ?? '',
    device_brand: device?.brand ?? '',
    borrower_name: record.borrowerName,
    borrower_class: record.borrowerClass ?? '',
    borrower_student_id: record.borrowerStudentId ?? '',
    borrower_phone: record.borrowerPhone ?? '',
    borrow_time: record.borrowTime,
    return_deadline: record.returnDeadline,
    actual_return_time: record.actualReturnTime ?? null,
    notified: Boolean(record.notified),
    notify_time: record.notifyTime ?? null,
    remaining_days: computeRemainingDays(record.returnDeadline),
  };
}

function createLegacyDataService(
  coreDataService: IDataService,
): LegacyDataService {
  return {
    async getDevices(filters?: any) {
      const { data } = await coreDataService.getDevices({
        filters: sanitizeObject(filters),
      });
      return data;
    },
    createDevice(data: any) {
      return coreDataService.createDevice(data);
    },
    updateDevice(id: number, data: any) {
      return coreDataService.updateDevice(id, data);
    },
    deleteDevice(id: number) {
      return coreDataService.deleteDevice(id);
    },
    getDeviceTypes(options?: ListOptions<DeviceTypeFilter>) {
      if (!coreDataService.getDeviceTypes) {
        return Promise.resolve({
          data: [],
          total: 0,
          page: options?.pagination?.page ?? 1,
          pageSize: options?.pagination?.pageSize ?? 0,
        });
      }
      return coreDataService.getDeviceTypes(options);
    },
    createDeviceType(data: NewDeviceType) {
      if (!coreDataService.createDeviceType) {
        return Promise.reject(new Error('当前数据服务不支持新增设备类型'));
      }
      return coreDataService.createDeviceType(data);
    },
    async getBorrowRecords(filters?: any) {
      const normalized = sanitizeObject(filters) ?? {};
      if (
        normalized.borrowTimeStart &&
        typeof normalized.borrowTimeStart === 'string'
      ) {
        normalized.borrowTimeStart = new Date(normalized.borrowTimeStart);
      }
      if (
        normalized.borrowTimeEnd &&
        typeof normalized.borrowTimeEnd === 'string'
      ) {
        normalized.borrowTimeEnd = new Date(normalized.borrowTimeEnd);
      }
      if (
        normalized.returnTimeStart &&
        typeof normalized.returnTimeStart === 'string'
      ) {
        normalized.returnTimeStart = new Date(normalized.returnTimeStart);
      }
      if (
        normalized.returnTimeEnd &&
        typeof normalized.returnTimeEnd === 'string'
      ) {
        normalized.returnTimeEnd = new Date(normalized.returnTimeEnd);
      }

      const [{ data: records }, deviceMap] = await Promise.all([
        coreDataService.getBorrowRecords({ filters: normalized }),
        buildDeviceMap(coreDataService),
      ]);

      return records.map((r) =>
        makeLegacyBorrowRecord(r, deviceMap.get(r.deviceId)),
      );
    },
    async createBorrowRecord(data: any) {
      const deviceId = Number(data.device_id ?? data.deviceId);
      const payload = {
        deviceId,
        deviceCode: data.device_code ?? data.deviceCode ?? '',
        deviceName: data.device_name ?? data.deviceName ?? '',
        borrowerName: data.borrower_name ?? data.borrowerName ?? '',
        borrowerClass: data.borrower_class ?? data.borrowerClass ?? '',
        borrowerStudentId:
          data.borrower_student_id ?? data.borrowerStudentId ?? '',
        borrowerPhone: data.borrower_phone ?? data.borrowerPhone ?? '',
        borrowTime:
          toDateOrNull(data.borrow_time ?? data.borrowTime) ?? new Date(),
        returnDeadline:
          toDateOrNull(data.return_deadline ?? data.returnDeadline) ??
          new Date(),
      };

      const created = await coreDataService.createBorrowRecord(payload as any);
      const deviceMap = await buildDeviceMap(coreDataService);
      return makeLegacyBorrowRecord(created, deviceMap.get(created.deviceId));
    },
    async updateBorrowRecord(id: number, data: any) {
      if (data?.actual_return_time || data?.actualReturnTime) {
        await coreDataService.returnBorrowRecord(id);
        return;
      }
      throw new Error('Unsupported updateBorrowRecord operation');
    },
    deleteBorrowRecord(id: number) {
      return coreDataService.deleteBorrowRecord(id);
    },
  };
}

function createLegacyStatsService(
  coreDataService: IDataService,
): LegacyStatsService {
  return {
    getDashboardStats() {
      return coreDataService.getDashboardStats();
    },
    getDeviceTypeDistribution() {
      return coreDataService.getDeviceTypeDistribution() as any;
    },
    getBorrowedTrend(period: 'week' | 'month' | 'quarter') {
      return coreDataService.getBorrowTrends(period) as any;
    },
    async getOverdueRecords() {
      const [overdueRecords, dueSoonRecords, deviceMap] = await Promise.all([
        coreDataService.getOverdueRecords(),
        coreDataService.getDueSoonRecords(5),
        buildDeviceMap(coreDataService),
      ]);

      return {
        overdue: overdueRecords.map((r) =>
          makeLegacyBorrowRecord(r, deviceMap.get(r.deviceId)),
        ),
        dueSoon: dueSoonRecords.map((r) =>
          makeLegacyBorrowRecord(r, deviceMap.get(r.deviceId)),
        ),
      };
    },
    markAsNotified(recordId: number) {
      return coreDataService.markNotified(recordId);
    },
  };
}

function createLegacyAuthService(
  coreAuthService: IAuthService,
): LegacyAuthService {
  const unwrapLogin = (result: AuthResult) => {
    if (!result?.success || !result.user) {
      throw new Error(result?.message || '登录失败');
    }
    if (result.token) localStorage.setItem('token', result.token);
    return result.user;
  };

  return {
    async login(credentials) {
      const result = await coreAuthService.login(credentials);
      return unwrapLogin(result);
    },
    async logout() {
      await coreAuthService.logout();
      localStorage.removeItem('token');
      localStorage.removeItem('loginUser');
    },
    changePassword(username: string, oldPassword: string, newPassword: string) {
      void username;
      return coreAuthService.changePassword({ oldPassword, newPassword });
    },
    getCurrentUser() {
      return coreAuthService.getCurrentUser();
    },
    isAuthenticated() {
      return coreAuthService.isAuthenticated();
    },
  };
}

export function createLegacyServices({
  dataService,
  authService,
}: {
  dataService: IDataService;
  authService: IAuthService;
}): LegacyServices {
  return {
    dataService: createLegacyDataService(dataService),
    authService: createLegacyAuthService(authService),
    statsService: createLegacyStatsService(dataService),
  };
}

export function LegacyServicesProvider({
  dataService,
  authService,
  children,
}: {
  dataService: IDataService;
  authService: IAuthService;
  children: ReactNode;
}) {
  const services = useMemo(() => {
    return createLegacyServices({ dataService, authService });
  }, [dataService, authService]);

  return (
    <LegacyServicesContext.Provider value={services}>
      {children}
    </LegacyServicesContext.Provider>
  );
}

export function useLegacyServices() {
  const services = useContext(LegacyServicesContext);
  if (!services) {
    throw new Error(
      'useLegacyServices must be used within LegacyServicesProvider',
    );
  }
  return services;
}
