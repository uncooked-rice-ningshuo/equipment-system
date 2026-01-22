import ChartError from '@/components/ChartError';
import ChartSkeleton from '@/components/ChartSkeleton';
import { ThemeType } from '@/config/theme';
import { invoke } from '@/services/ipc';
import { eventBus } from '@/utils/eventBus';
import { ClockCircleOutlined, PhoneOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Row, Space, Tag, Timeline } from 'antd';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

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

const RemainingDaysTag = styled(Tag)<{ $days: number }>`
  font-weight: 600;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid
    ${(props) => {
      if (props.$days <= 2) return '#ef4444';
      if (props.$days <= 5) return '#f59e0b';
      return '#10b981';
    }};
  background-color: ${(props) => {
    if (props.$days <= 2) return 'rgba(239, 68, 68, 0.1)';
    if (props.$days <= 5) return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(16, 185, 129, 0.1)';
  }};
  color: ${(props) => {
    if (props.$days <= 2) return '#ef4444';
    if (props.$days <= 5) return '#f59e0b';
    return '#10b981';
  }};
`;

const getDaysColor = (days: number) => {
  if (days <= 2) return '#ef4444';
  if (days <= 5) return '#f59e0b';
  return '#10b981';
};

export default function DueSoonTimeline({ theme }: { theme: ThemeType }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke('borrow:dueSoon7days');
      setData(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setError(err.message || '加载归还倒计时失败');
    } finally {
      setLoading(false);
    }
  };

  const debouncedLoad = useMemo(() => debounce(load, 300), []);

  useEffect(() => {
    load();

    const unsub1 = eventBus.subscribe('device:borrowed', debouncedLoad);
    const unsub2 = eventBus.subscribe('device:returned', debouncedLoad);

    return () => {
      unsub1();
      unsub2();
      debouncedLoad.cancel();
    };
  }, []);

  if (loading) {
    return (
      <TimelineCard $theme={theme} title="归还倒计时">
        <ChartSkeleton />
      </TimelineCard>
    );
  }

  if (error) {
    return (
      <TimelineCard $theme={theme} title="归还倒计时">
        <ChartError message={error} onRetry={load} />
      </TimelineCard>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <TimelineCard $theme={theme} title="归还倒计时">
        <Empty description="暂无待归还设备" />
      </TimelineCard>
    );
  }

  const timelineItems = data.map((item) => ({
    dot: (
      <ClockCircleOutlined
        style={{ fontSize: 16, color: getDaysColor(item.remaining_days) }}
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
              <RemainingDaysTag $days={item.remaining_days}>
                剩余 {item.remaining_days} 天
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
                预计归还: {item.deadline}
              </span>
            </Col>
          </Row>
        </Space>
      </TimelineItem>
    ),
  }));

  return (
    <TimelineCard $theme={theme} title="归还倒计时">
      <StyledTimeline $theme={theme} items={timelineItems} />
    </TimelineCard>
  );
}
