import {
  DashboardOutlined,
  DesktopOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  LegacyBasicLayout,
  LegacyRouterProvider,
  LegacyServicesProvider,
  ThemeProvider,
} from '@equipment/ui/legacy';
import {
  Borrow,
  Dashboard,
  Devices,
  Login,
  Profile,
  Returned,
  WeeklyReport,
} from '@equipment/ui/legacy/pages';
import { useEffect, useMemo, useState } from 'react';
import { authService, dataService } from './services';

type RoutePath =
  | '/login'
  | '/dashboard'
  | '/borrow'
  | '/returned'
  | '/devices'
  | '/profile'
  | '/reports';

function normalizePath(input: string | undefined): RoutePath {
  const raw = (input ?? '').trim();
  const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
  const withLeadingSlash = withoutHash.startsWith('/')
    ? withoutHash
    : `/${withoutHash}`;

  switch (withLeadingSlash) {
    case '/login':
    case '/dashboard':
    case '/borrow':
    case '/returned':
    case '/devices':
    case '/profile':
    case '/reports':
      return withLeadingSlash;
    case '/':
    case '':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/borrow',
    icon: <SwapOutlined />,
    label: '借出管理',
  },
  {
    key: '/returned',
    icon: <HistoryOutlined />,
    label: '归还记录',
  },
  {
    key: '/devices',
    icon: <DesktopOutlined />,
    label: '设备管理',
  },
  {
    key: '/reports',
    icon: <FileTextOutlined />,
    label: '智能周报',
  },
];

export default function App() {
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [path, setPath] = useState<RoutePath>(() =>
    normalizePath(
      typeof window === 'undefined' ? '/dashboard' : window.location.hash,
    ),
  );

  useEffect(() => {
    const onHashChange = () => {
      setPath(normalizePath(window.location.hash));
    };

    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!active) return;
        if (!currentUser) {
          setUserName(undefined);
          setPath('/login');
          window.location.hash = '#/login';
          setReady(true);
          return;
        }
        setUserName(
          currentUser.username || currentUser.displayName || undefined,
        );
        if (path === '/login') {
          setPath('/dashboard');
          window.location.hash = '#/dashboard';
        }
        setReady(true);
      } catch {
        if (!active) return;
        setUserName(undefined);
        setPath('/login');
        window.location.hash = '#/login';
        setReady(true);
      }
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, [path]);

  const navigate = (nextPath: string) => {
    const normalized = normalizePath(nextPath);
    setPath(normalized);
    window.location.hash = `#${normalized}`;
  };

  const selectedKeys = useMemo(() => {
    if (path === '/profile') return [];
    return [path];
  }, [path]);

  const handleLogout = async () => {
    await authService.logout();
    setUserName(undefined);
    navigate('/login');
  };

  if (!ready) return null;

  return (
    <ThemeProvider>
      <LegacyServicesProvider
        dataService={dataService}
        authService={authService}
      >
        <LegacyRouterProvider navigate={navigate}>
          {path === '/login' ? (
            <Login />
          ) : (
            <LegacyBasicLayout
              menuItems={menuItems}
              selectedKeys={selectedKeys}
              onNavigate={navigate}
              title="设备借还管理系统"
              userName={userName}
              siderUserName={userName}
              siderUserEmail={userName}
              onProfileClick={() => navigate('/profile')}
              onLogout={handleLogout}
            >
              {path === '/dashboard' ? (
                <Dashboard />
              ) : path === '/borrow' ? (
                <Borrow />
              ) : path === '/returned' ? (
                <Returned />
              ) : path === '/devices' ? (
                <Devices />
              ) : path === '/reports' ? (
                <WeeklyReport />
              ) : (
                <Profile />
              )}
            </LegacyBasicLayout>
          )}
        </LegacyRouterProvider>
      </LegacyServicesProvider>
    </ThemeProvider>
  );
}
