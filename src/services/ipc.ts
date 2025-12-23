import { invoke as webInvoke } from './webAdapter';

export async function invoke<T = any>(channel: string, ...args: any[]): Promise<T> {
  if (window.api && typeof window.api.invoke === 'function') {
    return await window.api.invoke(channel, ...args);
  }
  return await webInvoke(channel, ...args);
}
