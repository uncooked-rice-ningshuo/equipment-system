'use client';

import type { DeviceTypeStat, IDataService } from '@equipment/shared';
import { Card, Empty, Spin } from 'antd';
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

export default function DeviceTypeChart({
  dataService,
}: {
  dataService: IDataService;
}) {
  const [data, setData] = useState<DeviceTypeStat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dataService.getDeviceTypeDistribution();
        setData(result);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dataService]);

  if (loading) {
    return (
      <ChartCard title="设备类型分布">
        <div
          style={{
            height: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin />
        </div>
      </ChartCard>
    );
  }

  if (data.length === 0) {
    return (
      <ChartCard title="设备类型分布">
        <div
          style={{
            height: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Empty description="暂无数据" />
        </div>
      </ChartCard>
    );
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}台 ({d}%)',
    },
    legend: {
      top: '5%',
      left: 'center',
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
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
    <ChartCard title="设备类型分布">
      <ReactECharts option={option} style={{ height: 320 }} />
    </ChartCard>
  );
}
