import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';

interface ChartErrorProps {
  message: string;
  onRetry: () => void;
}

export default function ChartError({ message, onRetry }: ChartErrorProps) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <ExclamationCircleOutlined
        style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }}
      />
      <Alert
        message="加载失败"
        description={message}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={onRetry}>
            重试
          </Button>
        }
      />
    </div>
  );
}
