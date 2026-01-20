import ChartError from '@/components/ChartError';
import ChartSkeleton from '@/components/ChartSkeleton';
import { ThemeType } from '@/config/theme';
import { invoke } from '@/services/ipc';
import { eventBus } from '@/utils/eventBus';
import { Card, Empty } from 'antd';
import ReactECharts from 'echarts-for-react';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
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

export default function DeviceTypeChart({ theme }: { theme: ThemeType }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('stats:deviceTypeDistribution');
      setData(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setError(err.message || '加载设备类型分布失败');
    } finally {
      setLoading(false);
    }
  };

  const debouncedLoad = useMemo(() => debounce(load, 300), []);

  useEffect(() => {
    load();

    const unsub1 = eventBus.subscribe('device:added', debouncedLoad);
    const unsub2 = eventBus.subscribe('device:updated', debouncedLoad);
    const unsub3 = eventBus.subscribe('device:deleted', debouncedLoad);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      debouncedLoad.cancel();
    };
  }, []);

  if (loading) {
    return (
      <ChartCard $theme={theme} title="设备类型分布">
        <ChartSkeleton />
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard $theme={theme} title="设备类型分布">
        <ChartError message={error} onRetry={load} />
      </ChartCard>
    );
  }

  if (data.length === 0) {
    return (
      <ChartCard $theme={theme} title="设备类型分布">
        <Empty description="暂无数据" />
      </ChartCard>
    );
  }

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: theme === 'dark' ? '#1A202C' : '#ffffff',
      borderColor: theme === 'dark' ? '#2d3748' : '#e5e7eb',
      textStyle: { color: theme === 'dark' ? '#ffffff' : '#1A202C' },
      formatter: '{b}: {c}台 ({d}%)',
    },
    legend: {
      top: '5%',
      left: 'center',
      textStyle: { color: theme === 'dark' ? '#ffffff' : '#1A202C' },
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: theme === 'dark' ? '#1A202C' : '#ffffff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: theme === 'dark' ? '#ffffff' : '#1A202C',
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
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
    <ChartCard $theme={theme} title="设备类型分布">
      <ReactECharts option={option} style={{ height: 320 }} />
    </ChartCard>
  );
}
