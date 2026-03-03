import {
  DesktopOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { DashboardStats } from '@equipment/shared';
import { Card, Col, Row, Statistic, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { ipc } from '../utils/ipc';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await ipc.dashboard.getStats();
      setStats(data);
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>仪表板</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总设备数"
              value={stats?.totalDevices || 0}
              prefix={<DesktopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="可借设备"
              value={stats?.availableDevices || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="借出中"
              value={stats?.borrowedDevices || 0}
              valueStyle={{ color: '#6366F1' }}
              prefix={<ExportOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="逾期设备"
              value={stats?.overdueDevices || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="即将到期" loading={loading}>
            {stats?.dueSoonCount ? (
              <p>有 {stats.dueSoonCount} 个设备即将到期</p>
            ) : (
              <p>暂无即将到期的设备</p>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="今日借还统计" loading={loading}>
            <p>今日借出: {stats?.todayBorrowed || 0}</p>
            <p>今日归还: {stats?.todayReturned || 0}</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
