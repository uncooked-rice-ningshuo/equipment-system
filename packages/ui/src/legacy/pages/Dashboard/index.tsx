import {
  CheckCircleOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  LaptopOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Modal, Row, Statistic, Table } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../components';
import { ThemeType } from '../../config/theme';
import { useLegacyServices } from '../../services';
import { eventBus } from '../../utils';
import BorrowTrendsChart from './components/BorrowTrendsChart';
import DeviceTypeChart from './components/DeviceTypeChart';
import DueSoonTimeline from './components/DueSoonTimeline';

const StatCard = styled(Card)<{ $theme: ThemeType }>`
  border: none;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  background: ${(props) => (props.$theme === 'light' ? '#ffffff' : '#1A202C')};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .ant-card-body {
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #ffffff;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .ant-statistic-title {
    font-size: 14px;
    font-weight: 500;
    color: ${(props) => (props.$theme === 'light' ? '#6B7280' : '#A0AEC0')};
    margin-bottom: 8px;
  }

  .ant-statistic-content {
    font-size: 32px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      'Helvetica Neue', Arial, sans-serif;
    color: ${(props) => (props.$theme === 'light' ? '#111827' : '#ffffff')};
  }
`;

export default function Dashboard() {
  const { statsService } = useLegacyServices();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalDevices: 0,
    borrowedDevices: 0,
    availableDevices: 0,
    overdueDevices: 0,
  });
  const [overdue, setOverdue] = useState<any[]>([]);
  const [dueSoon, setDueSoon] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void load();
    void loadReminders();
  }, []);

  const load = async () => {
    try {
      const data = await statsService.getDashboardStats();
      setStats(data);
      eventBus.emit('dashboard:updated', data);
    } catch {}
  };

  const loadReminders = async () => {
    try {
      const data = await statsService.getOverdueRecords();
      setOverdue(data?.overdue || []);
      setDueSoon(data?.dueSoon || []);
      if (data?.overdue?.length > 0 || data?.dueSoon?.length > 0) {
        setVisible(true);
      }
      eventBus.emit('reminders:loaded', data);
    } catch {}
  };

  const columns = [
    { title: '设备编号', dataIndex: 'device_code' },
    { title: '设备名称', dataIndex: 'device_name' },
    { title: '借用人', dataIndex: 'borrower_name' },
    { title: '联系方式', dataIndex: 'borrower_phone' },
    { title: '剩余天数', dataIndex: 'remaining_days' },
    {
      title: '通知状态',
      dataIndex: 'notified',
      render: (_: any, r: any) => (
        <Button
          type={r.notified ? 'default' : 'primary'}
          onClick={async () => {
            if (!r.notified) {
              await statsService.markAsNotified(r.id);
              void loadReminders();
            }
          }}
        >
          {r.notified ? '已通知' : '未通知'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <div style={{ padding: 24 }}>
        <Row gutter={[20, 20]}>
          <Col span={6}>
            <StatCard $theme={theme}>
              <div
                className="icon-wrapper"
                style={{
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <DatabaseOutlined />
              </div>
              <div className="stat-content">
                <Statistic title="设备总数" value={stats.totalDevices} />
              </div>
            </StatCard>
          </Col>
          <Col span={6}>
            <StatCard $theme={theme}>
              <div
                className="icon-wrapper"
                style={{
                  background:
                    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                }}
              >
                <LaptopOutlined />
              </div>
              <div className="stat-content">
                <Statistic title="在借设备" value={stats.borrowedDevices} />
              </div>
            </StatCard>
          </Col>
          <Col span={6}>
            <StatCard $theme={theme}>
              <div
                className="icon-wrapper"
                style={{
                  background:
                    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                }}
              >
                <CheckCircleOutlined />
              </div>
              <div className="stat-content">
                <Statistic title="可借设备" value={stats.availableDevices} />
              </div>
            </StatCard>
          </Col>
          <Col span={6}>
            <StatCard $theme={theme}>
              <div
                className="icon-wrapper"
                style={{
                  background:
                    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                }}
              >
                <ExclamationCircleOutlined />
              </div>
              <div className="stat-content">
                <Statistic
                  title="逾期设备"
                  value={stats.overdueDevices}
                  valueStyle={{ color: '#EF4444', fontWeight: 700 }}
                />
              </div>
            </StatCard>
          </Col>
        </Row>

        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
          <Col span={12}>
            <DeviceTypeChart theme={theme} />
          </Col>
          <Col span={12}>
            <BorrowTrendsChart theme={theme} />
          </Col>
        </Row>

        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
          <Col span={24}>
            <DueSoonTimeline theme={theme} />
          </Col>
        </Row>

        <Modal
          className="themed-modal"
          title="设备归还提醒"
          open={visible}
          onCancel={() => setVisible(false)}
          footer={null}
          width={900}
        >
          <h3>逾期设备</h3>
          <Table
            columns={columns}
            dataSource={overdue}
            rowKey="id"
            pagination={false}
          />
          <h3 style={{ marginTop: 16 }}>临期设备（≤5天）</h3>
          <Table
            columns={columns}
            dataSource={dueSoon}
            rowKey="id"
            pagination={false}
          />
        </Modal>
      </div>
    </>
  );
}
