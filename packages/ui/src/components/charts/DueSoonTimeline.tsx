'use client';

import { ClockCircleOutlined } from '@ant-design/icons';
import type { BorrowRecord, IDataService } from '@equipment/shared';
import { Card, Empty, Spin, Tag, Timeline } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const TimelineCard = styled(Card)`
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
    max-height: 400px;
    overflow-y: auto;
  }
`;

const TimelineItemContent = styled.div`
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;

  &:hover {
    background-color: #f3f4f6;
  }
`;

const getRemainingDays = (deadline: Date | string) =>
  dayjs(deadline).diff(dayjs(), 'day');

export default function DueSoonTimeline({
  dataService,
  days = 7,
}: {
  dataService: IDataService;
  days?: number;
}) {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dataService.getDueSoonRecords(days);
        setRecords(result);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dataService, days]);

  if (loading) {
    return (
      <TimelineCard title="归还倒计时">
        <div
          style={{
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin />
        </div>
      </TimelineCard>
    );
  }

  if (records.length === 0) {
    return (
      <TimelineCard title="归还倒计时">
        <div
          style={{
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Empty description="暂无待归还设备" />
        </div>
      </TimelineCard>
    );
  }

  return (
    <TimelineCard title="归还倒计时">
      <Timeline mode="left">
        {records.map((record) => {
          const remainingDays = getRemainingDays(record.returnDeadline);
          const color =
            remainingDays <= 2
              ? '#ef4444'
              : remainingDays <= 5
              ? '#f59e0b'
              : '#10b981';

          return (
            <Timeline.Item
              key={record.id}
              dot={<ClockCircleOutlined style={{ fontSize: 16, color }} />}
            >
              <TimelineItemContent>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{record.deviceName}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {record.deviceCode}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      借用人: {record.borrowerName} | 电话:{' '}
                      {record.borrowerPhone || 'N/A'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      应还时间:{' '}
                      {dayjs(record.returnDeadline).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                  <Tag
                    color={
                      remainingDays <= 0
                        ? 'error'
                        : remainingDays <= 2
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {remainingDays <= 0 ? '已逾期' : `剩余 ${remainingDays} 天`}
                  </Tag>
                </div>
              </TimelineItemContent>
            </Timeline.Item>
          );
        })}
      </Timeline>
    </TimelineCard>
  );
}
