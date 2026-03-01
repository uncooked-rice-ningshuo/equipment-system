'use client';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import type { IAuthService } from '@equipment/shared';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

const { Title } = Typography;

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const StyledCard = styled(Card)`
  width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
`;

export interface LoginPageProps {
  authService: IAuthService;
  subtitle?: string;
  onLoggedIn?: () => void;
}

export default function LoginPage({
  authService,
  subtitle,
  onLoggedIn,
}: LoginPageProps) {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await authService.login({
        username: values.username,
        password: values.password,
      });

      if (result.success) {
        message.success('登录成功');
        onLoggedIn?.();
      } else {
        message.error(result.message || '登录失败');
      }
    } catch {
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <StyledCard>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3}>设备借还管理系统</Title>
          {subtitle ? (
            <Typography.Text type="secondary">{subtitle}</Typography.Text>
          ) : null}
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </StyledCard>
    </LoginContainer>
  );
}
