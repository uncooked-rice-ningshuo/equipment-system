import { LockOutlined, UserOutlined } from '@ant-design/icons';
import type { User } from '@equipment/shared';
import { Button, Card, Form, Input, message, Tabs } from 'antd';
import React, { useState } from 'react';
import { ipc } from '../utils/ipc';

const { TabPane } = Tabs;

interface ProfileProps {
  user: User;
}

export const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleChangePassword = async (values: any) => {
    setPasswordLoading(true);
    try {
      await ipc.auth.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.message || '密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <h2>个人设置</h2>
      <Tabs defaultActiveKey="profile">
        <TabPane tab="基本信息" key="profile">
          <Card style={{ maxWidth: 600 }}>
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{
                username: user.username,
                email: user.email,
              }}
            >
              <Form.Item name="username" label="用户名">
                <Input prefix={<UserOutlined />} disabled />
              </Form.Item>
              <Form.Item name="email" label="邮箱">
                <Input />
              </Form.Item>
              <Form.Item>
                <Button type="primary">保存修改</Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="修改密码" key="password">
          <Card style={{ maxWidth: 600 }}>
            <Form
              form={passwordForm}
              onFinish={handleChangePassword}
              layout="vertical"
            >
              <Form.Item
                name="currentPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};
