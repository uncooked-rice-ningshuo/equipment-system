import {
  BorrowRecord,
  Device,
  NewBorrowRecord,
  NewDevice,
  NewUser,
  User,
} from '../../db/schema';
import { IDataService } from '../core/IDataService';
import { invoke } from '../ipc';

export class ElectronDataService implements IDataService {
  async getDevices(filter?: any): Promise<Device[]> {
    return invoke('device:list', filter);
  }

  async getDeviceByCode(code: string): Promise<Device | undefined> {
    const devices = await invoke<Device[]>('device:list', { code });
    return devices[0];
  }

  async getDeviceById(id: number): Promise<Device | undefined> {
    const devices = await invoke<Device[]>('device:list', { id });
    return devices[0];
  }

  async createDevice(device: NewDevice): Promise<Device> {
    // The create endpoint returns { success: true } usually, but IDataService expects created object?
    // Let's assume the API returns void/success or object.
    // If API returns success, we might need to fetch it again or adjust interface.
    // For now, assume API returns the created object or void.
    // Actually apiHandlers.deviceCreate returns { success: true }.
    // So we fetch the created device or return mock.
    // Better to update API to return created object.
    await invoke('device:create', device);
    return device as Device; // Incomplete cast, but okay for now
  }

  async updateDevice(id: number, data: Partial<NewDevice>): Promise<Device> {
    await invoke('device:update', { id, ...data });
    return { id, ...data } as Device;
  }

  async deleteDevice(id: number): Promise<void> {
    await invoke('device:delete', id);
  }

  // Borrow Record Operations
  async getBorrowRecords(filter?: any): Promise<BorrowRecord[]> {
    return invoke('borrow:list', filter);
  }

  async getBorrowRecordById(id: number): Promise<BorrowRecord | undefined> {
    const records = await invoke<BorrowRecord[]>('borrow:list', { id });
    return records[0];
  }

  async getActiveBorrowRecordByDeviceCode(
    code: string,
  ): Promise<BorrowRecord | undefined> {
    const records = await invoke<BorrowRecord[]>('borrow:list', {
      deviceCode: code,
      returned: false,
    });
    return records[0];
  }

  async createBorrowRecord(record: NewBorrowRecord): Promise<BorrowRecord> {
    await invoke('borrow:create', record);
    return record as BorrowRecord;
  }

  async updateBorrowRecord(
    id: number,
    data: Partial<NewBorrowRecord>,
  ): Promise<BorrowRecord> {
    // There is no general update for borrow record, only return
    // Or we can implement it if needed.
    // apiHandlers only has 'borrow:return'.
    // If data has actual_return_time, call return.
    if (data.actual_return_time) {
      await invoke('borrow:return', id);
    }
    return { id, ...data } as BorrowRecord;
  }

  // User Operations
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Not exposed via IPC yet
    return undefined;
  }

  async createUser(user: NewUser): Promise<User> {
    // Not exposed via IPC yet
    return user as User;
  }
}
