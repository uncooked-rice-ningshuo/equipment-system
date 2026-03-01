'use client';

import { authService, dataService } from '@/services';
import {
  LegacyRouterProvider,
  LegacyServicesProvider,
  ThemeProvider,
} from '@equipment/ui/legacy';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ThemeProvider>
      <LegacyServicesProvider
        dataService={dataService}
        authService={authService}
      >
        <LegacyRouterProvider navigate={(path) => router.push(path)}>
          {children}
        </LegacyRouterProvider>
      </LegacyServicesProvider>
    </ThemeProvider>
  );
}
