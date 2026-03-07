/**
 * 单个设备管理 API
 * GET /api/devices/[id] - 获取设备详情
 * PUT /api/devices/[id] - 更新设备
 * DELETE /api/devices/[id] - 删除设备
 */

import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import { borrowRecords, devices } from '@equipment/shared/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// GET /api/devices/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id: idParam } = await context.params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return errorResponse('Invalid ID', 400);
    }

    const db = getDb();
    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.id, id))
      .limit(1);

    if (device.length === 0) {
      return errorResponse('Device not found', 404);
    }

    return successResponse(device[0]);
  } catch (error) {
    console.error('[API] GET /api/devices/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT /api/devices/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id: idParam } = await context.params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return errorResponse('Invalid ID', 400);
    }

    const body = await request.json();

    // 更新设备
    const db = getDb();
    const [device] = await db
      .update(devices)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(devices.id, id))
      .returning();

    if (!device) {
      return errorResponse('Device not found', 404);
    }

    return successResponse(device);
  } catch (error) {
    console.error('[API] PUT /api/devices/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE /api/devices/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id: idParam } = await context.params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return errorResponse('Invalid ID', 400);
    }

    // 检查设备是否已借出
    const db = getDb();
    const activeBorrow = await db
      .select()
      .from(borrowRecords)
      .where(
        and(
          eq(borrowRecords.deviceId, id),
          isNull(borrowRecords.actualReturnTime),
        ),
      )
      .limit(1);

    if (activeBorrow.length > 0) {
      return errorResponse('设备已借出，无法删除', 409);
    }

    await db.delete(devices).where(eq(devices.id, id));

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('[API] DELETE /api/devices/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}
