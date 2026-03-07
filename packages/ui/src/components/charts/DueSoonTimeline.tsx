'use client';

import { ClockCircleOutlined } from '@ant-design/icons';
import type { BorrowRecord, IDataService } from '@equipment/shared';
import { Card, Empty, Select, Spin, Tag, Timeline } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
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

type FilterType = 'all' | 'overdue' | 'upcoming';

const selectOptions = [
  { value: 'all', label: '全部记录' },
  { value: 'overdue', label: '仅逾期' },
  { value: 'upcoming', label: '未逾期' },
];

export default function DueSoonTimeline({
  dataService,
  days = 7,
}: {
  dataService: IDataService;
  days?: number;
}) {
  const [overdueRecords, setOverdueRecords] = useState<BorrowRecord[]>([]);
  const [upcomingRecords, setUpcomingRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [overdue, upcoming] = await Promise.all([
          dataService.getOverdueRecords(),
          dataService.getDueSoonRecords(days),
        ]);
        setOverdueRecords(overdue);
        setUpcomingRecords(upcoming);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dataService, days]);

  const filteredRecords = useMemo(() => {
    let records: BorrowRecord[] = [];

    if (filter === 'all') {
      records = [...overdueRecords, ...upcomingRecords];
    } else if (filter === 'overdue') {
      records = overdueRecords;
    } else if (filter === 'upcoming') {
      records = upcomingRecords;
    }

    // 按归还截止日期排序（逾期在前，然后按日期从早到晚）
    return records.sort((a, b) => {
      const aOverdue = dayjs(a.returnDeadline).isBefore(dayjs());
      const bOverdue = dayjs(b.returnDeadline).isBefore(dayjs());

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      return dayjs(a.returnDeadline).diff(dayjs(b.returnDeadline));
    });
  }, [overdueRecords, upcomingRecords, filter]);

  const getEmptyText = () => {
    if (filter === 'overdue') return '暂无逾期记录';
    if (filter === 'upcoming') return '暂无即将到期记录';
    return '暂无待归还设备';
  };

  const filterSelect = (
    <Select
      value={filter}
      onChange={setFilter}
      style={{ width: 100 }}
      size="small"
      variant="borderless"
      options={selectOptions}
    />
  );

  if (loading) {
    return (
      <TimelineCard title="待归还记录" extra={filterSelect}>
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

  if (filteredRecords.length === 0) {
    return (
      <TimelineCard title="归还倒计时" extra={filterSelect}>
        <div
          style={{
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Empty description={getEmptyText()} />
        </div>
      </TimelineCard>
    );
  }

  return (
    <TimelineCard title="归还倒计时" extra={filterSelect}>
      <Timeline mode="left">
        {filteredRecords.map((record) => {
          const remainingDays = getRemainingDays(record.returnDeadline);
          const isOverdue = remainingDays < 0;
          const overdueDays = Math.abs(remainingDays);
          const color = isOverdue
            ? '#dc2626'
            : remainingDays <= 2
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
                      isOverdue
                        ? 'error'
                        : remainingDays <= 2
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {isOverdue
                      ? `逾期 ${overdueDays} 天`
                      : `剩余 ${remainingDays} 天`}
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
