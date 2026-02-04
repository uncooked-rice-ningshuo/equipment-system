import { eventBus } from '@/utils/eventBus';
import { invoke as webInvoke } from './httpClient';

export async function invoke<T = any>(
  channel: string,
  ...args: any[]
): Promise<T> {
  const token = localStorage.getItem('token');
  const newArgs = [...args];

  if (token && channel !== 'auth:login') {
    newArgs.push(token);
  }

  let result: any;
  if (window.api && typeof window.api.invoke === 'function') {
    result = await window.api.invoke(channel, ...newArgs);
  } else {
    result = await webInvoke(channel, ...newArgs);
  }

  // 处理未授权错误
  if (result && result.success === false) {
    if (
      result.message?.includes('未授权') ||
      result.message?.includes('会话已过期')
    ) {
      console.log('Session expired, clearing token and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('loginUser');
      window.location.href = '/login';
    }
  }

  return result;
}

const EVENT_MAP: Record<string, string> = {
  'borrow:create': 'device:borrowed',
  'borrow:return': 'device:returned',
  'device:create': 'device:added',
  'device:update': 'device:updated',
  'device:delete': 'device:deleted',
};

export const invokeWithEvent = async (channel: string, ...args: any[]) => {
  const result = await invoke(channel, ...args);

  if (EVENT_MAP[channel]) {
    eventBus.emit(EVENT_MAP[channel], result);
  }

  return result;
};
