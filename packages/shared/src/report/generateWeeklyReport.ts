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
  endpoint?: 'responses' | 'chat_completions';
};

type GenerateWeeklyReportInput = {
  snapshot: WeeklyReportDataSnapshot;
  llm: LlmConfig;
};

type NormalizedLlmConfig = Required<Omit<LlmConfig, 'endpoint'>> &
  Pick<LlmConfig, 'endpoint'>;

type DiagnosticStage =
  | 'config'
  | 'request'
  | 'response_status'
  | 'response_parse'
  | 'schema_parse'
  | 'fact_check';

class LlmDiagnosticError extends Error {
  stage: DiagnosticStage;
  detail?: string;

  constructor(stage: DiagnosticStage, message: string, detail?: string) {
    super(message);
    this.name = 'LlmDiagnosticError';
    this.stage = stage;
    this.detail = detail;
  }
}

type LlmEndpoint = 'responses' | 'chat_completions';

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeLlmBaseUrl(baseUrl: string): string {
  const trimmed = stripTrailingSlashes(baseUrl.trim());
  if (!trimmed) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.pathname === '' || url.pathname === '/') {
      url.pathname = '/v1';
      return stripTrailingSlashes(url.toString());
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

function endpointFromUrl(url: string): LlmEndpoint | null {
  const normalized = stripTrailingSlashes(url.trim());
  if (/\/chat\/completions$/i.test(normalized)) return 'chat_completions';
  if (/\/responses$/i.test(normalized)) return 'responses';
  return null;
}

function defaultLlmEndpoint(baseUrl: string): LlmEndpoint {
  try {
    const url = new URL(baseUrl);
    return /(^|\.)api\.openai\.com$/i.test(url.hostname)
      ? 'responses'
      : 'chat_completions';
  } catch {
    return 'chat_completions';
  }
}

export function resolveWeeklyReportLlmRequestTarget(
  baseUrl: string,
  endpoint?: LlmEndpoint,
): { url: string; endpoint: LlmEndpoint } {
  const trimmed = stripTrailingSlashes(baseUrl.trim());
  const embeddedEndpoint = endpointFromUrl(trimmed);
  if (embeddedEndpoint) {
    if (endpoint && endpoint !== embeddedEndpoint) {
      const baseWithoutEndpoint = trimmed.replace(
        embeddedEndpoint === 'chat_completions'
          ? /\/chat\/completions$/i
          : /\/responses$/i,
        '',
      );
      return resolveWeeklyReportLlmRequestTarget(baseWithoutEndpoint, endpoint);
    }
    return {
      url: trimmed,
      endpoint: embeddedEndpoint,
    };
  }

  const normalizedBaseUrl = normalizeLlmBaseUrl(trimmed);
  const resolvedEndpoint = endpoint || defaultLlmEndpoint(normalizedBaseUrl);
  const path =
    resolvedEndpoint === 'chat_completions' ? 'chat/completions' : 'responses';
  return {
    url: `${normalizedBaseUrl}/${path}`,
    endpoint: resolvedEndpoint,
  };
}

function toPreview(value: unknown, maxLength = 800): string {
  try {
    const text =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  } catch {
    return String(value);
  }
}

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

function collectFactMismatches(
  report: WeeklyReportJson,
  snapshot: WeeklyReportDataSnapshot,
) {
  const k = report.kpis;
  const s = snapshot.kpis;
  const mismatches: Array<{ field: string; expected: number; actual: number }> =
    [];
  const pushIfMismatch = (field: string, expected: number, actual: number) => {
    const tolerance = field === 'avgBorrowDurationHours' ? 0.01 : 0.001;
    if (Math.abs(actual - expected) > tolerance) {
      mismatches.push({ field, expected, actual });
    }
  };
  pushIfMismatch('borrowTotal', s.borrowTotal, k.borrowTotal);
  pushIfMismatch('returnTotal', s.returnTotal, k.returnTotal);
  pushIfMismatch('overdueTotal', s.overdueTotal, k.overdueTotal);
  pushIfMismatch(
    'activeBorrowerCount',
    s.activeBorrowerCount,
    k.activeBorrowerCount,
  );
  pushIfMismatch(
    'avgBorrowDurationHours',
    s.avgBorrowDurationHours,
    k.avgBorrowDurationHours,
  );
  pushIfMismatch('overdueRate', clampRate(s.overdueRate), k.overdueRate);
  return mismatches;
}

function normalizeSectionItem(
  key: 'overview' | 'trend' | 'byDeviceType' | 'borrowerInsights',
  value: any,
) {
  const titleMap: Record<
    'overview' | 'trend' | 'byDeviceType' | 'borrowerInsights',
    string
  > = {
    overview: '管理层概览',
    trend: '每周趋势',
    byDeviceType: '设备类型分析',
    borrowerInsights: '借用人洞察',
  };
  if (!value || typeof value !== 'object') {
    return {
      key,
      title: titleMap[key],
      summary: '',
      bullets: [],
      chartHint: '',
    };
  }
  const rawTitle = String(value.title ?? '').trim();
  const normalizedTitle =
    !rawTitle || rawTitle.toLowerCase() === key.toLowerCase()
      ? titleMap[key]
      : rawTitle;
  const bullets = Array.isArray(value.bullets)
    ? value.bullets.map((b: any) => String(b))
    : [];
  const normalizedBullets =
    key === 'byDeviceType'
      ? bullets.map((item: string) => {
          const parsed = item.match(
            /(.+?)(?:[:：]\s*|\s+)(\d+)(?:\s*次)?(?:\s*%?)$/,
          );
          if (!parsed) return item;
          return `${parsed[1].trim()}: ${parsed[2]} 次`;
        })
      : bullets;
  return {
    key,
    title: normalizedTitle,
    summary: String(value.summary ?? ''),
    bullets: normalizedBullets,
    chartHint: String(value.chartHint ?? ''),
  };
}

function inferSectionKeyByTitle(
  title: string,
): 'overview' | 'trend' | 'byDeviceType' | 'borrowerInsights' | null {
  const t = title.trim().toLowerCase();
  if (!t) return null;
  if (
    t.includes('overview') ||
    t.includes('概览') ||
    t.includes('概况') ||
    t.includes('总览')
  ) {
    return 'overview';
  }
  if (t.includes('trend') || t.includes('趋势')) {
    return 'trend';
  }
  if (
    t.includes('devicetype') ||
    t.includes('device type') ||
    t.includes('设备类型') ||
    t.includes('类型统计')
  ) {
    return 'byDeviceType';
  }
  if (
    t.includes('borrowerinsights') ||
    t.includes('borrower insights') ||
    t.includes('借用人洞察') ||
    t.includes('借用洞察')
  ) {
    return 'borrowerInsights';
  }
  return null;
}

function normalizeChatCompletionsPayload(
  payload: any,
  snapshot: WeeklyReportDataSnapshot,
  model: string,
): any {
  const source =
    payload?.report && typeof payload.report === 'object'
      ? payload.report
      : payload;

  const sectionKeys: Array<
    'overview' | 'trend' | 'byDeviceType' | 'borrowerInsights'
  > = ['overview', 'trend', 'byDeviceType', 'borrowerInsights'];

  const sectionArray = Array.isArray(source?.sections) ? source.sections : [];
  const sectionMap = new Map<string, any>();
  const unknownSections: any[] = [];
  for (const item of sectionArray) {
    if (!item || typeof item !== 'object') continue;
    const key = String(item.key || '').trim();
    if (key) {
      sectionMap.set(key, item);
      continue;
    }
    const inferredByTitle = inferSectionKeyByTitle(String(item.title ?? ''));
    if (inferredByTitle) {
      sectionMap.set(inferredByTitle, { ...item, key: inferredByTitle });
      continue;
    }
    unknownSections.push(item);
  }
  for (const key of sectionKeys) {
    if (sectionMap.has(key) || unknownSections.length === 0) continue;
    const fallbackItem = unknownSections.shift();
    sectionMap.set(key, { ...fallbackItem, key });
  }
  const normalizedSections = sectionKeys.map((key) =>
    normalizeSectionItem(
      key,
      sectionMap.get(key) ?? source?.sections?.[key] ?? source?.[key],
    ),
  );

  return {
    meta: {
      reportId:
        source?.meta?.reportId || source?.reportId || `weekly-${Date.now()}`,
      generatedAt: snapshot.generatedAt.toISOString(),
      periodStart: snapshot.range.periodStart.toISOString(),
      periodEnd: snapshot.range.periodEnd.toISOString(),
      sampleSize: snapshot.sampleSize,
      model: String(source?.meta?.model ?? model),
      version: 'v1',
    },
    kpis: {
      ...snapshot.kpis,
      ...(source?.kpis && typeof source.kpis === 'object' ? source.kpis : {}),
      overdueRate: clampRate(
        Number(source?.kpis?.overdueRate ?? snapshot.kpis.overdueRate),
      ),
    },
    sections: normalizedSections,
    risks: Array.isArray(source?.risks)
      ? source.risks
      : Array.isArray(source?.riskItems)
      ? source.riskItems
      : [],
    actions: Array.isArray(source?.actions)
      ? source.actions
      : Array.isArray(source?.actionPlan)
      ? source.actionPlan
      : [],
  };
}

async function requestLlmJson(
  prompt: string,
  llm: NormalizedLlmConfig,
): Promise<unknown> {
  const stripNoise = (text: string): string => {
    return text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json\s*([\s\S]*?)```/gi, '$1')
      .replace(/```\s*([\s\S]*?)```/gi, '$1')
      .trim();
  };

  const findJsonCandidates = (text: string): string[] => {
    const candidates: string[] = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaped = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === '{') {
        if (depth === 0) start = i;
        depth += 1;
        continue;
      }
      if (ch === '}') {
        if (depth > 0) depth -= 1;
        if (depth === 0 && start >= 0) {
          candidates.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
    return candidates;
  };

  const extractJson = (rawText: string): unknown => {
    const trimmed = stripNoise(rawText);
    try {
      return JSON.parse(trimmed);
    } catch {
      const candidates = findJsonCandidates(trimmed);
      for (let i = candidates.length - 1; i >= 0; i -= 1) {
        try {
          return JSON.parse(candidates[i]);
        } catch {
          // Try next candidate.
        }
      }
      throw new LlmDiagnosticError(
        'response_parse',
        'LLM response is not valid JSON',
        toPreview(trimmed, 500),
      );
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), llm.timeoutMs);
  try {
    const target = resolveWeeklyReportLlmRequestTarget(
      llm.baseUrl,
      llm.endpoint,
    );

    if (target.endpoint === 'chat_completions') {
      const response = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${llm.apiKey}`,
        },
        body: JSON.stringify({
          model: llm.model,
          messages: [
            {
              role: 'system',
              content:
                '你是设备借还周报助手。请严格按 JSON 输出，不要包含 markdown 代码块。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new LlmDiagnosticError(
          'response_status',
          `LLM request failed: HTTP ${response.status}`,
          text.slice(0, 400),
        );
      }
      const data: any = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      const outputText = Array.isArray(content)
        ? content
            .map((item: any) =>
              typeof item === 'string'
                ? item
                : String(item?.text ?? item?.content ?? ''),
            )
            .join('')
        : typeof content === 'string'
        ? content
        : typeof content === 'object' && content
        ? String(content?.text ?? content?.content ?? '')
        : '';
      if (!outputText) {
        throw new LlmDiagnosticError(
          'response_parse',
          'LLM response missing message.content',
        );
      }
      console.info('[WeeklyReport][LLM][response] chat_completions raw', {
        model: llm.model,
        contentLength: outputText.length,
        outputPreview: toPreview(outputText),
      });
      return extractJson(outputText);
    }

    const response = await fetch(target.url, {
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
      throw new LlmDiagnosticError(
        'response_status',
        `LLM request failed: HTTP ${response.status}`,
        text.slice(0, 400),
      );
    }
    const data: any = await response.json();
    const outputText =
      data?.output_text ||
      data?.output?.[0]?.content?.find((c: any) => c?.type === 'output_text')
        ?.text;
    if (!outputText || typeof outputText !== 'string') {
      throw new LlmDiagnosticError(
        'response_parse',
        'LLM response missing output_text',
      );
    }
    console.info('[WeeklyReport][LLM][response] openai raw', {
      model: llm.model,
      contentLength: outputText.length,
      outputPreview: toPreview(outputText),
    });
    return extractJson(outputText);
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new LlmDiagnosticError(
        'request',
        'LLM request timeout/aborted',
        `timeoutMs=${llm.timeoutMs}`,
      );
    }
    throw error;
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
    timeoutMs: llm.timeoutMs || 60000,
    endpoint: llm.endpoint,
  };

  if (!normalizedLlm.apiKey || !normalizedLlm.baseUrl || !normalizedLlm.model) {
    console.warn(
      '[WeeklyReport][LLM][config] Missing llm config, using fallback',
      {
        hasApiKey: Boolean(normalizedLlm.apiKey),
        baseUrl: normalizedLlm.baseUrl,
        model: normalizedLlm.model,
      },
    );
    return { status: 'fallback', report: fallback, model };
  }

  try {
    const startedAt = Date.now();
    const requestTarget = resolveWeeklyReportLlmRequestTarget(
      normalizedLlm.baseUrl,
      normalizedLlm.endpoint,
    );
    console.info('[WeeklyReport][LLM][request] start', {
      baseUrl: normalizedLlm.baseUrl,
      requestUrl: requestTarget.url,
      endpoint: requestTarget.endpoint,
      model: normalizedLlm.model,
      timeoutMs: normalizedLlm.timeoutMs,
      sampleSize: snapshot.sampleSize,
    });
    const prompt = buildWeeklyReportPrompt(snapshot);
    const raw = await requestLlmJson(prompt, normalizedLlm);
    console.info('[WeeklyReport][LLM][response] parsed json', {
      model: normalizedLlm.model,
      rawType: Array.isArray(raw) ? 'array' : typeof raw,
      rawPreview: toPreview(raw),
    });
    const normalizedRaw =
      requestTarget.endpoint === 'chat_completions'
        ? normalizeChatCompletionsPayload(raw, snapshot, normalizedLlm.model)
        : raw;
    console.info('[WeeklyReport][LLM][response] normalized json', {
      model: normalizedLlm.model,
      sections: Array.isArray((normalizedRaw as any)?.sections)
        ? (normalizedRaw as any).sections.map((s: any) => ({
            key: s?.key,
            title: s?.title,
            bulletsCount: Array.isArray(s?.bullets) ? s.bullets.length : 0,
          }))
        : [],
      normalizedPreview: toPreview(normalizedRaw),
    });
    const parsed = parseWeeklyReportSchema(normalizedRaw);
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
      const mismatches = collectFactMismatches(report, snapshot);
      console.warn('[WeeklyReport][LLM][fact_check] failed, using fallback', {
        model: normalizedLlm.model,
        sampleSize: snapshot.sampleSize,
        mismatches,
      });
      return {
        status: 'fallback',
        report: fallback,
        model: normalizedLlm.model,
        errorMessage: `[fact_check] FACT_MISMATCH | detail=${toPreview(
          mismatches,
          400,
        )}`,
      };
    }
    console.info('[WeeklyReport][LLM][request] success', {
      model: normalizedLlm.model,
      elapsedMs: Date.now() - startedAt,
    });
    return { status: 'success', report, model: normalizedLlm.model };
  } catch (error: any) {
    const stage: DiagnosticStage =
      error instanceof LlmDiagnosticError
        ? error.stage
        : error?.name === 'ZodError'
        ? 'schema_parse'
        : 'request';
    const baseMessage = error?.message || 'LLM_REQUEST_FAILED';
    const detail =
      error instanceof LlmDiagnosticError
        ? error.detail
        : error?.name === 'ZodError'
        ? JSON.stringify(error?.issues || [], null, 2)
        : undefined;
    const composedError = detail
      ? `[${stage}] ${baseMessage} | detail=${detail}`
      : `[${stage}] ${baseMessage}`;
    console.error('[WeeklyReport][LLM][fallback]', {
      stage,
      model: normalizedLlm.model,
      message: baseMessage,
      detail,
    });
    return {
      status: 'fallback',
      report: fallback,
      model: normalizedLlm.model,
      errorMessage: composedError,
    };
  }
}
