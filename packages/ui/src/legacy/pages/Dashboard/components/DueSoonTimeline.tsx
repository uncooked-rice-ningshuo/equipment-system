import { ClockCircleOutlined, PhoneOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Row, Select, Space, Tag, Timeline } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { ChartError, ChartSkeleton } from '../../../components';
import { ThemeType } from '../../../config/theme';
import { useLegacyServices } from '../../../services';
import { debounce, eventBus } from '../../../utils';

const TimelineCard = styled(Card)<{ $theme: ThemeType }>`
  border: none;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: ${(props) => (props.$theme === 'light' ? '#ffffff' : '#1A202C')};

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

const StyledTimeline = styled(Timeline)<{ $theme: ThemeType }>`
  .ant-timeline-item-tail {
    border-left: 2px solid
      ${(props) => (props.$theme === 'light' ? '#e5e7eb' : '#2d3748')};
  }

  .ant-timeline-item-head {
    background-color: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#e5e7eb' : '#2d3748'};
  }
`;

const TimelineItem = styled.div<{ $theme: ThemeType }>`
  background-color: ${(props) =>
    props.$theme === 'light' ? '#f9fafb' : '#2d3748'};
  border: 1px solid
    ${(props) => (props.$theme === 'light' ? '#e5e7eb' : '#2d3748')};
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const RemainingDaysTag = styled(Tag)<{ $days: number; $isOverdue: boolean }>`
  font-weight: 600;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid
    ${(props) => {
      if (props.$isOverdue) return '#dc2626';
      if (props.$days <= 2) return '#ef4444';
      if (props.$days <= 5) return '#f59e0b';
      return '#10b981';
    }};
  background-color: ${(props) => {
    if (props.$isOverdue) return 'rgba(220, 38, 38, 0.1)';
    if (props.$days <= 2) return 'rgba(239, 68, 68, 0.1)';
    if (props.$days <= 5) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(16, 185, 129, 0.1)';
  }};
  color: ${(props) => {
    if (props.$isOverdue) return '#dc2626';
    if (props.$days <= 2) return '#ef4444';
    if (props.$days <= 5) return '#f59e0b';
    return '#10b981';
  }};
`;

const getDaysColor = (days: number, isOverdue: boolean) => {
  if (isOverdue) return '#dc2626';
  if (days <= 2) return '#ef4444';
  if (days <= 5) return '#f59e0b';
  return '#10b981';
};

type FilterType = 'all' | 'overdue' | 'upcoming';

const selectOptions = [
  { value: 'all', label: '全部记录' },
  { value: 'overdue', label: '仅逾期' },
  { value: 'upcoming', label: '未逾期' },
];

export default function DueSoonTimeline({ theme }: { theme: ThemeType }) {
  const { statsService } = useLegacyServices();
  const [overdueData, setOverdueData] = useState<any[]>([]);
  const [upcomingData, setUpcomingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { overdue, dueSoon } = await statsService.getOverdueRecords();
      setOverdueData(Array.isArray(overdue) ? overdue : []);
      setUpcomingData(Array.isArray(dueSoon) ? dueSoon : []);
    } catch (err: any) {
      setError(err.message || '加载归还倒计时失败');
    } finally {
      setLoading(false);
    }
  };

  const debouncedLoad = useMemo(() => debounce(load, 300), []);

  useEffect(() => {
    void load();

    const unsub1 = eventBus.subscribe('device:borrowed', debouncedLoad);
    const unsub2 = eventBus.subscribe('device:returned', debouncedLoad);

    return () => {
      unsub1();
      unsub2();
      debouncedLoad.cancel();
    };
  }, []);

  const filteredData = useMemo(() => {
    let records: any[] = [];

    if (filter === 'all') {
      records = [...overdueData, ...upcomingData];
    } else if (filter === 'overdue') {
      records = overdueData;
    } else if (filter === 'upcoming') {
      records = upcomingData;
    }

    // 按归还截止日期排序（逾期在前，然后按日期从早到晚）
    return records.sort((a, b) => {
      const aOverdue = dayjs(a.return_deadline).isBefore(dayjs());
      const bOverdue = dayjs(b.return_deadline).isBefore(dayjs());

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      return dayjs(a.return_deadline).diff(dayjs(b.return_deadline));
    });
  }, [overdueData, upcomingData, filter]);

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

  if (loading && filteredData.length === 0) {
    return (
      <TimelineCard $theme={theme} title="待归还记录" extra={filterSelect}>
        <ChartSkeleton />
      </TimelineCard>
    );
  }

  if (error) {
    return (
      <TimelineCard $theme={theme} title="待归还记录" extra={filterSelect}>
        <ChartError message={error} onRetry={load} />
      </TimelineCard>
    );
  }

  if (filteredData.length === 0) {
    return (
      <TimelineCard $theme={theme} title="待归还记录" extra={filterSelect}>
        <Empty description={getEmptyText()} />
      </TimelineCard>
    );
  }

  const timelineItems = filteredData.map((item) => {
    const isOverdue = dayjs(item.return_deadline).isBefore(dayjs());
    const overdueDays = isOverdue ? Math.abs(item.remaining_days) : 0;

    return {
      dot: (
        <ClockCircleOutlined
          style={{
            fontSize: 16,
            color: getDaysColor(item.remaining_days, isOverdue),
          }}
        />
      ),
      children: (
        <TimelineItem $theme={theme}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <span
                  style={{
                    fontWeight: 600,
                    color: theme === 'light' ? '#1A202C' : '#ffffff',
                  }}
                >
                  {item.device_name}
                </span>
                <span
                  style={{
                    color: theme === 'light' ? '#6B7280' : '#A0AEC0',
                    marginLeft: 8,
                  }}
                >
                  ({item.device_code})
                </span>
              </Col>
              <Col>
                <RemainingDaysTag
                  $days={item.remaining_days}
                  $isOverdue={isOverdue}
                >
                  {isOverdue
                    ? `逾期 ${overdueDays} 天`
                    : `剩余 ${item.remaining_days} 天`}
                </RemainingDaysTag>
              </Col>
            </Row>

            <Row>
              <Col>
                <span
                  style={{
                    color: theme === 'light' ? '#4A5568' : '#CBD5E0',
                  }}
                >
                  借用人: {item.borrower_name}
                </span>
              </Col>
              <Col style={{ marginLeft: 16 }}>
                <PhoneOutlined
                  style={{
                    marginRight: 4,
                    color: theme === 'light' ? '#4A5568' : '#CBD5E0',
                  }}
                />
                <span
                  style={{
                    color: theme === 'light' ? '#4A5568' : '#CBD5E0',
                  }}
                >
                  {item.borrower_phone}
                </span>
              </Col>
            </Row>

            <Row>
              <Col>
                <span
                  style={{
                    color: theme === 'light' ? '#6B7280' : '#A0AEC0',
                  }}
                >
                  预计归还:{' '}
                  {dayjs(item.return_deadline).format('YYYY-MM-DD HH:mm')}
                </span>
              </Col>
            </Row>
          </Space>
        </TimelineItem>
      ),
    };
  });

  return (
    <TimelineCard $theme={theme} title="待归还记录" extra={filterSelect}>
      <StyledTimeline $theme={theme} items={timelineItems} />
    </TimelineCard>
  );
}
