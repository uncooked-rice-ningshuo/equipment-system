import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import { WeeklyReportRecord } from '@equipment/shared';
import { reportQueries } from '@equipment/shared/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

function toRecord(row: any): WeeklyReportRecord {
  return {
    id: row.id,
    reportType: row.reportType,
    generatedAt: new Date(row.generatedAt).toISOString(),
    periodStart: new Date(row.periodStart).toISOString(),
    periodEnd: new Date(row.periodEnd).toISOString(),
    model: row.model,
    status: row.status,
    errorMessage: row.errorMessage ?? null,
    kpiSnapshot: row.kpiSnapshot,
    reportJson: row.reportJson,
  };
}

// GET /api/reports/weekly/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) return errorResponse('Unauthorized', 401);

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) return errorResponse('Invalid ID', 400);

    const db = getDb();
    const [row] = await db
      .select()
      .from(reportQueries)
      .where(eq(reportQueries.id, id))
      .limit(1);
    if (!row) return errorResponse('Record not found', 404);

    return successResponse(toRecord(row));
  } catch (error: any) {
    console.error('[API] GET /api/reports/weekly/[id] error:', error);
    return errorResponse(error?.message || 'Internal server error', 500);
  }
}
