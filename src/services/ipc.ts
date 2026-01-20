import { eventBus } from '@/utils/eventBus';
import { invoke as webInvoke } from './webAdapter';

export async function invoke<T = any>(
  channel: string,
  ...args: any[]
): Promise<T> {
  const token = localStorage.getItem('token');
  const newArgs = [...args];

  // Append token if it exists and not logging in
  if (token && channel !== 'auth:login') {
    newArgs.push(token);
  }

  if (window.api && typeof window.api.invoke === 'function') {
    return await window.api.invoke(channel, ...newArgs);
  }
  return await webInvoke(channel, ...newArgs);
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
