import { LogoutOutlined, MoonFilled, SunFilled } from '@ant-design/icons';
import { Breadcrumb, Button, Layout, Menu } from 'antd';
import { ComponentProps, ReactNode, useMemo } from 'react';
import styled from 'styled-components';
import { useTheme } from '../components/ThemeProvider';
import { themeConfig, ThemeType } from '../config/theme';

const { Header, Sider, Content } = Layout;

const Sidebar = styled(Sider)<{ $theme: ThemeType }>`
  .ant-layout-sider-children {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .ant-menu-item {
    color: ${(props) => themeConfig[props.$theme].menu.defaultColor};

    &:hover {
      color: #4f54bd;
    }

    .anticon {
      color: ${(props) => themeConfig[props.$theme].menu.defaultColor};
    }
  }

  .ant-menu-item-selected {
    color: ${(props) => themeConfig[props.$theme].menu.selectedColor};
    background-color: ${(props) => themeConfig[props.$theme].menu.selectedBg};

    .anticon {
      color: ${(props) => themeConfig[props.$theme].menu.selectedColor};
    }
  }
`;

type BreadcrumbItem = {
  title: ReactNode;
  href?: string;
};

export type LegacyBasicLayoutProps = {
  menuItems: NonNullable<ComponentProps<typeof Menu>['items']>;
  selectedKeys: string[];
  onNavigate?: (path: string) => void;
  breadcrumbItems?: BreadcrumbItem[];
  title?: ReactNode;
  logo?: ReactNode;
  userName?: string;
  userRole?: string;
  siderUserName?: string;
  siderUserEmail?: string;
  onProfileClick?: () => void;
  onLogout?: () => void;
  headerExtra?: ReactNode;
  children: ReactNode;
};

export function LegacyBasicLayout({
  menuItems,
  selectedKeys,
  onNavigate,
  breadcrumbItems,
  title = '资产管理平台',
  logo,
  userName,
  userRole = '管理员',
  siderUserName = '管理员',
  siderUserEmail = 'admin@system.com',
  onProfileClick,
  onLogout,
  headerExtra,
  children,
}: LegacyBasicLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const currentTheme = themeConfig[theme];

  const resolvedUserName = useMemo(() => {
    return userName ?? localStorage.getItem('loginUser') ?? '用户';
  }, [userName]);

  const resolvedBreadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    if (breadcrumbItems && breadcrumbItems.length > 0) return breadcrumbItems;
    return [
      {
        title: '首页',
        href: selectedKeys[0] || '/',
      },
    ];
  }, [breadcrumbItems, selectedKeys]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    localStorage.removeItem('loginUser');
    onNavigate?.('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh', height: '100%' }}>
      <Sidebar
        width={240}
        $theme={theme}
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
          {logo ? (
            logo
          ) : (
            <>
              <span style={{ marginRight: 12 }}>{title}</span>
            </>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={(e) => onNavigate?.(String(e.key))}
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
            onClick={onProfileClick}
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
              {(resolvedUserName || 'A').charAt(0).toUpperCase()}
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
                {siderUserName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: currentTheme.text.tertiary,
                }}
              >
                {siderUserEmail}
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
              items={resolvedBreadcrumbItems}
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
                      color: currentTheme.header.breadcrumbColor,
                      cursor: isLast ? 'default' : 'pointer',
                      transition: 'color 0.3s',
                    }}
                    onClick={(e) => {
                      const href = (route as BreadcrumbItem).href;
                      if (!isLast && href && onNavigate) {
                        e.preventDefault();
                        onNavigate(href);
                      }
                    }}
                  >
                    {(route as BreadcrumbItem).title}
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
            {headerExtra}
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
                {(resolvedUserName || 'U').charAt(0).toUpperCase()}
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
                  {resolvedUserName}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: theme === 'light' ? '#A0AEC0' : '#718096',
                    lineHeight: 1.2,
                  }}
                >
                  {userRole}
                </div>
              </div>
            </div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
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
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
