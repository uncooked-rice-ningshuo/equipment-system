import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import { deviceTypes } from '@equipment/shared/db/schema';
import { and, asc, eq, like } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || undefined;

    const db = getDb();
    const base = db.select().from(deviceTypes);
    const conditions: any[] = [];

    if (name) {
      conditions.push(like(deviceTypes.name, `%${name}%`));
    }

    const query = conditions.length > 0 ? base.where(and(...conditions)) : base;
    const result = await query.orderBy(asc(deviceTypes.name));

    return successResponse({
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('[API] GET /api/device-types error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    const rawName = body?.name;
    if (typeof rawName !== 'string' || rawName.trim().length === 0) {
      return errorResponse('Missing required field: name');
    }

    const name = rawName.trim();
    const description =
      typeof body?.description === 'string' ? body.description : '';

    const db = getDb();
    const inserted = await db
      .insert(deviceTypes)
      .values({
        name,
        description,
      })
      .onConflictDoNothing({ target: deviceTypes.name })
      .returning();

    if (inserted.length > 0) {
      return successResponse(inserted[0], 201);
    }

    const existing = await db
      .select()
      .from(deviceTypes)
      .where(eq(deviceTypes.name, name))
      .limit(1);

    if (existing.length === 0) {
      return errorResponse('Internal server error', 500);
    }

    return successResponse(existing[0], 200);
  } catch (error: any) {
    console.error('[API] POST /api/device-types error:', error);

    if (error?.code === '23505') {
      return errorResponse('设备类型已存在', 409);
    }

    return errorResponse('Internal server error', 500);
  }
}
