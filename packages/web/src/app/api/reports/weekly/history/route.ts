import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import { WeeklyReportSummary } from '@equipment/shared';
import { reportQueries } from '@equipment/shared/db/schema';
import { desc } from 'drizzle-orm';
import { NextRequest } from 'next/server';

function toSummary(row: any): WeeklyReportSummary {
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
  };
}

// GET /api/reports/weekly/history
export async function GET(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) return errorResponse('Unauthorized', 401);

    const db = getDb();
    const rows = await db
      .select()
      .from(reportQueries)
      .orderBy(desc(reportQueries.generatedAt))
      .limit(200);

    return successResponse(rows.map(toSummary));
  } catch (error: any) {
    console.error('[API] GET /api/reports/weekly/history error:', error);
    return errorResponse(error?.message || 'Internal server error', 500);
  }
}
