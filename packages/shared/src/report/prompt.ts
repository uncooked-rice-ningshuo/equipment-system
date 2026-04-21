import { WeeklyReportDataSnapshot } from './types';

export function buildWeeklyReportPrompt(
  snapshot: WeeklyReportDataSnapshot,
): string {
  const payload = {
    range: {
      periodStart: snapshot.range.periodStart.toISOString(),
      periodEnd: snapshot.range.periodEnd.toISOString(),
    },
    generatedAt: snapshot.generatedAt.toISOString(),
    sampleSize: snapshot.sampleSize,
    kpis: snapshot.kpis,
    daily: snapshot.daily,
    topDeviceTypes: snapshot.topDeviceTypes,
  };

  return [
    '请基于以下设备借还一周数据生成管理周报。',
    '强约束：',
    '1. 输出必须严格符合给定 JSON Schema；不得输出额外字段。',
    '2. KPI 数值必须与输入事实一致，不允许虚构。',
    '3. sections 必须包含 overview/trend/byDeviceType/borrowerInsights 四个 key。',
    '4. 文案使用简体中文，适合打印为管理报告。',
    '',
    '输入数据：',
    JSON.stringify(payload),
  ].join('\n');
}
