/**
 * 借还记录 IPC Handlers
 */

import type {
  BorrowFilter,
  BorrowRecord,
  ListOptions,
  ListResult,
  NewBorrowRecord,
} from '@equipment/shared';
import { borrowRecords, devices } from '@equipment/shared/db/sqlite-schema';
import { and, desc, eq, gte, isNotNull, isNull, like, lte } from 'drizzle-orm';
import { ipcMain } from 'electron';
import { getDatabase, getDrizzleDb } from '../db/connection';

export function registerBorrowIpc(): void {
  // 获取借还记录列表
  ipcMain.handle(
    'borrow:list',
    async (
      _event,
      options?: ListOptions<BorrowFilter>,
    ): Promise<ListResult<BorrowRecord>> => {
      const db = getDrizzleDb();

      const base = db.select().from(borrowRecords);
      const conditions: any[] = [];

      // 应用过滤
      if (options?.filters) {
        if (options.filters.returned !== undefined) {
          if (options.filters.returned) {
            conditions.push(isNotNull(borrowRecords.actualReturnTime));
          } else {
            conditions.push(isNull(borrowRecords.actualReturnTime));
          }
        }

        if (options.filters.deviceCode) {
          conditions.push(
            like(borrowRecords.deviceCode, `%${options.filters.deviceCode}%`),
          );
        }

        if (options.filters.borrowerName) {
          conditions.push(
            like(
              borrowRecords.borrowerName,
              `%${options.filters.borrowerName}%`,
            ),
          );
        }

        if (options.filters.borrowerClass) {
          conditions.push(
            like(
              borrowRecords.borrowerClass,
              `%${options.filters.borrowerClass}%`,
            ),
          );
        }
      }

      const filtered =
        conditions.length > 0 ? base.where(and(...conditions)) : base;
      const ordered = filtered.orderBy(desc(borrowRecords.borrowTime));

      const result = ordered.all();

      return {
        data: result,
        total: result.length,
        page: options?.pagination?.page || 1,
        pageSize: options?.pagination?.pageSize || result.length,
      };
    },
  );

  // 创建借出记录
  ipcMain.handle(
    'borrow:create',
    async (_event, data: NewBorrowRecord): Promise<BorrowRecord> => {
      const db = getDrizzleDb();
      const rawDb = getDatabase();

      // 检查设备是否存在且可借
      const device = db
        .select()
        .from(devices)
        .where(eq(devices.id, data.deviceId))
        .get();

      if (!device) {
        throw new Error('设备不存在');
      }

      if (device.status === 'borrowed') {
        throw new Error('该设备当前不可借，请选择其他设备');
      }

      // 使用事务
      const transaction = rawDb.transaction(() => {
        // 创建借出记录
        const res = db
          .insert(borrowRecords)
          .values({
            ...data,
            createdAt: new Date(),
          })
          .run();

        // 更新设备状态
        db.update(devices)
          .set({ status: 'borrowed', updatedAt: new Date() })
          .where(eq(devices.id, data.deviceId))
          .run();

        const id = Number(res.lastInsertRowid);
        const record = db
          .select()
          .from(borrowRecords)
          .where(eq(borrowRecords.id, id))
          .get();
        if (!record) {
          throw new Error('创建借出记录失败');
        }
        return record;
      });

      return transaction();
    },
  );

  // 归还设备
  ipcMain.handle('borrow:return', async (_event, id: number): Promise<void> => {
    const db = getDrizzleDb();
    const rawDb = getDatabase();

    const record = db
      .select()
      .from(borrowRecords)
      .where(eq(borrowRecords.id, id))
      .get();

    if (!record) {
      throw new Error('借出记录不存在');
    }

    const transaction = rawDb.transaction(() => {
      // 更新借还记录
      db.update(borrowRecords)
        .set({ actualReturnTime: new Date() })
        .where(eq(borrowRecords.id, id))
        .run();

      // 更新设备状态
      db.update(devices)
        .set({ status: 'available', updatedAt: new Date() })
        .where(eq(devices.id, record.deviceId))
        .run();
    });

    transaction();
  });

  // 删除借还记录
  ipcMain.handle('borrow:delete', async (_event, id: number): Promise<void> => {
    const db = getDrizzleDb();
    db.delete(borrowRecords).where(eq(borrowRecords.id, id)).run();
  });

  // 获取逾期记录
  ipcMain.handle('borrow:getOverdue', async (): Promise<BorrowRecord[]> => {
    const db = getDrizzleDb();
    const now = new Date();

    return db
      .select()
      .from(borrowRecords)
      .where(
        and(
          isNull(borrowRecords.actualReturnTime),
          lte(borrowRecords.returnDeadline, now),
        ),
      )
      .orderBy(borrowRecords.returnDeadline)
      .all();
  });

  // 获取临期记录
  ipcMain.handle(
    'borrow:getDueSoon',
    async (_event, days: number = 7): Promise<BorrowRecord[]> => {
      const db = getDrizzleDb();
      const now = new Date();
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      return db
        .select()
        .from(borrowRecords)
        .where(
          and(
            isNull(borrowRecords.actualReturnTime),
            gte(borrowRecords.returnDeadline, now),
            lte(borrowRecords.returnDeadline, future),
          ),
        )
        .orderBy(borrowRecords.returnDeadline)
        .all();
    },
  );

  // 标记已通知
  ipcMain.handle(
    'borrow:markNotified',
    async (_event, id: number): Promise<void> => {
      const db = getDrizzleDb();
      db.update(borrowRecords)
        .set({ notified: true, notifyTime: new Date() })
        .where(eq(borrowRecords.id, id))
        .run();
    },
  );
}
