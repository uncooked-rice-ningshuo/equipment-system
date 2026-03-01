import {
  LogoutOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { AuthUser } from '@equipment/shared';
import { Avatar, Dropdown, Layout, Space, Switch, Typography } from 'antd';
import React from 'react';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  user: AuthUser;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  isDarkMode,
  onToggleTheme,
  onLogout,
  onOpenProfile,
}) => {
  const items = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '个人设置',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'profile') {
      onOpenProfile();
    }
    if (key === 'logout') {
      onLogout();
    }
  };

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div>
        <Text strong style={{ fontSize: 18 }}>
          设备借还管理系统
        </Text>
      </div>

      <Space size="large">
        <Space>
          {isDarkMode ? <MoonOutlined /> : <SunOutlined />}
          <Switch checked={isDarkMode} onChange={onToggleTheme} size="small" />
        </Space>

        <Dropdown
          menu={{ items, onClick: handleMenuClick }}
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text>{user.username}</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};
