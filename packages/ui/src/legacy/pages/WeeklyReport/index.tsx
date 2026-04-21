import {
  Button,
  Card,
  Col,
  message,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
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

  return (
    <div style={{ padding: 24 }}>
      <style>{`
        @media print {
          .weekly-report-no-print { display: none !important; }
          .weekly-report-page { padding: 0 !important; }
        }
      `}</style>
      <Space className="weekly-report-no-print" style={{ marginBottom: 16 }}>
        <Button type="primary" loading={loading} onClick={handleGenerate}>
          生成近一周智能周报
        </Button>
        <Button disabled={!report} onClick={() => window.print()}>
          打印当前报告
        </Button>
      </Space>

      <div className="weekly-report-page">
        {report ? (
          <Card style={{ marginBottom: 16 }}>
            <Title level={4} style={{ marginTop: 0 }}>
              智能周报
            </Title>
            <Text>生成时间：{formatDateTime(report.meta.generatedAt)}</Text>
            <br />
            <Text>
              统计周期：{formatDateTime(report.meta.periodStart)} -{' '}
              {formatDateTime(report.meta.periodEnd)}
            </Text>
            <br />
            <Text>
              模型：{report.meta.model} | 状态：{statusTag(current.status)}
            </Text>
            <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Text>借出总数</Text>
                  <Title level={4}>{kpis.borrowTotal}</Title>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Text>归还总数</Text>
                  <Title level={4}>{kpis.returnTotal}</Title>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Text>逾期率</Text>
                  <Title level={4}>
                    {(kpis.overdueRate * 100).toFixed(2)}%
                  </Title>
                </Card>
              </Col>
            </Row>
            <Card size="small" style={{ marginTop: 12 }}>
              {report.sections.map((section: any) => (
                <div key={section.key} style={{ marginBottom: 12 }}>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    {section.title}
                  </Title>
                  <Text>{section.summary}</Text>
                  <ul>
                    {section.bullets?.map((b: string, idx: number) => (
                      <li key={`${section.key}-${idx}`}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          </Card>
        ) : (
          <Card style={{ marginBottom: 16 }}>暂无报告，请先生成。</Card>
        )}

        <Card className="weekly-report-no-print" title="历史查询记录">
          <Table<HistoryItem>
            rowKey="id"
            loading={historyLoading}
            dataSource={history}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: '生成时间',
                dataIndex: 'generatedAt',
                render: (v) => formatDateTime(v),
              },
              {
                title: '状态',
                dataIndex: 'status',
                render: (v) => statusTag(v),
              },
              {
                title: '借出',
                render: (_, r) => r.kpiSnapshot.borrowTotal,
              },
              {
                title: '归还',
                render: (_, r) => r.kpiSnapshot.returnTotal,
              },
              {
                title: '逾期',
                render: (_, r) => r.kpiSnapshot.overdueTotal,
              },
              {
                title: '操作',
                render: (_, r) => (
                  <Button type="link" onClick={() => void handleOpen(r.id)}>
                    打开并渲染
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
