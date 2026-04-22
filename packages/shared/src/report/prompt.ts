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
    '3.1 sections 数组中每个元素必须包含 key 字段，且只能是 overview/trend/byDeviceType/borrowerInsights。',
    '4. 文案使用简体中文，适合打印为管理报告。',
    '5. sections[*].title 必须是中文，不得输出 overview/trend/byDeviceType/borrowerInsights 英文标题。',
    '6. trend.bullets 每条必须是可解析格式：YYYY-MM-DD: 借出 X / 归还 Y。',
    '7. byDeviceType.bullets 每条必须是可解析格式：设备类型: N 次（N 为整数次数，不是百分比）。',
    '8. 任何比率字段必须在 0~1，任何百分比展示由前端计算，不要在 bullets 输出百分号占比。',
    '',
    '输入数据：',
    JSON.stringify(payload),
  ].join('\n');
}
