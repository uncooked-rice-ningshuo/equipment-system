import { and, eq, like } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs, { Database } from 'sql.js';
import {
  BorrowRecord,
  borrowRecords,
  Device,
  devices,
  NewBorrowRecord,
  NewDevice,
  NewUser,
  User,
  users,
} from '../../db/schema';
import { IDataService } from '../core/IDataService';

// Singleton DB instance promise
let dbPromise: Promise<{ db: any; sqlDb: Database }> | null = null;
const OPFS_FILE_NAME = 'equipment_db.sqlite';

async function getOpfsFileHandle() {
  const root = await navigator.storage.getDirectory();
  return await root.getFileHandle(OPFS_FILE_NAME, { create: true });
}

async function loadFromOpfs(SQL: any): Promise<Database> {
  try {
    const fileHandle = await getOpfsFileHandle();
    const file = await fileHandle.getFile();

    if (file.size === 0) {
      return new SQL.Database();
    }

    const arrayBuffer = await file.arrayBuffer();
    return new SQL.Database(new Uint8Array(arrayBuffer));
  } catch (e) {
    console.error('Failed to load DB from OPFS:', e);
    return new SQL.Database();
  }
}

async function saveToOpfs(sqlDb: Database) {
  try {
    const data = sqlDb.export();
    const fileHandle = await getOpfsFileHandle();
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  } catch (e) {
    console.error('Failed to save DB to OPFS:', e);
  }
}

async function getDb() {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => `/${file}`,
    });

    const sqlDb = await loadFromOpfs(SQL);

    // Initialize tables if empty
    sqlDb.run(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        brand TEXT,
        model TEXT,
        price REAL,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        created_at INTEGER,
        updated_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS borrow_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        device_code TEXT NOT NULL,
        device_name TEXT NOT NULL,
        device_type TEXT NOT NULL,
        device_brand TEXT,
        borrower_name TEXT NOT NULL,
        borrower_class TEXT NOT NULL,
        borrower_student_id TEXT NOT NULL,
        borrower_phone TEXT NOT NULL,
        borrow_time INTEGER NOT NULL,
        return_deadline INTEGER NOT NULL,
        actual_return_time INTEGER,
        notified INTEGER DEFAULT 0,
        notify_time INTEGER
      );
    `);

    const db = drizzle(sqlDb, { schema: { devices, borrowRecords, users } });
    return { db, sqlDb };
  })();

  return dbPromise;
}

export class WebDataService implements IDataService {
  async getDevices(filter?: any): Promise<Device[]> {
    const { db } = await getDb();
    const conditions = [];
    if (filter?.code) conditions.push(like(devices.code, `%${filter.code}%`));
    if (filter?.name) conditions.push(like(devices.name, `%${filter.name}%`));
    // ... other filters

    if (conditions.length > 0) {
      return db
        .select()
        .from(devices)
        .where(and(...conditions))
        .all();
    }
    return db.select().from(devices).all();
  }

  async getDeviceByCode(code: string): Promise<Device | undefined> {
    const { db } = await getDb();
    const res = db.select().from(devices).where(eq(devices.code, code)).get();
    return res;
  }

  async getDeviceById(id: number): Promise<Device | undefined> {
    const { db } = await getDb();
    const res = db.select().from(devices).where(eq(devices.id, id)).get();
    return res;
  }

  async createDevice(device: NewDevice): Promise<Device> {
    const { db, sqlDb } = await getDb();
    const res = db.insert(devices).values(device).returning().get();
    await saveToOpfs(sqlDb);
    return res;
  }

  async updateDevice(id: number, data: Partial<NewDevice>): Promise<Device> {
    const { db, sqlDb } = await getDb();
    const res = db
      .update(devices)
      .set(data)
      .where(eq(devices.id, id))
      .returning()
      .get();
    await saveToOpfs(sqlDb);
    return res;
  }

  async deleteDevice(id: number): Promise<void> {
    const { db, sqlDb } = await getDb();
    db.delete(devices).where(eq(devices.id, id)).run();
    await saveToOpfs(sqlDb);
  }

  async getBorrowRecords(filter?: any): Promise<BorrowRecord[]> {
    const { db } = await getDb();
    // Filters logic similar to devices
    return db.select().from(borrowRecords).all();
  }

  async getBorrowRecordById(id: number): Promise<BorrowRecord | undefined> {
    const { db } = await getDb();
    return db
      .select()
      .from(borrowRecords)
      .where(eq(borrowRecords.id, id))
      .get();
  }

  async getActiveBorrowRecordByDeviceCode(
    code: string,
  ): Promise<BorrowRecord | undefined> {
    const { db } = await getDb();
    // Implementation needed
    return undefined;
  }

  async createBorrowRecord(record: NewBorrowRecord): Promise<BorrowRecord> {
    const { db, sqlDb } = await getDb();
    const res = db.insert(borrowRecords).values(record).returning().get();
    // Update device status logic needed
    await saveToOpfs(sqlDb);
    return res;
  }

  async updateBorrowRecord(
    id: number,
    data: Partial<NewBorrowRecord>,
  ): Promise<BorrowRecord> {
    const { db, sqlDb } = await getDb();
    const res = db
      .update(borrowRecords)
      .set(data)
      .where(eq(borrowRecords.id, id))
      .returning()
      .get();
    await saveToOpfs(sqlDb);
    return res;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Web usually uses Better-Auth API, not local DB for users
    return undefined;
  }

  async createUser(user: NewUser): Promise<User> {
    // Web usually uses Better-Auth API
    return user as User;
  }
}
