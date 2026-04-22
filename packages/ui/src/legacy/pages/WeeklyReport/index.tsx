import { Button, Card, List, Space, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
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
  return report?.sections?.find((s: any) => s?.key === key);
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

function parseTypeStats(section: any): Array<{ name: string; value: number }> {
  if (!section?.bullets?.length) return [];
  return section.bullets
    .map((item: string) => {
      const m = item.match(/(.+):\s*(\d+)/);
      if (!m) return null;
      return { name: m[1].trim(), value: Number(m[2]) };
    })
    .filter(Boolean) as Array<{ name: string; value: number }>;
}

export default function WeeklyReport() {
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
  const typeStats = parseTypeStats(byDeviceType);
  const typeTotal = typeStats.reduce((sum, item) => sum + item.value, 0) || 1;
  const maxTrend =
    trendData.reduce(
      (max, item) => Math.max(max, item.borrow, item.returned),
      0,
    ) || 1;

  return (
    <div style={{ padding: 24 }}>
      <style>{`
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
        .wr-stage { display: flex; justify-content: center; overflow: auto; padding: 8px; }
        .wr-paper {
          width: 210mm;
          min-height: 297mm;
          background: #ffffff;
          box-shadow: 0 6px 24px rgba(15,23,42,0.08);
          border: 1px solid #d8deeb;
          border-radius: 10px;
          padding: 24px;
          color: #0b1c30;
          font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .wr-header {
          border-bottom: 1px solid #c3c6d7;
          padding-bottom: 14px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }
        .wr-meta-chip {
          background: #dbeafe;
          color: #0b1c30;
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
          border: 1px solid #c3c6d7;
          border-radius: 10px;
          padding: 10px;
          background: #fff;
        }
        .wr-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .wr-block {
          border: 1px solid #c3c6d7;
          border-radius: 10px;
          padding: 12px;
          background: #fff;
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
        .wr-bar-borrow { width: 100%; background: #1752c3; border-radius: 3px 3px 0 0; }
        .wr-bar-return { width: 100%; background: #c8d9f7; border-radius: 3px 3px 0 0; }
        .wr-risk-row,
        .wr-action-row {
          border: 1px solid #c3c6d7;
          border-radius: 10px;
          padding: 8px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        .wr-footer {
          border-top: 1px solid #c3c6d7;
          margin-top: 12px;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #737686;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }
        @media (max-width: 1280px) {
          .wr-layout { grid-template-columns: 1fr; }
          .wr-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: #fff !important; }
          .weekly-report-no-print { display: none !important; }
          .wr-stage { padding: 0 !important; overflow: visible !important; }
          .wr-paper {
            width: auto !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }
          .wr-main-grid,
          .wr-kpi-grid { break-inside: avoid; }
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
                        ? 'rgba(37,99,235,0.06)'
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
                      <Title level={3} style={{ margin: 0, color: '#0b1c30' }}>
                        Data Intelligence
                      </Title>
                      <Title
                        level={2}
                        style={{ margin: '2px 0 8px', fontSize: 30 }}
                      >
                        Weekly Smart Insights
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
                          VERIFIED REPORT
                        </span>
                      </Space>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ color: '#004ac6', fontSize: 16 }}>
                        REPORT #{report.meta.reportId}
                      </Text>
                      <br />
                      <Text
                        type="secondary"
                        style={{ textTransform: 'uppercase' }}
                      >
                        Generated: {formatDateTime(report.meta.generatedAt)}
                      </Text>
                      <br />
                      {statusTag(current.status)}
                    </div>
                  </div>

                  <div className="wr-kpi-grid">
                    <div className="wr-kpi-item">
                      <Text type="secondary">Borrow Total</Text>
                      <Title level={2} style={{ margin: 0, color: '#004ac6' }}>
                        {kpis.borrowTotal}
                      </Title>
                    </div>
                    <div className="wr-kpi-item">
                      <Text type="secondary">Return Total</Text>
                      <Title level={2} style={{ margin: 0 }}>
                        {kpis.returnTotal}
                      </Title>
                    </div>
                    <div className="wr-kpi-item">
                      <Text type="secondary">Overdue Rate</Text>
                      <Title level={2} style={{ margin: 0, color: '#ba1a1a' }}>
                        {toPercent(kpis.overdueRate)}
                      </Title>
                    </div>
                    <div className="wr-kpi-item">
                      <Text type="secondary">Avg Duration</Text>
                      <Title level={2} style={{ margin: 0 }}>
                        {kpis.avgBorrowDurationHours}h
                      </Title>
                    </div>
                  </div>

                  <div className="wr-main-grid">
                    <div className="wr-block">
                      <h3 className="wr-section-title">
                        {overview?.title || 'Executive Overview'}
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
                        {trend?.title || 'Weekly Trend'}
                      </h3>
                      <div className="wr-trend">
                        {(trendData.length > 0
                          ? trendData
                          : [
                              {
                                day: 'N/A',
                                borrow: kpis.borrowTotal,
                                returned: kpis.returnTotal,
                              },
                            ]
                        ).map((item, idx) => (
                          <div className="wr-trend-col" key={`trend-${idx}`}>
                            <div
                              className="wr-bar-return"
                              style={{
                                height: `${Math.max(
                                  6,
                                  (item.returned / maxTrend) * 88,
                                )}px`,
                              }}
                            />
                            <div
                              className="wr-bar-borrow"
                              style={{
                                height: `${Math.max(
                                  8,
                                  (item.borrow / maxTrend) * 96,
                                )}px`,
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
                        {byDeviceType?.title || 'Device Type Analysis'}
                      </h3>
                      {(typeStats.length > 0
                        ? typeStats
                        : [{ name: '未分类', value: kpis.borrowTotal }]
                      ).map((item, idx) => (
                        <div key={`type-${idx}`} style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text>{item.name}</Text>
                            <Text>
                              {Math.round((item.value / typeTotal) * 100)}%
                            </Text>
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
                                  8,
                                  Math.round((item.value / typeTotal) * 100),
                                )}%`,
                                height: 6,
                                borderRadius: 999,
                                background: '#004ac6',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="wr-block wr-blue">
                      <h3
                        className="wr-section-title"
                        style={{ color: '#fff' }}
                      >
                        {borrowerInsights?.title || 'Borrower Insights'}
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
                            ACTIVE BORROWERS
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
                            RETURN RATE
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
                      <h3 className="wr-section-title">Risk Assessment</h3>
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
                      <h3 className="wr-section-title">Action Plan</h3>
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
                    <span>© Data Intelligence System - Confidential</span>
                    <span>Page 01 of 01</span>
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
