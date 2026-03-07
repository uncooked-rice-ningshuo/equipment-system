'use client';

import { dataService } from '@/services';
import type { DeviceTypeStat } from '@equipment/shared';
import { Card, Empty, Spin, Tabs } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const ChartCard = styled(Card)`
  border: none;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;

    .ant-card-head-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .ant-card-body {
    padding: 24px;
  }
`;

const CHART_COLORS = [
  ['#667eea', '#764ba2'],
  ['#3b82f6', '#2563eb'],
  ['#10b981', '#059669'],
  ['#ef4444', '#dc2626'],
  ['#f59e0b', '#d97706'],
  ['#06b6d4', '#0891b2'],
  ['#ec4899', '#db2777'],
  ['#14b8a6', '#0d9488'],
];

export default function BorrowTrendsChart() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [data, setData] = useState<DeviceTypeStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await dataService.getBorrowTrends(period);
      setData(result);
    } catch (error) {
      console.error('Failed to load borrow trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = data.map((item) => item.name);
  const values = data.map((item) => item.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}: {c}次',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisTick: { alignWithLabel: true },
      axisLabel: {
        interval: 0,
        rotate: categories.length > 6 ? 30 : 0,
      },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '借用次数',
        type: 'bar',
        barWidth: '60%',
        data: values.map((value, index) => ({
          value,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: CHART_COLORS[index % CHART_COLORS.length][0],
                },
                {
                  offset: 1,
                  color: CHART_COLORS[index % CHART_COLORS.length][1],
                },
              ],
            },
          },
        })),
      },
    ],
  };

  return (
    <ChartCard
      title="借用统计"
      extra={
        <Tabs
          activeKey={period}
          onChange={(key) => setPeriod(key as 'week' | 'month' | 'quarter')}
          items={[
            { key: 'week', label: '本周' },
            { key: 'month', label: '本月' },
            { key: 'quarter', label: '近3个月' },
          ]}
          size="small"
        />
      }
    >
      {loading ? (
        <div
          style={{
            height: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin />
        </div>
      ) : data.length === 0 ? (
        <div
          style={{
            height: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Empty description="暂无数据" />
        </div>
      ) : (
        <ReactECharts option={option} style={{ height: 280 }} />
      )}
    </ChartCard>
  );
}
