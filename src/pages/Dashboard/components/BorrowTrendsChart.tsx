import { ThemeType } from '@/config/theme';
import { invoke } from '@/services/ipc';
import { Card, Empty, Tabs } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const ChartCard = styled(Card)<{ $theme: ThemeType }>`
  border: none;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .ant-card-head {
    border-bottom: 1px solid
      ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};
    padding: 20px 24px;

    .ant-card-head-title {
      font-size: 16px;
      font-weight: 600;
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }

  .ant-card-body {
    padding: 24px;
  }
`;

const StyledTabs = styled(Tabs)<{ $theme: ThemeType }>`
  .ant-tabs-tab {
    color: ${(props) => (props.$theme === 'light' ? '#6B7280' : '#A0AEC0')};

    &.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: ${(props) => (props.$theme === 'light' ? '#4f54bd' : '#667eea')};
    }
  }

  .ant-tabs-ink-bar {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
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

export default function BorrowTrendsChart({ theme }: { theme: ThemeType }) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, [period]);

  const load = async () => {
    const result = await invoke('stats:borrowedByType', period);
    setData(Array.isArray(result) ? result : []);
  };

  if (data.length === 0) {
    return (
      <ChartCard $theme={theme} title="借用统计">
        <StyledTabs
          $theme={theme}
          activeKey={period}
          onChange={(key) => setPeriod(key as 'week' | 'month' | 'year')}
          items={[
            { key: 'week', label: '本周' },
            { key: 'month', label: '本月' },
            { key: 'year', label: '本年' },
          ]}
        />
        <Empty description="暂无数据" />
      </ChartCard>
    );
  }

  const categories = data.map((item) => item.name);
  const values = data.map((item) => item.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: theme === 'dark' ? '#1A202C' : '#ffffff',
      borderColor: theme === 'dark' ? '#2d3748' : '#e5e7eb',
      textStyle: { color: theme === 'dark' ? '#ffffff' : '#1A202C' },
      formatter: '{b}: {c}次',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisTick: { alignWithLabel: true },
      axisLabel: {
        color: theme === 'dark' ? '#A0AEC0' : '#6B7280',
        interval: 0,
        rotate: categories.length > 6 ? 30 : 0,
      },
      axisLine: {
        lineStyle: { color: theme === 'dark' ? '#2d3748' : '#e5e7eb' },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: theme === 'dark' ? '#A0AEC0' : '#6B7280',
      },
      axisLine: {
        lineStyle: { color: theme === 'dark' ? '#2d3748' : '#e5e7eb' },
      },
      splitLine: {
        lineStyle: {
          color: theme === 'dark' ? '#2d3748' : '#f0f0f0',
        },
      },
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
    <ChartCard $theme={theme} title="借用统计">
      <StyledTabs
        $theme={theme}
        activeKey={period}
        onChange={(key) => setPeriod(key as 'week' | 'month' | 'year')}
        items={[
          { key: 'week', label: '本周' },
          { key: 'month', label: '本月' },
          { key: 'year', label: '本年' },
        ]}
      />
      <ReactECharts option={option} style={{ height: 280 }} />
    </ChartCard>
  );
}
