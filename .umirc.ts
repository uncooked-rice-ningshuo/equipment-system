import { defineConfig } from 'umi';

export default defineConfig({
  npmClient: 'pnpm',
  plugins: [
    require.resolve('@umijs/plugins/dist/request'),
    require.resolve('@umijs/plugins/dist/model'),
  ],
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
        { path: '/profile', component: '@/pages/Profile' },
      ],
    },
  ],
  theme: {
    token: {
      colorPrimary: '#6366F1',
      colorPrimaryHover: '#818CF8',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
  },
  verifyCommit: {
    scope: [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'build',
      'ci',
      'chore',
      'revert',
    ],
    allowEmoji: true,
  },
  mfsu: {
    strategy: 'normal',
  },
  fastRefresh: true,
});
