/**
 * 设备管理 IPC Handlers
 */

import type {
  Device,
  DeviceFilter,
  ListOptions,
  ListResult,
  NewDevice,
} from '@equipment/shared';
import { borrowRecords, devices } from '@equipment/shared/db/sqlite-schema';
import { and, desc, eq, like } from 'drizzle-orm';
import { ipcMain } from 'electron';
import { getDrizzleDb } from '../db/connection';

export function registerDeviceIpc(): void {
  // 获取设备列表
  ipcMain.handle(
    'device:list',
    async (
      _event,
      options?: ListOptions<DeviceFilter>,
    ): Promise<ListResult<Device>> => {
      const db = getDrizzleDb();

      const base = db.select().from(devices);
      const conditions: any[] = [];

      // 应用过滤
      if (options?.filters) {
        if (options.filters.code) {
          conditions.push(like(devices.code, `%${options.filters.code}%`));
        }
        if (options.filters.name) {
          conditions.push(like(devices.name, `%${options.filters.name}%`));
        }
        if (options.filters.status) {
          conditions.push(eq(devices.status, options.filters.status));
        }
        if (options.filters.type) {
          conditions.push(eq(devices.type, options.filters.type));
        }
      }

      // 排序
      const filtered =
        conditions.length > 0 ? base.where(and(...conditions)) : base;
      const ordered = filtered.orderBy(desc(devices.createdAt));

      const result = ordered.all();
      const data = result;

      return {
        data,
        total: data.length,
        page: options?.pagination?.page || 1,
        pageSize: options?.pagination?.pageSize || data.length,
      };
    },
  );

  // 获取单个设备
  ipcMain.handle(
    'device:getById',
    async (_event, id: number): Promise<Device | null> => {
      const db = getDrizzleDb();
      const result = db.select().from(devices).where(eq(devices.id, id)).get();
      return result || null;
    },
  );

  // 创建设备
  ipcMain.handle(
    'device:create',
    async (_event, data: NewDevice): Promise<Device> => {
      const db = getDrizzleDb();

      const now = new Date();
      const res = db
        .insert(devices)
        .values({
          ...data,
          status: data.status || 'available',
          createdAt: now,
          updatedAt: now,
        })
        .run();

      const id = Number(res.lastInsertRowid);
      const result = db.select().from(devices).where(eq(devices.id, id)).get();
      if (!result) {
        throw new Error('创建设备失败');
      }
      return result;
    },
  );

  // 更新设备
  ipcMain.handle(
    'device:update',
    async (_event, id: number, data: Partial<NewDevice>): Promise<Device> => {
      const db = getDrizzleDb();

      db.update(devices)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(devices.id, id))
        .run();

      const result = db.select().from(devices).where(eq(devices.id, id)).get();
      if (!result) {
        throw new Error('设备不存在');
      }
      return result;
    },
  );

  // 删除设备
  ipcMain.handle('device:delete', async (_event, id: number): Promise<void> => {
    const db = getDrizzleDb();

    // 检查设备是否已借出
    const device = db.select().from(devices).where(eq(devices.id, id)).get();
    if (!device) {
      throw new Error('设备不存在');
    }

    if (device.status === 'borrowed') {
      throw new Error('设备已借出，无法删除');
    }

    // 在事务中删除设备及其关联记录
    db.transaction((tx) => {
      // 1. 删除关联的借还记录
      tx.delete(borrowRecords).where(eq(borrowRecords.deviceId, id)).run();

      // 2. 删除设备本身
      tx.delete(devices).where(eq(devices.id, id)).run();
    });
  });
}
