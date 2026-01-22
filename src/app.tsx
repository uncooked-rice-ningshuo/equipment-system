import { ThemeProvider } from '@/components/ThemeProvider';
import { history } from 'umi';
import './global.less';

export function onRouteChange({ location }: any) {
  const isLogin = !!localStorage.getItem('loginUser');
  if (!isLogin && location.pathname !== '/login') {
    history.push('/login');
  }
}

export function rootContainer(container: any) {
  return <ThemeProvider>{container}</ThemeProvider>;
}
