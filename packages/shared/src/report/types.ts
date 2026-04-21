export type WeeklyReportStatus = 'success' | 'fallback' | 'failed';

export interface WeeklyRange {
  periodStart: Date;
  periodEnd: Date;
}

export interface WeeklyReportDailyCount {
  date: string;
  borrowCount: number;
  returnCount: number;
}

export interface WeeklyReportTypeCount {
  type: string;
  count: number;
}

export interface WeeklyReportKpis {
  borrowTotal: number;
  returnTotal: number;
  overdueTotal: number;
  overdueRate: number;
  avgBorrowDurationHours: number;
  activeBorrowerCount: number;
}

export interface WeeklyReportDataSnapshot {
  range: WeeklyRange;
  generatedAt: Date;
  sampleSize: number;
  kpis: WeeklyReportKpis;
  daily: WeeklyReportDailyCount[];
  topDeviceTypes: WeeklyReportTypeCount[];
}

export interface WeeklyReportSection {
  key: 'overview' | 'trend' | 'byDeviceType' | 'borrowerInsights';
  title: string;
  summary: string;
  bullets: string[];
  chartHint: string;
}

export interface WeeklyReportRisk {
  level: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
}

export interface WeeklyReportAction {
  priority: 'p0' | 'p1' | 'p2';
  owner: string;
  action: string;
}

export interface WeeklyReportJson {
  meta: {
    reportId: string;
    generatedAt: string;
    periodStart: string;
    periodEnd: string;
    sampleSize: number;
    model: string;
    version: 'v1';
  };
  kpis: WeeklyReportKpis;
  sections: WeeklyReportSection[];
  risks: WeeklyReportRisk[];
  actions: WeeklyReportAction[];
}

export interface WeeklyReportGenerationResult {
  status: WeeklyReportStatus;
  report: WeeklyReportJson;
  model: string;
  errorMessage?: string;
}

export interface WeeklyReportSummary {
  id: number;
  reportType: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  model: string;
  status: WeeklyReportStatus;
  errorMessage: string | null;
  kpiSnapshot: WeeklyReportKpis;
}

export interface WeeklyReportRecord extends WeeklyReportSummary {
  reportJson: WeeklyReportJson;
}
