/**
 * 统计数据 IPC Handlers
 */

import type { DashboardStats, DeviceTypeStat } from '@equipment/shared';
import { devices } from '@equipment/shared/db/sqlite-schema';
import { count, eq } from 'drizzle-orm';
import { ipcMain } from 'electron';
import { getDatabase, getDrizzleDb } from '../db/connection';

export function registerStatsIpc(): void {
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
    const now = new Date().toISOString();
    const overdueResult = rawDb
      .prepare(
        `SELECT COUNT(*) as count FROM borrow_records
         WHERE actual_return_time IS NULL
         AND datetime(return_deadline) < datetime(?)`,
      )
      .get(now) as { count: number };

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
      period: 'week' | 'month' | 'year',
    ): Promise<DeviceTypeStat[]> => {
      const rawDb = getDatabase();

      let days: number;
      switch (period) {
        case 'week':
          days = 7;
          break;
        case 'month':
          days = 30;
          break;
        case 'year':
          days = 365;
          break;
        default:
          days = 7;
      }

      const result = rawDb
        .prepare(
          `SELECT COALESCE(d.type, '未分类') as name, COUNT(*) as value
           FROM borrow_records br
           JOIN devices d ON d.id = br.device_id
           WHERE br.borrow_time >= datetime('now', '-${days} days')
           GROUP BY d.type
           ORDER BY value DESC`,
        )
        .all() as DeviceTypeStat[];

      return result;
    },
  );
}
