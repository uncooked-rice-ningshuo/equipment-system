import icon from '@/assets/icon/icon.svg';
import { themeConfig, ThemeType } from '@/config/theme';
import {
  CalendarOutlined,
  DashboardOutlined,
  HistoryOutlined,
  LogoutOutlined,
  MoonFilled,
  SunFilled,
  ToolOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Layout, Menu } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import { history, Outlet, useLocation } from 'umi';

const { Header, Sider, Content } = Layout;

const Sidebar = styled(Sider)<{ theme: ThemeType }>`
  .ant-layout-sider-children {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .ant-menu-item {
    color: ${(props) => themeConfig[props.theme].menu.defaultColor};

    &:hover {
      color: #4f54bd;
    }

    .anticon {
      color: ${(props) => themeConfig[props.theme].menu.defaultColor};
    }
  }

  .ant-menu-item-selected {
    color: ${(props) => themeConfig[props.theme].menu.selectedColor};
    background-color: ${(props) => themeConfig[props.theme].menu.selectedBg};

    .anticon {
      color: ${(props) => themeConfig[props.theme].menu.selectedColor};
    }
  }
`;

const items = [
  {
    key: '/dashboard',
    label: '首页看板',
    icon: <DashboardOutlined style={{ fontSize: 18 }} />,
  },
  {
    key: '/borrow',
    label: '借出设备',
    icon: <CalendarOutlined style={{ fontSize: 18 }} />,
  },
  {
    key: '/returned',
    label: '已还设备',
    icon: <HistoryOutlined style={{ fontSize: 18 }} />,
  },
  {
    key: '/devices',
    label: '设备管理',
    icon: <ToolOutlined style={{ fontSize: 18 }} />,
  },
];

export default function BasicLayout() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  );
  const location = useLocation();
  const selectedKeys = [
    location.pathname.startsWith('/dashboard')
      ? '/dashboard'
      : location.pathname,
  ];

  const breadcrumbItems = [
    {
      title: '首页',
      href: '/dashboard',
    },
    items.find((item) => item.key === selectedKeys[0])
      ? {
          title: items.find((item) => item.key === selectedKeys[0])?.label,
        }
      : null,
  ].filter(Boolean);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const currentTheme = themeConfig[theme];

  return (
    <Layout style={{ minHeight: '100vh', height: '100%' }}>
      <Sidebar
        width={240}
        theme={theme}
        style={{
          background: currentTheme.sider.background,
          borderRight: `1px solid ${currentTheme.sider.borderColor}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
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
            color: currentTheme.sider.logoColor,
            background: currentTheme.sider.background,
          }}
        >
          <img
            src={icon}
            alt="icon"
            style={{ width: 40, height: 40, marginRight: 12 }}
          />
          <span>资产管理平台</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={items}
          onClick={(e) => history.push(e.key)}
          className="sidebar-menu"
          style={{
            borderRight: 0,
            fontSize: 14,
            fontWeight: 400,
            flex: 1,
            paddingTop: 16,
            background: currentTheme.sider.background,
          }}
          theme={theme}
          selectable
        />
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${currentTheme.sider.borderColor}`,
            background: currentTheme.sider.background,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
            }}
            onClick={() => history.push('/profile')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                theme === 'light' ? '#f5f7fa' : '#2D3748';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#4f54bd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {localStorage.getItem('loginUser')?.charAt(0).toUpperCase() ||
                'A'}
            </div>
            <div
              style={{
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: currentTheme.text.primary,
                  marginBottom: 2,
                }}
              >
                管理员
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: currentTheme.text.tertiary,
                }}
              >
                admin@system.com
              </div>
            </div>
          </div>
        </div>
      </Sidebar>
      <Layout
        style={{
          background: currentTheme.layout.background,
        }}
      >
        <Header
          style={{
            height: 64,
            background: currentTheme.header.background,
            padding: '0 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${currentTheme.header.borderColor}`,
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flex: 1,
            }}
          >
            <Breadcrumb
              items={breadcrumbItems}
              style={{
                fontSize: 14,
                fontWeight: 500,
              }}
              separator={
                <span style={{ color: currentTheme.header.breadcrumbColor }}>
                  /
                </span>
              }
              itemRender={(route, params, routes) => {
                const isLast = routes.indexOf(route) === routes.length - 1;
                return (
                  <span
                    style={{
                      color: isLast
                        ? currentTheme.header.breadcrumbColor
                        : currentTheme.header.breadcrumbColor,
                      cursor: isLast ? 'default' : 'pointer',
                      transition: 'color 0.3s',
                    }}
                    onClick={(e) => {
                      if (!isLast && route.href) {
                        e.preventDefault();
                        history.push(route.href);
                      }
                    }}
                  >
                    {route.title}
                  </span>
                );
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Button
              type="text"
              icon={theme === 'light' ? <SunFilled /> : <MoonFilled />}
              onClick={toggleTheme}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                color: currentTheme.header.textColor,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  theme === 'light' ? '#f5f7fa' : '#2D3748';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '6px 12px',
                borderRadius: 12,
                border: `1px solid ${currentTheme.header.borderColor}`,
                backgroundColor: currentTheme.header.userCardBg,
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #4f54bd 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 84, 189, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(79, 84, 189, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 2px 8px rgba(79, 84, 189, 0.3)';
                }}
              >
                {localStorage.getItem('loginUser')?.charAt(0).toUpperCase() ||
                  'U'}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: currentTheme.header.textColor,
                    lineHeight: 1.2,
                  }}
                >
                  {localStorage.getItem('loginUser') || '用户'}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: theme === 'light' ? '#A0AEC0' : '#718096',
                    lineHeight: 1.2,
                  }}
                >
                  管理员
                </div>
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
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                height: 36,
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                color: currentTheme.header.textColor,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (theme === 'light') {
                  e.currentTarget.style.background = '#fee2e2';
                  e.currentTarget.style.color = '#dc2626';
                } else {
                  e.currentTarget.style.background = '#7f1d1d';
                  e.currentTarget.style.color = '#fca5a5';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = currentTheme.header.textColor;
              }}
            >
              退出登录
            </Button>
          </div>
        </Header>
        <Content
          style={{
            backgroundColor: currentTheme.content.background,
            minHeight: 280,
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
