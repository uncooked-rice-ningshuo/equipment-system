/**
 * 统计数据 API
 * GET /api/stats - 获取仪表盘统计数据
 */

import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import { borrowRecords, devices } from '@equipment/shared/db/schema';
import { and, count, eq, isNull, lte } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// GET /api/stats
export async function GET(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const db = getDb();

    // 总设备数
    const [{ value: totalDevices }] = await db
      .select({ value: count() })
      .from(devices);

    // 已借出设备数
    const [{ value: borrowedDevices }] = await db
      .select({ value: count() })
      .from(devices)
      .where(eq(devices.status, 'borrowed'));

    // 逾期设备数
    const now = new Date();
    const [{ value: overdueDevices }] = await db
      .select({ value: count() })
      .from(borrowRecords)
      .where(
        and(
          isNull(borrowRecords.actualReturnTime),
          lte(borrowRecords.returnDeadline, now),
        ),
      );

    return successResponse({
      totalDevices: totalDevices || 0,
      borrowedDevices: borrowedDevices || 0,
      availableDevices: (totalDevices || 0) - (borrowedDevices || 0),
      overdueDevices: overdueDevices || 0,
    });
  } catch (error) {
    console.error('[API] GET /api/stats error:', error);
    return errorResponse('Internal server error', 500);
  }
}
