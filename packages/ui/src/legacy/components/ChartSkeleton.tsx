import { Spin } from 'antd';

export function ChartSkeleton({ height = 320 }: { height?: number }) {
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
