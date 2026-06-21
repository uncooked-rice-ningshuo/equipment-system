import { Button, Checkbox, Form, Input, message } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLegacyNavigate } from '../../router';
import { useLegacyServices } from '../../services';
import { getUserErrorMessage } from '../../utils';

const Container = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f2f6fc;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    z-index: 0;
  }

  &::before {
    width: 420px;
    height: 420px;
    top: -100px;
    right: -80px;
    background: linear-gradient(135deg, #fff 0%, rgba(79, 84, 189, 0.64) 100%);
  }

  &::after {
    width: 450px;
    height: 450px;
    bottom: -100px;
    left: -100px;
    background: linear-gradient(135deg, rgba(79, 84, 189, 0.5) 0%, #fff 100%);
    opacity: 0.8;
  }
`;

const Card = styled.div`
  position: relative;
  z-index: 1;
  width: 432px;
  height: 479px;
  padding: 0;
  background: #fff;
  border-radius: 62px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.div`
  margin-top: 71px;
  margin-bottom: 41px;
  font-family: 'Noto Sans SC';
  font-size: 21px;
  font-weight: 400;
  color: #000;
  text-align: center;
  width: 100%;
`;

const StyledForm = styled(Form)`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .ant-form-item {
    margin-bottom: 0;
  }

  .ant-form-item:nth-child(1) {
    margin-bottom: 33px;
  }

  .ant-form-item:nth-child(2) {
    margin-bottom: 34px;
  }

  .ant-input,
  .ant-input-password,
  .ant-input-affix-wrapper {
    width: 328px;
    height: 43px;
    background-color: #f9f9fa;
    border: 1px solid transparent;
    border-radius: 18px;
    padding: 3px 11px 3px 25px !important;
    font-size: 16px;
    font-family: 'Noto Sans SC';
    box-shadow: none !important;
  }

  .ant-input-password .ant-input {
    background-color: transparent;
    padding: 0 !important;
    height: 100%;
  }

  .ant-input:hover,
  .ant-input-password:hover,
  .ant-input-affix-wrapper:hover {
    border-color: #7f7f7f;
    background-color: #f9f9fa;
  }

  .ant-input:focus,
  .ant-input-affix-wrapper-focused {
    border-color: #7f7f7f;
    box-shadow: none;
  }

  .ant-checkbox-wrapper {
    width: 328px;
    color: #000;
    font-family: 'Noto Sans SC';
    padding-left: 15px;
  }
`;

const LoginButton = styled(Button)`
  width: 328px;
  height: 41px;
  margin-top: 29px;
  font-size: 21px;
  font-weight: 400;
  font-family: 'Noto Sans SC';
  background-color: #4f54bd;
  border-color: #4f54bd;
  border-radius: 18px;
  box-shadow: none;

  &:hover,
  &:focus {
    background-color: #646af1 !important;
    border-color: #646af1 !important;
  }
`;

export default function Login() {
  const { authService } = useLegacyServices();
  const navigate = useLegacyNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('loginUser');
  }, []);

  const onFinish = async (values: any) => {
    setLoading(true);
    const { username, password } = values;
    try {
      const user = await authService.login({ username, password });
      localStorage.setItem('loginUser', user.username);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (err: any) {
      message.error(getUserErrorMessage(err, '用户名或密码错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>崔力老师，欢迎回来！</Title>
        <StyledForm
          onFinish={onFinish}
          layout="vertical"
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

          <LoginButton type="primary" htmlType="submit" loading={loading}>
            登录
          </LoginButton>
        </StyledForm>
      </Card>
    </Container>
  );
}
