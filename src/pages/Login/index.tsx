import { authService } from '@/services';
import { Button, Checkbox, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import { history } from 'umi';
import styles from './index.less';

export default function Login() {
  const [loading, setLoading] = useState(false);

  // 在组件加载时检查是否有旧的 token
  useEffect(() => {
    // We should probably rely on authService.logout() but clearing storage is fine for cleanup
    localStorage.removeItem('token');
    localStorage.removeItem('loginUser');
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    const { username, password } = values;
    try {
      // Use authService instead of direct IPC
      const user = await authService.login({ username, password });
      // authService.login throws on error, returns user on success

      localStorage.setItem('loginUser', user.username);
      // Token management is handled inside authService (or cookie for web)

      message.success('登录成功');
      history.push('/dashboard');
    } catch (err: any) {
      message.error(err.message || '用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.title}>崔力老师，欢迎回来！</div>
        <Form
          onFinish={onFinish}
          layout="vertical"
          className={styles.form}
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input placeholder="账号" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我吗</Checkbox>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className={styles.loginBtn}
          >
            登录
          </Button>
        </Form>
      </div>
    </div>
  );
}
