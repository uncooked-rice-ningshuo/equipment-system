/**
 * 借还记录 API
 * GET /api/borrow - 获取借还记录列表
 * POST /api/borrow - 创建借出记录
 */

import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import { borrowRecords, devices } from '@equipment/shared/db/schema';
import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  like,
  lte,
} from 'drizzle-orm';
import { NextRequest } from 'next/server';

// GET /api/borrow
export async function GET(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const returned = searchParams.get('returned');
    const deviceCode = searchParams.get('deviceCode');
    const deviceName = searchParams.get('deviceName');
    const deviceType = searchParams.get('deviceType');
    const borrowerName = searchParams.get('borrowerName');
    const borrowerClass = searchParams.get('borrowerClass');
    const borrowerStudentId = searchParams.get('borrowerStudentId');
    const borrowTimeStart = searchParams.get('borrowTimeStart');
    const borrowTimeEnd = searchParams.get('borrowTimeEnd');
    const returnTimeStart = searchParams.get('returnTimeStart');
    const returnTimeEnd = searchParams.get('returnTimeEnd');

    const db = getDb();
    const base = db.select().from(borrowRecords);
    const conditions: any[] = [];

    if (returned === 'true') {
      conditions.push(isNotNull(borrowRecords.actualReturnTime));
    } else if (returned === 'false') {
      conditions.push(isNull(borrowRecords.actualReturnTime));
    }

    if (deviceCode) {
      conditions.push(like(borrowRecords.deviceCode, `%${deviceCode}%`));
    }
    if (deviceName) {
      conditions.push(like(borrowRecords.deviceName, `%${deviceName}%`));
    }

    if (borrowerName) {
      conditions.push(like(borrowRecords.borrowerName, `%${borrowerName}%`));
    }

    if (borrowerClass) {
      conditions.push(like(borrowRecords.borrowerClass, `%${borrowerClass}%`));
    }
    if (borrowerStudentId) {
      conditions.push(
        like(borrowRecords.borrowerStudentId, `%${borrowerStudentId}%`),
      );
    }

    if (borrowTimeStart) {
      const date = new Date(borrowTimeStart);
      if (!Number.isNaN(date.getTime())) {
        conditions.push(gte(borrowRecords.borrowTime, date));
      }
    }
    if (borrowTimeEnd) {
      const date = new Date(borrowTimeEnd);
      if (!Number.isNaN(date.getTime())) {
        conditions.push(lte(borrowRecords.borrowTime, date));
      }
    }
    if (returnTimeStart) {
      const date = new Date(returnTimeStart);
      if (!Number.isNaN(date.getTime())) {
        conditions.push(gte(borrowRecords.actualReturnTime, date));
      }
    }
    if (returnTimeEnd) {
      const date = new Date(returnTimeEnd);
      if (!Number.isNaN(date.getTime())) {
        conditions.push(lte(borrowRecords.actualReturnTime, date));
      }
    }

    if (deviceType) {
      const typedDevices = await db
        .select({ id: devices.id })
        .from(devices)
        .where(eq(devices.type, deviceType));
      const typedIds = typedDevices.map((item) => item.id);
      if (typedIds.length === 0) {
        return successResponse({
          data: [],
          total: 0,
        });
      }
      conditions.push(inArray(borrowRecords.deviceId, typedIds));
    }

    const query = conditions.length > 0 ? base.where(and(...conditions)) : base;
    const result = await query.orderBy(desc(borrowRecords.borrowTime));

    return successResponse({
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('[API] GET /api/borrow error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/borrow
export async function POST(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    // 验证必填字段
    if (
      !body.deviceId ||
      !body.borrowerName ||
      !body.borrowTime ||
      !body.returnDeadline
    ) {
      return errorResponse('Missing required fields');
    }

    // 检查设备是否存在且可借
    const db = getDb();
    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.id, body.deviceId))
      .limit(1);

    if (device.length === 0) {
      return errorResponse('Device not found', 404);
    }

    if (device[0].status === 'borrowed') {
      return errorResponse('该设备当前不可借，请选择其他设备', 409);
    }

    // 创建借出记录并更新设备状态（使用事务）
    const result = await db.transaction(async (tx) => {
      // 创建设备记录
      const [record] = await tx
        .insert(borrowRecords)
        .values({
          deviceId: body.deviceId,
          deviceCode: device[0].code,
          deviceName: device[0].name,
          borrowerName: body.borrowerName,
          borrowerClass: body.borrowerClass || '',
          borrowerStudentId: body.borrowerStudentId || '',
          borrowerPhone: body.borrowerPhone || '',
          borrowTime: new Date(body.borrowTime),
          returnDeadline: new Date(body.returnDeadline),
        })
        .returning();

      // 更新设备状态
      await tx
        .update(devices)
        .set({ status: 'borrowed' })
        .where(eq(devices.id, body.deviceId));

      return record;
    });

    return successResponse(result, 201);
  } catch (error) {
    console.error('[API] POST /api/borrow error:', error);
    return errorResponse('Internal server error', 500);
  }
}
