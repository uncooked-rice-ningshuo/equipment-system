/**
 * 单个借还记录管理 API
 * GET /api/borrow/[id] - 获取记录详情
 * PUT /api/borrow/[id] - 更新记录（归还）
 * DELETE /api/borrow/[id] - 删除记录
 */

import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import { borrowRecords, devices } from '@equipment/shared/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// PUT /api/borrow/[id] - 归还设备
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid ID', 400);
    }

    const db = getDb();

    // 获取记录
    const record = await db
      .select()
      .from(borrowRecords)
      .where(eq(borrowRecords.id, id))
      .limit(1);

    if (record.length === 0) {
      return errorResponse('Record not found', 404);
    }

    // 归还设备（使用事务）
    await db.transaction(async (tx) => {
      // 更新借还记录
      await tx
        .update(borrowRecords)
        .set({ actualReturnTime: new Date() })
        .where(eq(borrowRecords.id, id));

      // 更新设备状态为可用
      await tx
        .update(devices)
        .set({ status: 'available' })
        .where(eq(devices.id, record[0].deviceId));
    });

    return successResponse({ returned: true });
  } catch (error) {
    console.error('[API] PUT /api/borrow/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE /api/borrow/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return errorResponse('Invalid ID', 400);
    }

    const db = getDb();
    await db.delete(borrowRecords).where(eq(borrowRecords.id, id));

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('[API] DELETE /api/borrow/[id] error:', error);
    return errorResponse('Internal server error', 500);
  }
}
