/**
 * 统计数据 IPC Handlers
 */

import type { DashboardStats, DeviceTypeStat } from '@equipment/shared';
import { devices } from '@equipment/shared/db/sqlite-schema';
import { count, eq } from 'drizzle-orm';
import { ipcMain } from 'electron';
import { getDatabase, getDrizzleDb } from '../db/connection';

export function registerStatsIpc(): void {
  const getBorrowTrends = async (
    period: 'week' | 'month' | 'quarter',
  ): Promise<DeviceTypeStat[]> => {
    const rawDb = getDatabase();
    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);

    let thresholdMs: number;
    let thresholdSec: number;
    switch (period) {
      case 'week':
        thresholdMs = nowMs - 7 * 24 * 60 * 60 * 1000;
        thresholdSec = nowSec - 7 * 24 * 60 * 60;
        break;
      case 'month':
        thresholdMs = nowMs - 30 * 24 * 60 * 60 * 1000;
        thresholdSec = nowSec - 30 * 24 * 60 * 60;
        break;
      case 'quarter':
        {
          const date = new Date(nowMs);
          date.setMonth(date.getMonth() - 3);
          thresholdMs = date.getTime();
        }
        thresholdSec = Math.floor(thresholdMs / 1000);
        break;
      default:
        thresholdMs = nowMs - 7 * 24 * 60 * 60 * 1000;
        thresholdSec = nowSec - 7 * 24 * 60 * 60;
    }

    return rawDb
      .prepare(
        `SELECT COALESCE(d.type, '未分类') as name, COUNT(*) as value
           FROM borrow_records br
           JOIN devices d ON d.id = br.device_id
           WHERE (br.borrow_time >= ? AND br.borrow_time >= 1000000000000)
              OR (br.borrow_time >= ? AND br.borrow_time < 1000000000000)
           GROUP BY d.type
           ORDER BY value DESC`,
      )
      .all(thresholdMs, thresholdSec) as DeviceTypeStat[];
  };

  // 仪表盘统计数据
  ipcMain.handle('stats:dashboard', async (): Promise<DashboardStats> => {
    const db = getDrizzleDb();
    const rawDb = getDatabase();

    // 总设备数
    const [{ value: totalDevices }] = db
      .select({ value: count() })
      .from(devices)
      .all();

    // 已借出设备数
    const [{ value: borrowedDevices }] = db
      .select({ value: count() })
      .from(devices)
      .where(eq(devices.status, 'borrowed'))
      .all();

    // 逾期设备数（使用原始 SQL 查询）
    const nowMs = Date.now();
    const nowSec = Math.floor(nowMs / 1000);
    const overdueResult = rawDb
      .prepare(
        `SELECT COUNT(*) as count FROM borrow_records
         WHERE actual_return_time IS NULL
         AND (
           (return_deadline < ? AND return_deadline >= 1000000000000)
           OR (return_deadline < ? AND return_deadline < 1000000000000)
         )`,
      )
      .get(nowMs, nowSec) as { count: number };

    return {
      totalDevices: totalDevices || 0,
      borrowedDevices: borrowedDevices || 0,
      availableDevices: (totalDevices || 0) - (borrowedDevices || 0),
      overdueDevices: overdueResult?.count || 0,
    };
  });

  // 设备类型分布
  ipcMain.handle(
    'stats:deviceTypeDistribution',
    async (): Promise<DeviceTypeStat[]> => {
      const rawDb = getDatabase();

      const result = rawDb
        .prepare(
          `SELECT COALESCE(type, '未分类') as name, COUNT(*) as value
         FROM devices
         GROUP BY type
         ORDER BY value DESC`,
        )
        .all() as DeviceTypeStat[];

      return result;
    },
  );

  // 借还趋势（按设备类型）
  ipcMain.handle(
    'stats:borrowTrends',
    async (
      _event,
      period: 'week' | 'month' | 'quarter',
    ): Promise<DeviceTypeStat[]> => {
      return getBorrowTrends(period);
    },
  );

  ipcMain.handle(
    'stats:borrowedByType',
    async (
      _event,
      period: 'week' | 'month' | 'quarter',
    ): Promise<DeviceTypeStat[]> => {
      return getBorrowTrends(period);
    },
  );
}
