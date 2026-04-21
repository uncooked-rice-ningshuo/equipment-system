import {
  buildWeeklySnapshot,
  generateWeeklyReport,
  WeeklyReportRecord,
  WeeklyReportSummary,
} from '@equipment/shared';
import {
  borrowRecords,
  devices,
  reportQueries,
} from '@equipment/shared/db/sqlite-schema';
import { desc, eq } from 'drizzle-orm';
import { ipcMain } from 'electron';
import { getDrizzleDb } from '../db/connection';

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

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
    kpiSnapshot: parseJsonField(row.kpiSnapshot, {
      borrowTotal: 0,
      returnTotal: 0,
      overdueTotal: 0,
      overdueRate: 0,
      avgBorrowDurationHours: 0,
      activeBorrowerCount: 0,
    }),
  };
}

function toRecord(row: any): WeeklyReportRecord {
  const summary = toSummary(row);
  return {
    ...summary,
    reportJson: parseJsonField(row.reportJson, {
      meta: {
        reportId: `weekly-${row.id}`,
        generatedAt: summary.generatedAt,
        periodStart: summary.periodStart,
        periodEnd: summary.periodEnd,
        sampleSize: summary.kpiSnapshot.borrowTotal,
        model: summary.model,
        version: 'v1',
      },
      kpis: summary.kpiSnapshot,
      sections: [],
      risks: [],
      actions: [],
    }),
  };
}

export function registerReportIpc(): void {
  ipcMain.removeHandler('report:weeklyGenerate');
  ipcMain.handle(
    'report:weeklyGenerate',
    async (): Promise<WeeklyReportRecord> => {
      const db = getDrizzleDb();
      const [allRecords, deviceList] = await Promise.all([
        db.select().from(borrowRecords).all(),
        db.select({ id: devices.id, type: devices.type }).from(devices).all(),
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

      const res = db
        .insert(reportQueries)
        .values({
          reportType: 'weekly',
          periodStart: snapshot.range.periodStart,
          periodEnd: snapshot.range.periodEnd,
          generatedAt: snapshot.generatedAt,
          kpiSnapshot: JSON.stringify(snapshot.kpis),
          reportJson: JSON.stringify(generated.report),
          model: generated.model,
          status: generated.status,
          errorMessage: generated.errorMessage ?? null,
        })
        .run();

      const created = db
        .select()
        .from(reportQueries)
        .where(eq(reportQueries.id, Number(res.lastInsertRowid)))
        .get();
      if (!created) throw new Error('Failed to create weekly report record');

      return toRecord(created);
    },
  );

  ipcMain.removeHandler('report:weeklyHistory');
  ipcMain.handle(
    'report:weeklyHistory',
    async (): Promise<WeeklyReportSummary[]> => {
      const db = getDrizzleDb();
      const rows = db
        .select()
        .from(reportQueries)
        .orderBy(desc(reportQueries.generatedAt))
        .all();
      return rows.map(toSummary);
    },
  );

  ipcMain.removeHandler('report:weeklyGetById');
  ipcMain.handle(
    'report:weeklyGetById',
    async (_event, id: number): Promise<WeeklyReportRecord | null> => {
      const db = getDrizzleDb();
      const row = db
        .select()
        .from(reportQueries)
        .where(eq(reportQueries.id, id))
        .get();
      if (!row) return null;
      return toRecord(row);
    },
  );
}
