import { Button, Card, Form, Input, message } from 'antd';
import styled from 'styled-components';
import { useTheme } from '../../components';
import { useLegacyNavigate } from '../../router';
import { useLegacyServices } from '../../services';

const StyledCard = styled(Card)<{ $theme: 'light' | 'dark' }>`
  background: ${(props) => (props.$theme === 'light' ? '#ffffff' : '#1A202C')};

  .ant-card-head {
    border-bottom: 1px solid
      ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};

    .ant-card-head-title {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }

  .ant-card-body {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }

  .ant-form-item-label > label {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }

  .ant-input,
  .ant-input-password {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

    &::placeholder {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
    }

    &:hover {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }
  }

  .ant-input:focus,
  .ant-input-password:focus {
    border-color: ${(props) =>
      props.$theme === 'light' ? '#6366F1' : '#667eea'};
    box-shadow: ${(props) =>
      props.$theme === 'light'
        ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
        : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
  }

  .ant-select {
    .ant-select-selector {
      background: ${(props) =>
        props.$theme === 'light' ? '#ffffff' : '#2d3748'};
      border-color: ${(props) =>
        props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

      .ant-select-selection-placeholder {
        color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
      }

      .ant-select-selection-item {
        color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
      }
    }

    &:hover .ant-select-selector {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }

    &.ant-select-focused .ant-select-selector {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
      box-shadow: ${(props) =>
        props.$theme === 'light'
          ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
          : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
    }

    .ant-select-arrow {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
    }
  }
`;

export default function Profile() {
  const { authService } = useLegacyServices();
  const { theme } = useTheme();
  const navigate = useLegacyNavigate();
  const [form] = Form.useForm();
  const username = localStorage.getItem('loginUser') || 'admin';

  const onFinish = async (v: any) => {
    if (v.newPwd !== v.confirmPwd) {
      message.error('两次输入的新密码不一致');
      return;
    }

    const res = await authService.changePassword(username, v.oldPwd, v.newPwd);
    if (res?.success) {
      message.success('密码修改成功，请重新登录');
      localStorage.removeItem('loginUser');
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      message.error(res?.message || '修改失败');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <StyledCard $theme={theme} title="修改密码" style={{ width: 480 }}>
          <Form
            form={form}
            onFinish={onFinish}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 16 }}
            validateTrigger={['onSubmit']}
          >
            <Form.Item
              name="oldPwd"
              label="原密码"
              rules={[{ required: true, message: '请输入原密码' }]}
            >
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
            <Form.Item
              name="confirmPwd"
              label="确认新密码"
              rules={[{ required: true, message: '请确认新密码' }]}
            >
              <Input.Password autoComplete="off" />
            </Form.Item>
            <Form.Item wrapperCol={{ span: 16, offset: 6 }}>
              <Button type="primary" onClick={() => form.submit()}>
                确认修改
              </Button>
            </Form.Item>
          </Form>
        </StyledCard>
      </div>
    </>
  );
}
