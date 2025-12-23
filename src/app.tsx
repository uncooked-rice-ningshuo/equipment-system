import { history } from 'umi';

export function onRouteChange({ location }: any) {
  const isLogin = !!localStorage.getItem('loginUser');
  if (!isLogin && location.pathname !== '/login') {
    history.push('/login');
  }
}
