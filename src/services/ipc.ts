// Legacy IPC bridge - TO BE REMOVED
// Currently only used by ElectronDataService to bridge to main process
// WebDataService uses sql.js directly and does not need this.

// Channels that don't require authentication
type Channel = `${string}:${string}`;
const NO_AUTH_CHANNELS: Channel[] = ['auth:login'];

export async function invoke<T = any>(
  channel: Channel,
  ...args: any[]
): Promise<T> {
  if (window.api && typeof window.api.invoke === 'function') {
    // Append token for authenticated channels
    if (!NO_AUTH_CHANNELS.includes(channel)) {
      const token = localStorage.getItem('token');
      return window.api.invoke(channel, ...args, token);
    }
    return window.api.invoke(channel, ...args);
  }

  console.warn(
    `[Legacy IPC] Call to ${channel} failed: Not in Electron environment`,
  );
  throw new Error('IPC not available in Web environment');
}
