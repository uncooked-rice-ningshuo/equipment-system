import { useState } from 'react';
import { Button, Form, Input, message, Card } from 'antd';
import { history } from 'umi';
import { invoke } from '@/services/ipc';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const onFinish = async (values: any) => {
    setLoading(true);
    const { username, password } = values;
    try {
      const res = await invoke('auth:login', username, password);
      if (res?.success) {
        localStorage.setItem('loginUser', username);
        message.success('登录成功');
        history.push('/dashboard');
      } else {
        message.error(res?.message || '用户名或密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 120 }}>
      <Card title="登录" style={{ width: 380 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}> 
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}

