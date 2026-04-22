/**
 * 设备管理 API
 * GET /api/devices - 获取设备列表
 * POST /api/devices - 创建设备
 */

import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import { devices } from '@equipment/shared/db/schema';
import { and, eq, like } from 'drizzle-orm';
import { NextRequest } from 'next/server';

// GET /api/devices
export async function GET(request: NextRequest) {
  try {
    // 验证登录
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const filters = {
      code: searchParams.get('code') || undefined,
      name: searchParams.get('name') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      brand: searchParams.get('brand') || undefined,
    };

    // 构建查询
    const db = getDb();
    const base = db.select().from(devices);
    const conditions: any[] = [];
    if (filters.code) {
      conditions.push(like(devices.code, `%${filters.code}%`));
    }
    if (filters.name) {
      conditions.push(like(devices.name, `%${filters.name}%`));
    }
    if (filters.status) {
      conditions.push(eq(devices.status, filters.status));
    }
    if (filters.type) {
      conditions.push(eq(devices.type, filters.type));
    }
    if (filters.brand) {
      conditions.push(like(devices.brand, `%${filters.brand}%`));
    }

    const query = conditions.length > 0 ? base.where(and(...conditions)) : base;
    const result = await query;

    return successResponse({
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('[API] GET /api/devices error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/devices
export async function POST(request: NextRequest) {
  try {
    // 验证登录
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    // 验证必填字段
    if (!body.code || !body.name) {
      return errorResponse('Missing required fields: code, name');
    }

    // 创建设备
    const db = getDb();
    const [device] = await db
      .insert(devices)
      .values({
        code: body.code,
        name: body.name,
        type: body.type || '',
        brand: body.brand || '',
        model: body.model || '',
        price: body.price || 0,
        location: body.location || '',
        status: 'available',
      })
      .returning();

    return successResponse(device, 201);
  } catch (error: any) {
    console.error('[API] POST /api/devices error:', error);

    // 处理唯一约束错误
    if (error.message?.includes('unique constraint')) {
      return errorResponse('设备编号已存在', 409);
    }

    return errorResponse('Internal server error', 500);
  }
}
