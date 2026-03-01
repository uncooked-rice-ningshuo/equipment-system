import {
  BorrowRecord,
  Device,
  NewBorrowRecord,
  NewDevice,
  NewUser,
  User,
} from '../../db/schema';

export interface IDataService {
  // Device Operations
  getDevices(): Promise<Device[]>;
  getDeviceByCode(code: string): Promise<Device | undefined>;
  getDeviceById(id: number): Promise<Device | undefined>;
  createDevice(device: NewDevice): Promise<Device>;
  updateDevice(id: number, data: Partial<NewDevice>): Promise<Device>;
  deleteDevice(id: number): Promise<void>;

  // Borrow Record Operations
  getBorrowRecords(): Promise<BorrowRecord[]>;
  getBorrowRecordById(id: number): Promise<BorrowRecord | undefined>;
  getActiveBorrowRecordByDeviceCode(
    code: string,
  ): Promise<BorrowRecord | undefined>;
  createBorrowRecord(record: NewBorrowRecord): Promise<BorrowRecord>;
  updateBorrowRecord(
    id: number,
    data: Partial<NewBorrowRecord>,
  ): Promise<BorrowRecord>;

  // User Operations (Mainly for Electron local auth management)
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: NewUser): Promise<User>;
}
