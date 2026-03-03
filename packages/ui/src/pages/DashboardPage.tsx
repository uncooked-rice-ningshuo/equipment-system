'use client';

import {
  CheckCircleOutlined,
  DesktopOutlined,
  SwapOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { DashboardStats, IDataService } from '@equipment/shared';
import { Card, Col, Row, Statistic, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import {
  BorrowTrendsChart,
  DeviceTypeChart,
  DueSoonTimeline,
} from '../components/charts';

const { Title } = Typography;

export default function DashboardPage({
  dataService,
}: {
  dataService: IDataService;
}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dataService.getDashboardStats();
        setStats(data);
      } catch {
        message.error('加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [dataService]);

  return (
    <div>
      <Title level={3}>仪表盘</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="设备总数"
              value={stats?.totalDevices || 0}
              prefix={<DesktopOutlined />}
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已借出"
              value={stats?.borrowedDevices || 0}
              valueStyle={{ color: '#6366F1' }}
              prefix={<SwapOutlined />}
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="可用设备"
              value={stats?.availableDevices || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="逾期未还"
              value={stats?.overdueDevices || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={8}>
          <DeviceTypeChart dataService={dataService} />
        </Col>
        <Col xs={24} lg={8}>
          <BorrowTrendsChart dataService={dataService} />
        </Col>
        <Col xs={24} lg={8}>
          <DueSoonTimeline dataService={dataService} />
        </Col>
      </Row>
    </div>
  );
}
