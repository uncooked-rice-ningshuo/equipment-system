'use client';

import { authService, dataService } from '@/services';
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
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/devices',
    icon: <DesktopOutlined />,
    label: '设备管理',
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
    key: '/reports/weekly',
    icon: <FileTextOutlined />,
    label: '智能周报',
  },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        if (!active) return;
        setUserName(
          currentUser.username || currentUser.displayName || undefined,
        );
        setReady(true);
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const selectedKeys = useMemo(() => {
    return [pathname];
  }, [pathname]);

  if (!ready) return null;

  return (
    <ThemeProvider>
      <LegacyServicesProvider
        dataService={dataService}
        authService={authService}
      >
        <LegacyRouterProvider navigate={(path) => router.push(path)}>
          <LegacyBasicLayout
            menuItems={menuItems}
            selectedKeys={selectedKeys}
            onNavigate={(path) => router.push(path)}
            title="设备借还管理系统"
            userName={userName}
            siderUserName={userName}
            siderUserEmail={userName}
            onProfileClick={() => router.push('/profile')}
            onLogout={handleLogout}
          >
            {children}
          </LegacyBasicLayout>
        </LegacyRouterProvider>
      </LegacyServicesProvider>
    </ThemeProvider>
  );
}
