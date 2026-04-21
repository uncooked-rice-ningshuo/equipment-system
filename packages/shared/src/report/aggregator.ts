import {
  WeeklyRange,
  WeeklyReportDailyCount,
  WeeklyReportDataSnapshot,
} from './types';

type BorrowRecordLike = {
  deviceId: number;
  borrowTime: Date | string | number;
  actualReturnTime: Date | string | number | null;
  returnDeadline: Date | string | number;
  borrowerName: string;
};

type DeviceLike = {
  id: number;
  type: string;
};

function normalizeDate(
  value: Date | string | number | null | undefined,
): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  const n =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  const d = new Date(n as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDay(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getRecentWeekRange(now: Date = new Date()): WeeklyRange {
  const periodEnd = new Date(now);
  const periodStart = new Date(now);
  periodStart.setHours(0, 0, 0, 0);
  periodStart.setDate(periodStart.getDate() - 6);
  return { periodStart, periodEnd };
}

export function buildWeeklySnapshot(
  records: BorrowRecordLike[],
  devices: DeviceLike[],
  range: WeeklyRange = getRecentWeekRange(),
  generatedAt: Date = new Date(),
): WeeklyReportDataSnapshot {
  const { periodStart, periodEnd } = range;
  const typeMap = new Map<number, string>();
  for (const d of devices) {
    typeMap.set(d.id, d.type || '未分类');
  }

  const dailyMap = new Map<string, WeeklyReportDailyCount>();
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(periodStart);
    day.setDate(periodStart.getDate() + i);
    const key = formatDay(day);
    dailyMap.set(key, { date: key, borrowCount: 0, returnCount: 0 });
  }

  let borrowTotal = 0;
  let returnTotal = 0;
  let overdueTotal = 0;
  let totalDurationHours = 0;
  let durationSampleCount = 0;
  const activeBorrowers = new Set<string>();
  const typeCounter = new Map<string, number>();

  for (const record of records) {
    const borrowTime = normalizeDate(record.borrowTime);
    const returnTime = normalizeDate(record.actualReturnTime);
    const returnDeadline = normalizeDate(record.returnDeadline);

    if (!borrowTime || !returnDeadline) continue;

    const isBorrowInRange =
      borrowTime >= periodStart && borrowTime <= periodEnd;
    const isReturnInRange =
      returnTime !== null &&
      returnTime >= periodStart &&
      returnTime <= periodEnd;

    if (isBorrowInRange) {
      borrowTotal += 1;
      const day = dailyMap.get(formatDay(borrowTime));
      if (day) day.borrowCount += 1;
      activeBorrowers.add(record.borrowerName || '未知借用人');
      const type = typeMap.get(record.deviceId) || '未分类';
      typeCounter.set(type, (typeCounter.get(type) || 0) + 1);
    }

    if (isReturnInRange && returnTime) {
      returnTotal += 1;
      const day = dailyMap.get(formatDay(returnTime));
      if (day) day.returnCount += 1;
    }

    if (isBorrowInRange && !returnTime && returnDeadline < generatedAt) {
      overdueTotal += 1;
    }

    if (isBorrowInRange && returnTime) {
      const duration = returnTime.getTime() - borrowTime.getTime();
      if (duration > 0) {
        totalDurationHours += duration / (1000 * 60 * 60);
        durationSampleCount += 1;
      }
    }
  }

  const avgBorrowDurationHours =
    durationSampleCount > 0
      ? Number((totalDurationHours / durationSampleCount).toFixed(2))
      : 0;
  const overdueRate =
    borrowTotal > 0 ? Number((overdueTotal / borrowTotal).toFixed(4)) : 0;

  return {
    range,
    generatedAt,
    sampleSize: borrowTotal,
    kpis: {
      borrowTotal,
      returnTotal,
      overdueTotal,
      overdueRate,
      avgBorrowDurationHours,
      activeBorrowerCount: activeBorrowers.size,
    },
    daily: Array.from(dailyMap.values()),
    topDeviceTypes: Array.from(typeCounter.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}
