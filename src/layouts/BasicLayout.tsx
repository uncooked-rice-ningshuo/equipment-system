import {
  CalendarOutlined,
  DashboardOutlined,
  HistoryOutlined,
  LogoutOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu } from 'antd';
import { Outlet, history, useLocation } from 'umi';

const { Header, Sider, Content } = Layout;

const items = [
  {
    key: '/dashboard',
    label: '首页看板',
    icon: <DashboardOutlined />,
  },
  {
    key: '/borrow',
    label: '借出设备记录',
    icon: <CalendarOutlined />,
  },
  {
    key: '/returned',
    label: '已还设备记录',
    icon: <HistoryOutlined />,
  },
  {
    key: '/devices',
    label: '设备管理',
    icon: <ToolOutlined />,
  },
  {
    key: '/profile',
    label: '个人中心',
    icon: <UserOutlined />,
  },
];

export default function BasicLayout() {
  const location = useLocation();
  const selectedKeys = [
    location.pathname.startsWith('/dashboard')
      ? '/dashboard'
      : location.pathname,
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        theme="light"
        style={{
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            height: 64,
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: '#4f54bd',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          资产管理平台
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={items}
          onClick={(e) => history.push(e.key)}
          style={{
            borderRight: 0,
            fontSize: 14,
            fontWeight: 400,
          }}
          theme="light"
          itemStyle={{
            padding: '0 24px',
            height: 48,
            lineHeight: '48px',
          }}
          selectedItemStyle={{
            backgroundColor: '#EEF2FF',
            borderRadius: '8px 0 0 8px',
            marginRight: 8,
          }}
          selectable
        />
      </Sider>
      <Layout>
        <Header
          style={{
            height: 64,
            background: '#ffffff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginRight: '24px',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#4f54bd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 500,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              {localStorage.getItem('loginUser')?.charAt(0).toUpperCase() ||
                'U'}
            </div>
          </div>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => {
              localStorage.removeItem('loginUser');
              history.push('/login');
            }}
            style={{
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            退出登录
          </Button>
        </Header>
        <Content
          style={{
            margin: 24,
            backgroundColor: '#f5f7fa',
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
