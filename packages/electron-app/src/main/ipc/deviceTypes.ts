import type {
  DeviceType,
  DeviceTypeFilter,
  ListOptions,
  ListResult,
  NewDeviceType,
} from '@equipment/shared';
import { deviceTypes } from '@equipment/shared/db/sqlite-schema';
import { and, asc, eq, like } from 'drizzle-orm';
import { ipcMain } from 'electron';
import { getDrizzleDb } from '../db/connection';

export function registerDeviceTypeIpc(): void {
  ipcMain.removeHandler('deviceType:list');
  ipcMain.handle(
    'deviceType:list',
    async (
      _event,
      options?: ListOptions<DeviceTypeFilter>,
    ): Promise<ListResult<DeviceType>> => {
      const db = getDrizzleDb();

      const base = db.select().from(deviceTypes);
      const conditions: any[] = [];

      if (options?.filters) {
        if (options.filters.name) {
          conditions.push(like(deviceTypes.name, `%${options.filters.name}%`));
        }
      }

      const filtered =
        conditions.length > 0 ? base.where(and(...conditions)) : base;
      const ordered = filtered.orderBy(asc(deviceTypes.name));

      const data = ordered.all();

      return {
        data,
        total: data.length,
        page: options?.pagination?.page || 1,
        pageSize: options?.pagination?.pageSize || data.length,
      };
    },
  );

  ipcMain.removeHandler('deviceType:create');
  ipcMain.handle(
    'deviceType:create',
    async (_event, input: NewDeviceType): Promise<DeviceType> => {
      const rawName = input?.name;
      if (typeof rawName !== 'string' || rawName.trim().length === 0) {
        throw new Error('缺少必填字段：设备类型名称');
      }

      const name = rawName.trim();
      const description =
        typeof input?.description === 'string' ? input.description : '';

      const db = getDrizzleDb();

      const existing = db
        .select()
        .from(deviceTypes)
        .where(eq(deviceTypes.name, name))
        .get();
      if (existing) return existing;

      const now = new Date();
      const res = db
        .insert(deviceTypes)
        .values({
          name,
          description,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      const id = Number(res.lastInsertRowid);
      const result = db
        .select()
        .from(deviceTypes)
        .where(eq(deviceTypes.id, id))
        .get();

      if (!result) {
        throw new Error('创建设备类型失败');
      }

      return result;
    },
  );
}
