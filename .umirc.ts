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
  eslint: {
    ignore: ['electron/**/*'],
  },
});
