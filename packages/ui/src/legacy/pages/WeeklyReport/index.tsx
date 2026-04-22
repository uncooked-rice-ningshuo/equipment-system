import { Button, Card, List, Space, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { useTheme } from '../../components';
import { useLegacyServices } from '../../services';
import { formatDateTime } from '../../utils';

const { Title, Text } = Typography;

type HistoryItem = {
  id: number;
  generatedAt: string;
  model: string;
  status: 'success' | 'fallback' | 'failed';
  kpiSnapshot: {
    borrowTotal: number;
    returnTotal: number;
    overdueTotal: number;
    overdueRate: number;
    avgBorrowDurationHours: number;
    activeBorrowerCount: number;
  };
};

function statusTag(status: HistoryItem['status']) {
  if (status === 'success') return <Tag color="success">成功</Tag>;
  if (status === 'fallback') return <Tag color="warning">降级</Tag>;
  return <Tag color="error">失败</Tag>;
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function sectionByKey(report: any, key: string) {
  const sections = Array.isArray(report?.sections) ? report.sections : [];
  const direct = sections.find((s: any) => s?.key === key);
  if (direct) return direct;
  const titleMatcher: Record<string, (title: string) => boolean> = {
    overview: (title) =>
      title.includes('概览') ||
      title.includes('概况') ||
      title.includes('总览'),
    trend: (title) => title.includes('趋势'),
    byDeviceType: (title) =>
      title.includes('设备类型') ||
      title.includes('类型统计') ||
      title.includes('按设备类型'),
    borrowerInsights: (title) =>
      title.includes('借用人洞察') || title.includes('借用洞察'),
  };
  return sections.find((s: any) => {
    const title = String(s?.title || '').trim();
    return titleMatcher[key]?.(title);
  });
}

function localizedSectionTitle(
  key: 'overview' | 'trend' | 'byDeviceType' | 'borrowerInsights',
  rawTitle?: string,
) {
  const titleMap = {
    overview: '管理层概览',
    trend: '每周趋势',
    byDeviceType: '设备类型分析',
    borrowerInsights: '借用人洞察',
  } as const;
  const normalized = String(rawTitle || '')
    .trim()
    .toLowerCase();
  if (!normalized || normalized === key.toLowerCase()) {
    return titleMap[key];
  }
  return rawTitle || titleMap[key];
}

function parseDailyTrend(
  section: any,
): Array<{ day: string; borrow: number; returned: number }> {
  if (!section?.bullets?.length) return [];
  const parsed = section.bullets
    .map((item: string) => {
      const m = item.match(
        /(\d{4}-\d{2}-\d{2}).*?借出\s*(\d+)\s*.*?归还\s*(\d+)/,
      );
      if (!m) return null;
      return {
        day: m[1].slice(5).replace('-', '/'),
        borrow: Number(m[2]),
        returned: Number(m[3]),
      };
    })
    .filter(Boolean) as Array<{
    day: string;
    borrow: number;
    returned: number;
  }>;
  return parsed.slice(-7);
}

function buildEmptyTrend(): Array<{
  day: string;
  borrow: number;
  returned: number;
}> {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return days.map((day) => ({
    day,
    borrow: 0,
    returned: 0,
  }));
}

function parseTypeStats(section: any): Array<{ name: string; value: number }> {
  if (!section?.bullets?.length) return [];
  return section.bullets
    .map((item: string) => {
      const m = item.match(/(.+?)(?:[:：]\s*|\s+)(\d+)(?:\s*次)?(?:\s*%?)$/);
      if (!m) return null;
      return { name: m[1].trim(), value: Number(m[2]) };
    })
    .filter(Boolean) as Array<{ name: string; value: number }>;
}

export default function WeeklyReport() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { dataService } = useLegacyServices();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const list = await dataService.getWeeklyReportHistory();
      setHistory(list as HistoryItem[]);
      if (!current && list.length > 0) {
        const latest = await dataService.getWeeklyReportById(list[0].id);
        setCurrent(latest);
      }
    } catch (error: any) {
      message.error(error?.message || '加载历史记录失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const created = await dataService.generateWeeklyReport();
      setCurrent(created);
      message.success('智能周报已生成并保存');
      await loadHistory();
    } catch (error: any) {
      message.error(error?.message || '生成周报失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (id: number) => {
    try {
      const detail = await dataService.getWeeklyReportById(id);
      if (!detail) {
        message.warning('历史记录不存在');
        return;
      }
      setCurrent(detail);
    } catch (error: any) {
      message.error(error?.message || '打开历史记录失败');
    }
  };

  const report = current?.reportJson;
  const kpis = report?.kpis;
  const overview = sectionByKey(report, 'overview');
  const trend = sectionByKey(report, 'trend');
  const byDeviceType = sectionByKey(report, 'byDeviceType');
  const borrowerInsights = sectionByKey(report, 'borrowerInsights');
  const trendData = parseDailyTrend(trend);
  const displayTrendData = trendData.length > 0 ? trendData : buildEmptyTrend();
  const typeStats = parseTypeStats(byDeviceType);
  const displayTypeStats =
    typeStats.length > 0
      ? typeStats
      : [
          {
            name: '未分类',
            value: Math.max(0, Number(kpis?.borrowTotal || 0)),
          },
        ];
  const typeTotal =
    displayTypeStats.reduce((sum, item) => sum + Math.max(0, item.value), 0) ||
    1;
  const maxTrendTotal =
    displayTrendData.reduce(
      (max, item) => Math.max(max, item.borrow + item.returned),
      0,
    ) || 1;

  return (
    <div
      style={{ padding: 24 }}
      className={isDark ? 'wr-root wr-root-dark' : 'wr-root wr-root-light'}
    >
      <style>{`
        .wr-root-light {
          --wr-stage-bg: transparent;
          --wr-paper-bg: #ffffff;
          --wr-paper-text: #0b1c30;
          --wr-paper-border: #d8deeb;
          --wr-paper-shadow: 0 6px 24px rgba(15,23,42,0.08);
          --wr-divider: #c3c6d7;
          --wr-chip-bg: #dbeafe;
          --wr-chip-text: #0b1c30;
          --wr-block-bg: #ffffff;
          --wr-muted: #737686;
          --wr-row-bg: #ffffff;
          --wr-bar-borrow: #1752c3;
          --wr-bar-borrow-border: #1752c3;
          --wr-bar-return: #c8d9f7;
          --wr-bar-return-border: #9fb8ea;
        }
        .wr-root-dark {
          --wr-stage-bg: #141a24;
          --wr-paper-bg: #0f1726;
          --wr-paper-text: #e6edf8;
          --wr-paper-border: #2a364a;
          --wr-paper-shadow: 0 12px 36px rgba(2,8,23,0.45);
          --wr-divider: #314159;
          --wr-chip-bg: #1f3559;
          --wr-chip-text: #dbeafe;
          --wr-block-bg: #141d2d;
          --wr-muted: #9fb0c8;
          --wr-row-bg: #162236;
          --wr-bar-borrow: #4d86ff;
          --wr-bar-borrow-border: #4d86ff;
          --wr-bar-return: #2f4f8c;
          --wr-bar-return-border: #5579bd;
        }
        .wr-shell { display: flex; flex-direction: column; gap: 16px; }
        .wr-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .wr-layout {
          display: grid;
          grid-template-columns: minmax(250px, 320px) 1fr;
          gap: 16px;
          align-items: start;
        }
        .wr-history-card .ant-card-body { padding: 8px; }
        .wr-stage {
          display: flex;
          justify-content: center;
          overflow: auto;
          padding: 8px;
          background: var(--wr-stage-bg);
          border-radius: 12px;
        }
        .wr-paper {
          width: 210mm;
          min-height: 297mm;
          background: var(--wr-paper-bg);
          box-shadow: var(--wr-paper-shadow);
          border: 1px solid var(--wr-paper-border);
          border-radius: 10px;
          padding: 24px;
          color: var(--wr-paper-text);
          font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .wr-header {
          border-bottom: 1px solid var(--wr-divider);
          padding-bottom: 14px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }
        .wr-meta-chip {
          background: var(--wr-chip-bg);
          color: var(--wr-chip-text);
          border-radius: 999px;
          padding: 2px 10px;
          font-size: 11px;
          font-weight: 600;
        }
        .wr-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }
        .wr-kpi-item {
          border: 1px solid var(--wr-divider);
          border-radius: 10px;
          padding: 10px;
          background: var(--wr-block-bg);
        }
        .wr-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .wr-block {
          border: 1px solid var(--wr-divider);
          border-radius: 10px;
          padding: 12px;
          background: var(--wr-block-bg);
        }
        .wr-blue {
          background: #0f4ccb;
          color: #f8fbff;
          border-color: #0f4ccb;
        }
        .wr-section-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px;
        }
        .wr-list { margin: 8px 0 0; padding-left: 18px; }
        .wr-trend {
          display: flex;
          align-items: end;
          gap: 6px;
          height: 110px;
          margin-top: 10px;
          overflow: hidden;
        }
        .wr-trend-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: end;
          align-items: center;
          gap: 3px;
          min-width: 20px;
        }
        .wr-bar-borrow {
          width: 100%;
          background: var(--wr-bar-borrow);
          border: 1px solid var(--wr-bar-borrow-border);
          border-radius: 3px 3px 0 0;
        }
        .wr-bar-return {
          width: 100%;
          background: var(--wr-bar-return);
          border: 1px solid var(--wr-bar-return-border);
          border-radius: 3px 3px 0 0;
        }
        .wr-risk-row,
        .wr-action-row {
          border: 1px solid var(--wr-divider);
          background: var(--wr-row-bg);
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        .wr-footer {
          border-top: 1px solid var(--wr-divider);
          margin-top: 12px;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--wr-muted);
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }
        @media (max-width: 1280px) {
          .wr-layout { grid-template-columns: 1fr; }
          .wr-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          html, body {
            background: var(--wr-stage-bg) !important;
            margin: 0 !important;
          }
          body * { visibility: hidden !important; }
          .weekly-report-no-print { display: none !important; }
          .wr-paper,
          .wr-paper * { visibility: visible !important; }
          .wr-paper,
          .wr-paper * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .wr-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: calc(210mm - 20mm) !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: var(--wr-paper-bg) !important;
            color: var(--wr-paper-text) !important;
          }
          .wr-main-grid,
          .wr-kpi-grid { break-inside: avoid; }
          .wr-root-dark .wr-paper {
            background: #0b111d !important;
            color: #e6edf8 !important;
          }
          .wr-root-dark .wr-kpi-item,
          .wr-root-dark .wr-block,
          .wr-root-dark .wr-risk-row,
          .wr-root-dark .wr-action-row {
            background: #111a2a !important;
            border-color: #2f405a !important;
          }
          .wr-root-dark .wr-header,
          .wr-root-dark .wr-footer {
            border-color: #2f405a !important;
          }
          .wr-root-dark .wr-paper .ant-typography {
            color: #e6edf8 !important;
          }
          .wr-root-dark .wr-paper .ant-typography-secondary {
            color: #9fb0c8 !important;
          }
          .wr-root-dark .wr-meta-chip {
            background: #1f3559 !important;
            color: #dbeafe !important;
          }
          .wr-root-dark .wr-footer {
            color: #9fb0c8 !important;
          }
        }
      `}</style>

      <div className="wr-shell">
        <div className="wr-toolbar weekly-report-no-print">
          <Space>
            <Button type="primary" loading={loading} onClick={handleGenerate}>
              生成近一周智能周报
            </Button>
            <Button disabled={!report} onClick={() => window.print()}>
              打印当前报告
            </Button>
          </Space>
          <Text type="secondary">
            已保存 {history.length} 条历史记录，支持重复渲染打印
          </Text>
        </div>

        <div className="wr-layout">
          <Card
            className="wr-history-card weekly-report-no-print"
            title="历史记录"
            loading={historyLoading}
          >
            <List
              dataSource={history}
              locale={{ emptyText: '暂无历史记录' }}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background:
                      current?.id === item.id
                        ? isDark
                          ? 'rgba(77,134,255,0.16)'
                          : 'rgba(37,99,235,0.06)'
                        : 'transparent',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 6,
                  }}
                  onClick={() => void handleOpen(item.id)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{formatDateTime(item.generatedAt)}</Text>
                        {statusTag(item.status)}
                      </Space>
                    }
                    description={
                      <Text type="secondary">
                        借出 {item.kpiSnapshot.borrowTotal} / 归还{' '}
                        {item.kpiSnapshot.returnTotal} / 逾期{' '}
                        {item.kpiSnapshot.overdueTotal}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <div className="wr-stage">
            <div className="wr-paper">
              {report ? (
                <>
                  <div className="wr-header">
                    <div>
                      <Title
                        level={3}
                        style={{ margin: 0, color: 'var(--wr-paper-text)' }}
                      >
                        数据智能分析
                      </Title>
                      <Title
                        level={2}
                        style={{ margin: '2px 0 8px', fontSize: 30 }}
                      >
                        每周智能洞察报告
                      </Title>
                      <Space size={8}>
                        <span className="wr-meta-chip">
                          {formatDateTime(report.meta.periodStart)} -{' '}
                          {formatDateTime(report.meta.periodEnd)}
                        </span>
                        <span
                          className="wr-meta-chip"
                          style={{ background: '#2563eb', color: '#fff' }}
                        >
                          已校验报告
                        </span>
                      </Space>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ color: '#004ac6', fontSize: 16 }}>
                        报告编号 #{report.meta.reportId}
                      </Text>
                      <br />
                      <Text
                        type="secondary"
                        style={{ textTransform: 'uppercase' }}
                      >
                        生成时间：{formatDateTime(report.meta.generatedAt)}
                      </Text>
                      <br />
                      {statusTag(current.status)}
                    </div>
                  </div>

                  <div className="wr-kpi-grid">
                    <div className="wr-kpi-item">
                      <Text type="secondary">借出总数</Text>
                      <Title level={2} style={{ margin: 0, color: '#004ac6' }}>
                        {kpis.borrowTotal}
                      </Title>
                    </div>
                    <div className="wr-kpi-item">
                      <Text type="secondary">归还总数</Text>
                      <Title level={2} style={{ margin: 0 }}>
                        {kpis.returnTotal}
                      </Title>
                    </div>
                    <div className="wr-kpi-item">
                      <Text type="secondary">逾期率</Text>
                      <Title level={2} style={{ margin: 0, color: '#ba1a1a' }}>
                        {toPercent(kpis.overdueRate)}
                      </Title>
                    </div>
                    <div className="wr-kpi-item">
                      <Text type="secondary">平均借用时长</Text>
                      <Title level={2} style={{ margin: 0 }}>
                        {kpis.avgBorrowDurationHours}h
                      </Title>
                    </div>
                  </div>

                  <div className="wr-main-grid">
                    <div className="wr-block">
                      <h3 className="wr-section-title">
                        {localizedSectionTitle('overview', overview?.title)}
                      </h3>
                      <Text>{overview?.summary || '-'}</Text>
                      <ul className="wr-list">
                        {(overview?.bullets || []).map(
                          (b: string, idx: number) => (
                            <li key={`ov-${idx}`}>{b}</li>
                          ),
                        )}
                      </ul>
                    </div>
                    <div className="wr-block">
                      <h3 className="wr-section-title">
                        {localizedSectionTitle('trend', trend?.title)}
                      </h3>
                      <div className="wr-trend">
                        {displayTrendData.map((item, idx) => (
                          <div className="wr-trend-col" key={`trend-${idx}`}>
                            <div
                              className="wr-bar-return"
                              style={{
                                height:
                                  item.returned > 0
                                    ? `${Math.max(
                                        4,
                                        (item.returned / maxTrendTotal) * 92,
                                      )}px`
                                    : '0px',
                              }}
                            />
                            <div
                              className="wr-bar-borrow"
                              style={{
                                height:
                                  item.borrow > 0
                                    ? `${Math.max(
                                        5,
                                        (item.borrow / maxTrendTotal) * 92,
                                      )}px`
                                    : '0px',
                              }}
                            />
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {item.day}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="wr-main-grid">
                    <div className="wr-block">
                      <h3 className="wr-section-title">
                        {localizedSectionTitle(
                          'byDeviceType',
                          byDeviceType?.title,
                        )}
                      </h3>
                      {displayTypeStats.map((item, idx) => {
                        const percentage = Math.min(
                          100,
                          Math.max(
                            0,
                            Math.round((item.value / typeTotal) * 100),
                          ),
                        );
                        return (
                          <div key={`type-${idx}`} style={{ marginBottom: 10 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Text>{item.name}</Text>
                              <Text>{percentage}%</Text>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: 6,
                                borderRadius: 999,
                                background: '#e5eeff',
                                marginTop: 4,
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.max(
                                    percentage > 0 ? 8 : 0,
                                    percentage,
                                  )}%`,
                                  height: 6,
                                  borderRadius: 999,
                                  background: '#004ac6',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="wr-block wr-blue">
                      <h3
                        className="wr-section-title"
                        style={{ color: '#fff' }}
                      >
                        {localizedSectionTitle(
                          'borrowerInsights',
                          borrowerInsights?.title,
                        )}
                      </h3>
                      <Text style={{ color: '#dbeafe' }}>
                        {borrowerInsights?.summary ||
                          `本周活跃借用人数 ${kpis.activeBorrowerCount}，整体归还效率稳定。`}
                      </Text>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                          marginTop: 12,
                        }}
                      >
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            borderRadius: 8,
                            padding: 8,
                          }}
                        >
                          <Text style={{ color: '#bfdbfe', fontSize: 11 }}>
                            活跃借用人数
                          </Text>
                          <Title level={4} style={{ color: '#fff', margin: 0 }}>
                            {kpis.activeBorrowerCount}
                          </Title>
                        </div>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.12)',
                            borderRadius: 8,
                            padding: 8,
                          }}
                        >
                          <Text style={{ color: '#bfdbfe', fontSize: 11 }}>
                            归还率
                          </Text>
                          <Title level={4} style={{ color: '#fff', margin: 0 }}>
                            {toPercent(
                              kpis.borrowTotal > 0
                                ? kpis.returnTotal / kpis.borrowTotal
                                : 0,
                            )}
                          </Title>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="wr-main-grid">
                    <div>
                      <h3 className="wr-section-title">风险评估</h3>
                      {(report.risks?.length ? report.risks : []).map(
                        (risk: any, idx: number) => (
                          <div className="wr-risk-row" key={`risk-${idx}`}>
                            <div>
                              <Text strong>{risk.title}</Text>
                              <br />
                              <Text type="secondary">{risk.detail}</Text>
                            </div>
                            <Tag
                              color={
                                risk.level === 'high'
                                  ? 'red'
                                  : risk.level === 'medium'
                                  ? 'orange'
                                  : 'blue'
                              }
                            >
                              {String(risk.level).toUpperCase()}
                            </Tag>
                          </div>
                        ),
                      )}
                    </div>
                    <div>
                      <h3 className="wr-section-title">行动计划</h3>
                      {(report.actions?.length ? report.actions : []).map(
                        (action: any, idx: number) => (
                          <div className="wr-action-row" key={`action-${idx}`}>
                            <Space>
                              <Tag
                                color={
                                  action.priority === 'p0'
                                    ? 'default'
                                    : action.priority === 'p1'
                                    ? 'blue'
                                    : 'purple'
                                }
                              >
                                {String(action.priority).toUpperCase()}
                              </Tag>
                              <Text>{action.action}</Text>
                            </Space>
                            <Text type="secondary">{action.owner}</Text>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="wr-footer">
                    <span>© 设备借还智能分析系统 - 机密</span>
                    <span>第 01 页 / 共 01 页</span>
                  </div>
                </>
              ) : (
                <Card>暂无报告，请先点击“生成近一周智能周报”。</Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
