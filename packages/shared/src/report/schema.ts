import { z } from 'zod';

export const WEEKLY_REPORT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['meta', 'kpis', 'sections', 'risks', 'actions'],
  properties: {
    meta: {
      type: 'object',
      additionalProperties: false,
      required: [
        'reportId',
        'generatedAt',
        'periodStart',
        'periodEnd',
        'sampleSize',
        'model',
        'version',
      ],
      properties: {
        reportId: { type: 'string' },
        generatedAt: { type: 'string' },
        periodStart: { type: 'string' },
        periodEnd: { type: 'string' },
        sampleSize: { type: 'number' },
        model: { type: 'string' },
        version: { type: 'string', enum: ['v1'] },
      },
    },
    kpis: {
      type: 'object',
      additionalProperties: false,
      required: [
        'borrowTotal',
        'returnTotal',
        'overdueTotal',
        'overdueRate',
        'avgBorrowDurationHours',
        'activeBorrowerCount',
      ],
      properties: {
        borrowTotal: { type: 'number' },
        returnTotal: { type: 'number' },
        overdueTotal: { type: 'number' },
        overdueRate: { type: 'number' },
        avgBorrowDurationHours: { type: 'number' },
        activeBorrowerCount: { type: 'number' },
      },
    },
    sections: {
      type: 'array',
      minItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'title', 'summary', 'bullets', 'chartHint'],
        properties: {
          key: {
            type: 'string',
            enum: ['overview', 'trend', 'byDeviceType', 'borrowerInsights'],
          },
          title: { type: 'string' },
          summary: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
          chartHint: { type: 'string' },
        },
      },
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['level', 'title', 'detail'],
        properties: {
          level: { type: 'string', enum: ['high', 'medium', 'low'] },
          title: { type: 'string' },
          detail: { type: 'string' },
        },
      },
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['priority', 'owner', 'action'],
        properties: {
          priority: { type: 'string', enum: ['p0', 'p1', 'p2'] },
          owner: { type: 'string' },
          action: { type: 'string' },
        },
      },
    },
  },
} as const;

const WeeklyReportSchema = z.object({
  meta: z.object({
    reportId: z.string(),
    generatedAt: z.string(),
    periodStart: z.string(),
    periodEnd: z.string(),
    sampleSize: z.number(),
    model: z.string(),
    version: z.literal('v1'),
  }),
  kpis: z.object({
    borrowTotal: z.number(),
    returnTotal: z.number(),
    overdueTotal: z.number(),
    overdueRate: z.number(),
    avgBorrowDurationHours: z.number(),
    activeBorrowerCount: z.number(),
  }),
  sections: z.array(
    z.object({
      key: z.enum(['overview', 'trend', 'byDeviceType', 'borrowerInsights']),
      title: z.string(),
      summary: z.string(),
      bullets: z.array(z.string()),
      chartHint: z.string(),
    }),
  ),
  risks: z.array(
    z.object({
      level: z.enum(['high', 'medium', 'low']),
      title: z.string(),
      detail: z.string(),
    }),
  ),
  actions: z.array(
    z.object({
      priority: z.enum(['p0', 'p1', 'p2']),
      owner: z.string(),
      action: z.string(),
    }),
  ),
});

export type WeeklyReportSchemaType = z.infer<typeof WeeklyReportSchema>;

export function parseWeeklyReportSchema(
  input: unknown,
): WeeklyReportSchemaType {
  return WeeklyReportSchema.parse(input);
}
