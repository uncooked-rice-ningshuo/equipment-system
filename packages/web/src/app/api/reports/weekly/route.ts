import { getAuth } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/utils';
import {
  buildWeeklySnapshot,
  generateWeeklyReport,
  WeeklyReportRecord,
} from '@equipment/shared';
import {
  borrowRecords,
  devices,
  reportQueries,
} from '@equipment/shared/db/schema';
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

// POST /api/reports/weekly
export async function POST(request: NextRequest) {
  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });
    if (!session) return errorResponse('Unauthorized', 401);

    const db = getDb();
    const [allRecords, deviceList] = await Promise.all([
      db.select().from(borrowRecords),
      db.select({ id: devices.id, type: devices.type }).from(devices),
    ]);

    const snapshot = buildWeeklySnapshot(
      allRecords as any[],
      deviceList as any[],
    );
    const generated = await generateWeeklyReport({
      snapshot,
      llm: {
        apiKey: process.env.LLM_API_KEY,
        baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.LLM_MODEL,
        timeoutMs: Number(process.env.LLM_TIMEOUT_MS || 20000),
      },
    });

    const [created] = await db
      .insert(reportQueries)
      .values({
        reportType: 'weekly',
        periodStart: snapshot.range.periodStart,
        periodEnd: snapshot.range.periodEnd,
        generatedAt: snapshot.generatedAt,
        kpiSnapshot: snapshot.kpis as any,
        reportJson: generated.report as any,
        model: generated.model,
        status: generated.status,
        errorMessage: generated.errorMessage ?? null,
      })
      .returning();

    return successResponse(toRecord(created), 201);
  } catch (error: any) {
    console.error('[API] POST /api/reports/weekly error:', error);
    return errorResponse(error?.message || 'Internal server error', 500);
  }
}
