import { Spin } from 'antd';

interface ChartSkeletonProps {
  height?: number;
}

export default function ChartSkeleton({ height = 320 }: ChartSkeletonProps) {
  return (
    <div
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spin size="large" tip="加载中..." />
    </div>
  );
}
