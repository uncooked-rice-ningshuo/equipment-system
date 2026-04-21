import { buildWeeklyReportPrompt } from './prompt';
import { parseWeeklyReportSchema, WEEKLY_REPORT_JSON_SCHEMA } from './schema';
import {
  WeeklyReportDataSnapshot,
  WeeklyReportGenerationResult,
  WeeklyReportJson,
} from './types';

type LlmConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
};

type GenerateWeeklyReportInput = {
  snapshot: WeeklyReportDataSnapshot;
  llm: LlmConfig;
};

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(4));
}

function createFallbackReport(
  snapshot: WeeklyReportDataSnapshot,
  model: string,
): WeeklyReportJson {
  const riskLevel =
    snapshot.kpis.overdueRate >= 0.2
      ? 'high'
      : snapshot.kpis.overdueRate >= 0.1
      ? 'medium'
      : 'low';

  return {
    meta: {
      reportId: `weekly-${Date.now()}`,
      generatedAt: snapshot.generatedAt.toISOString(),
      periodStart: snapshot.range.periodStart.toISOString(),
      periodEnd: snapshot.range.periodEnd.toISOString(),
      sampleSize: snapshot.sampleSize,
      model,
      version: 'v1',
    },
    kpis: {
      ...snapshot.kpis,
      overdueRate: clampRate(snapshot.kpis.overdueRate),
    },
    sections: [
      {
        key: 'overview',
        title: '总体概览',
        summary: `本周共借出 ${snapshot.kpis.borrowTotal} 次，归还 ${snapshot.kpis.returnTotal} 次，逾期 ${snapshot.kpis.overdueTotal} 次。`,
        bullets: [
          `活跃借用人数 ${snapshot.kpis.activeBorrowerCount} 人`,
          `平均借用时长 ${snapshot.kpis.avgBorrowDurationHours} 小时`,
        ],
        chartHint: 'kpi_overview',
      },
      {
        key: 'trend',
        title: '趋势变化',
        summary: '借还趋势呈现按日波动，可结合教学排课节奏做借用准备。',
        bullets: snapshot.daily
          .slice(-3)
          .map(
            (d) => `${d.date}: 借出 ${d.borrowCount} / 归还 ${d.returnCount}`,
          ),
        chartHint: 'line:daily_borrow_return',
      },
      {
        key: 'byDeviceType',
        title: '设备类型分析',
        summary: '高频借用设备类型建议优先保障库存与维护。',
        bullets:
          snapshot.topDeviceTypes.length > 0
            ? snapshot.topDeviceTypes.map((i) => `${i.type}: ${i.count} 次`)
            : ['本周暂无有效借用类型数据'],
        chartHint: 'bar:top_device_types',
      },
      {
        key: 'borrowerInsights',
        title: '借用人洞察',
        summary: '本周借用群体活跃度稳定，可持续关注高频借用班级的归还纪律。',
        bullets: [
          `活跃借用人数 ${snapshot.kpis.activeBorrowerCount}`,
          `逾期率 ${(clampRate(snapshot.kpis.overdueRate) * 100).toFixed(2)}%`,
        ],
        chartHint: 'text:borrower_activity',
      },
    ],
    risks: [
      {
        level: riskLevel,
        title: '逾期风险',
        detail: `当前逾期率 ${(
          clampRate(snapshot.kpis.overdueRate) * 100
        ).toFixed(2)}%，建议持续追踪未归还设备。`,
      },
    ],
    actions: [
      {
        priority: 'p1',
        owner: '设备管理员',
        action: '对本周未归还设备执行一次集中催还并登记结果。',
      },
      {
        priority: 'p2',
        owner: '实验室负责人',
        action: '对高频借用设备类型安排库存检查与保养。',
      },
    ],
  };
}

function validateFacts(
  report: WeeklyReportJson,
  snapshot: WeeklyReportDataSnapshot,
): boolean {
  const k = report.kpis;
  const s = snapshot.kpis;
  const close = (a: number, b: number, tolerance = 0.001) =>
    Math.abs(a - b) <= tolerance;
  return (
    k.borrowTotal === s.borrowTotal &&
    k.returnTotal === s.returnTotal &&
    k.overdueTotal === s.overdueTotal &&
    k.activeBorrowerCount === s.activeBorrowerCount &&
    close(k.avgBorrowDurationHours, s.avgBorrowDurationHours, 0.01) &&
    close(k.overdueRate, clampRate(s.overdueRate), 0.001)
  );
}

async function requestLlmJson(
  prompt: string,
  llm: Required<LlmConfig>,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), llm.timeoutMs);
  try {
    const url = `${llm.baseUrl.replace(/\/$/, '')}/responses`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        model: llm.model,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: '你是设备借还周报助手。' }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt }],
          },
        ],
        temperature: 0.2,
        text: {
          format: {
            type: 'json_schema',
            name: 'weekly_report',
            schema: WEEKLY_REPORT_JSON_SCHEMA,
            strict: true,
          },
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM request failed: HTTP ${response.status} ${text}`);
    }
    const data: any = await response.json();
    const outputText =
      data?.output_text ||
      data?.output?.[0]?.content?.find((c: any) => c?.type === 'output_text')
        ?.text;
    if (!outputText) {
      throw new Error('LLM response missing output_text');
    }
    return JSON.parse(outputText);
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateWeeklyReport({
  snapshot,
  llm,
}: GenerateWeeklyReportInput): Promise<WeeklyReportGenerationResult> {
  const model = llm.model || 'fallback-template';
  const fallback = createFallbackReport(snapshot, model);
  const normalizedLlm = {
    apiKey: llm.apiKey || '',
    baseUrl: llm.baseUrl || '',
    model: llm.model || '',
    timeoutMs: llm.timeoutMs || 20000,
  };

  if (!normalizedLlm.apiKey || !normalizedLlm.baseUrl || !normalizedLlm.model) {
    return { status: 'fallback', report: fallback, model };
  }

  try {
    const prompt = buildWeeklyReportPrompt(snapshot);
    const raw = await requestLlmJson(prompt, normalizedLlm);
    const parsed = parseWeeklyReportSchema(raw);
    const report: WeeklyReportJson = {
      ...parsed,
      meta: {
        ...parsed.meta,
        reportId: parsed.meta.reportId || `weekly-${Date.now()}`,
        generatedAt: snapshot.generatedAt.toISOString(),
        periodStart: snapshot.range.periodStart.toISOString(),
        periodEnd: snapshot.range.periodEnd.toISOString(),
        sampleSize: snapshot.sampleSize,
        model: normalizedLlm.model,
        version: 'v1',
      },
      kpis: {
        ...snapshot.kpis,
        overdueRate: clampRate(snapshot.kpis.overdueRate),
      },
    };
    if (!validateFacts(report, snapshot)) {
      return {
        status: 'fallback',
        report: fallback,
        model: normalizedLlm.model,
        errorMessage: 'FACT_MISMATCH',
      };
    }
    return { status: 'success', report, model: normalizedLlm.model };
  } catch (error: any) {
    return {
      status: 'fallback',
      report: fallback,
      model: normalizedLlm.model,
      errorMessage: error?.message || 'LLM_REQUEST_FAILED',
    };
  }
}
