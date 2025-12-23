import { Layout, Menu, Button } from 'antd';
import { Outlet, history, useLocation } from 'umi';

const { Header, Sider, Content } = Layout;

const items = [
  { key: '/dashboard', label: '首页看板' },
  { key: '/borrow', label: '借出设备记录' },
  { key: '/returned', label: '已还设备记录' },
  { key: '/devices', label: '设备管理' },
  { key: '/profile', label: '个人中心' },
];

export default function BasicLayout() {
  const location = useLocation();
  const selectedKeys = [location.pathname.startsWith('/dashboard') ? '/dashboard' : location.pathname];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="light">
        <div style={{ height: 48, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
          设备借还系统
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={items}
          onClick={(e) => history.push(e.key)}
        />
      </Sider>
      <Layout>
        <Header style={{ height: 48, background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Button onClick={() => { localStorage.removeItem('loginUser'); history.push('/login'); }}>退出登录</Button>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
