import { Form, Input, Button, message, Card } from 'antd';
import { invoke } from '@/services/ipc';
import React from 'react';

export default function Profile() {
  const [form] = Form.useForm();
  const username = localStorage.getItem('loginUser') || 'admin';

  const onFinish = async (v: any) => {
    if (v.newPwd !== v.confirmPwd) {
      message.error('两次输入的新密码不一致');
      return;
    }
    const res = await invoke('auth:changePassword', username, v.oldPwd, v.newPwd);
    if (res?.success) {
      message.success('密码修改成功，请重新登录');
      localStorage.removeItem('loginUser');
    } else {
      message.error(res?.message || '修改失败');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Card title="修改密码" style={{ width: 480 }}>
          <Form
            form={form}
            onFinish={onFinish}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
            validateTrigger={['onSubmit']}
          >
            <Form.Item name="oldPwd" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}> 
              <Input.Password autoComplete="off" /> 
            </Form.Item>
            <Form.Item 
              name="newPwd" 
              label="新密码" 
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '新密码至少6位' },
                { max: 20, message: '新密码最多20位' },
              ]}
            > 
              <Input.Password autoComplete="off" /> 
            </Form.Item>
            <Form.Item name="confirmPwd" label="确认新密码" rules={[{ required: true, message: '请确认新密码' }]}> 
              <Input.Password autoComplete="off" /> 
            </Form.Item>
            <Form.Item wrapperCol={{ span: 16, offset: 6 }}>
              <Button type="primary" onClick={() => form.submit()}>确认修改</Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </>
  );
}
