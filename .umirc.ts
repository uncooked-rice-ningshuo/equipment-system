import { defineConfig } from 'umi';

export default defineConfig({
  npmClient: 'pnpm',
  routes: [
    { path: '/login', component: '@/pages/Login' },
    {
      path: '/',
      component: '@/layouts/BasicLayout',
      routes: [
        { path: '/', redirect: '/dashboard' },
        { path: '/dashboard', component: '@/pages/Dashboard' },
        { path: '/devices', component: '@/pages/Devices' },
        { path: '/borrow', component: '@/pages/Borrow' },
        { path: '/returned', component: '@/pages/Returned' },
        { path: '/profile', component: '@/pages/Profile' }
      ],
    },
  ],
});
