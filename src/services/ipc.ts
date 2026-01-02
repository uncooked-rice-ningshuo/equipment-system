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
