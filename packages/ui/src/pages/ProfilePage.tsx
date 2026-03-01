'use client';

import type { IAuthService } from '@equipment/shared';
import { Button, Card, Form, Input, message } from 'antd';
import { useState } from 'react';

export interface ProfilePageProps {
  authService: IAuthService;
  onLoggedOut?: () => void;
}

export default function ProfilePage({
  authService,
  onLoggedOut,
}: ProfilePageProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      if (result.success) {
        message.success('密码修改成功，请重新登录');
        form.resetFields();
        await authService.logout();
        onLoggedOut?.();
      } else {
        message.error(result.message || '修改失败');
      }
    } catch {
      message.error('修改失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="修改密码" style={{ maxWidth: 500 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="原密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
