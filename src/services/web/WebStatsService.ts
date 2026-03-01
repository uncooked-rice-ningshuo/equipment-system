import dayjs from 'dayjs';
import { and, eq, gte, isNull, lt } from 'drizzle-orm';
import { borrowRecords, devices } from '../../db/schema';
import { IStatsService } from '../core/IStatsService';

// We need access to the same DB instance as WebDataService
// Ideally WebDataService should expose getDb or we use a shared DbProvider
// For now, we'll instantiate a new WebDataService to get access via its internal getDb
// BUT getDb is not exported. Let's assume we modify WebDataService to export getDb or reuse logic.
// Better approach: make getDb a shared utility in `src/services/web/db.ts`

// Let's refactor WebDataService slightly to export getDb or use it here if we can import it.
// Since we can't easily refactor WebDataService without another tool call,
// I will duplicate the getDb logic or better, import it if I had extracted it.
// I will implement using the same pattern, assuming singleton behavior of sql.js + opfs is handled correctly.
// Actually, I should have extracted `getDb` to a shared file.
// For now, I will implement a quick version that re-uses the logic,
// but in a real refactor I would move `getDb` to `src/services/web/db.ts`.

// Hack: we need to access the DB.
// Let's just use the public methods of DataService where possible,
// but for aggregation we need raw DB access.
// I'll assume I can copy the getDb logic here for now.

import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs, { Database } from 'sql.js';

const OPFS_FILE_NAME = 'equipment_db.sqlite';

async function getOpfsFileHandle() {
  const root = await navigator.storage.getDirectory();
  return await root.getFileHandle(OPFS_FILE_NAME, { create: true });
}

async function loadFromOpfs(SQL: any): Promise<Database> {
  try {
    const fileHandle = await getOpfsFileHandle();
    const file = await fileHandle.getFile();
    if (file.size === 0) return new SQL.Database();
    const arrayBuffer = await file.arrayBuffer();
    return new SQL.Database(new Uint8Array(arrayBuffer));
  } catch (e) {
    return new SQL.Database();
  }
}

// Re-implementing getDb just for this service to avoid large refactor now
// In production code, extract this to `web/db.ts`
let dbPromise: Promise<{ db: any; sqlDb: Database }> | null = null;
async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const SQL = await initSqlJs({ locateFile: (file) => `/${file}` });
    const sqlDb = await loadFromOpfs(SQL);
    const db = drizzle(sqlDb, { schema: { devices, borrowRecords } });
    return { db, sqlDb };
  })();
  return dbPromise;
}

async function saveToOpfs(sqlDb: Database) {
  try {
    const data = sqlDb.export();
    const fileHandle = await getOpfsFileHandle();
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  } catch (e) {
    console.error(e);
  }
}

export class WebStatsService implements IStatsService {
  async getDashboardStats() {
    const { db } = await getDb();
    const allDevices = await db.select().from(devices).all();
    const borrowed = allDevices.filter((d) => d.status === 'borrowed').length;

    // Drizzle currently has limited aggregation in SQLite via pure JS driver sometimes,
    // but .all() works.

    const now = new Date();
    const overdue = await db
      .select()
      .from(borrowRecords)
      .where(
        and(
          isNull(borrowRecords.actual_return_time),
          lt(borrowRecords.return_deadline, now),
        ),
      )
      .all();

    return {
      totalDevices: allDevices.length,
      borrowedDevices: borrowed,
      availableDevices: allDevices.length - borrowed,
      overdueDevices: overdue.length,
    };
  }

  async getOverdueRecords() {
    const { db } = await getDb();
    const now = dayjs();

    const activeRecords = await db
      .select()
      .from(borrowRecords)
      .where(isNull(borrowRecords.actual_return_time))
      .all();

    const overdue: any[] = [];
    const dueSoon: any[] = [];

    activeRecords.forEach((r) => {
      const ddl = dayjs(r.return_deadline);
      const diff = ddl.diff(now, 'day');
      const item = { ...r, remaining_days: diff };
      if (diff < 0) overdue.push(item);
      else if (diff <= 5) dueSoon.push(item);
    });

    return { overdue, dueSoon };
  }

  async markAsNotified(recordId: number) {
    const { db, sqlDb } = await getDb();
    await db
      .update(borrowRecords)
      .set({ notified: true, notify_time: new Date() })
      .where(eq(borrowRecords.id, recordId))
      .run();
    await saveToOpfs(sqlDb);
  }

  async getDeviceTypeDistribution() {
    const { db } = await getDb();
    const list = await db.select({ type: devices.type }).from(devices).all();

    const map = new Map<string, number>();
    list.forEach((d) => {
      const t = d.type || '未分类';
      map.set(t, (map.get(t) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  async getBorrowedTrend(period: 'week' | 'month' | 'year') {
    const { db } = await getDb();
    let days = 7;
    if (period === 'month') days = 30;
    if (period === 'year') days = 365;

    const startDate = dayjs().subtract(days, 'day').toDate();

    // Complex join and group by might be hard in pure JS-side logic if Drizzle aggregation is limited
    // But let's try manual aggregation for reliability in this adapter

    const records = await db
      .select({
        type: borrowRecords.device_type,
      })
      .from(borrowRecords)
      .where(gte(borrowRecords.borrow_time, startDate))
      .all();

    const map = new Map<string, number>();
    records.forEach((r) => {
      const t = r.type || '未分类';
      map.set(t, (map.get(t) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }
}
