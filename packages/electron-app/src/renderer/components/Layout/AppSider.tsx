import {
  DashboardOutlined,
  DesktopOutlined,
  ExportOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import React from 'react';

const { Sider } = Layout;

type Page = 'dashboard' | 'devices' | 'borrow' | 'returned' | 'profile';

interface AppSiderProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const AppSider: React.FC<AppSiderProps> = ({
  currentPage,
  onPageChange,
}) => {
  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: 'devices',
      icon: <DesktopOutlined />,
      label: '设备管理',
    },
    {
      key: 'borrow',
      icon: <ExportOutlined />,
      label: '借出设备',
    },
    {
      key: 'returned',
      icon: <HistoryOutlined />,
      label: '归还记录',
    },
  ];

  return (
    <Sider
      width={200}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <h3 style={{ margin: 0, color: '#1890ff' }}>Equipment System</h3>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[currentPage]}
        items={menuItems}
        onClick={({ key }) => onPageChange(key as Page)}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};
