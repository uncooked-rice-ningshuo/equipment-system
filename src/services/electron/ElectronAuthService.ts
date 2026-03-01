import { AuthUser, IAuthService } from '../core/IAuthService';
import { invoke } from '../ipc';

export class ElectronAuthService implements IAuthService {
  async login(credentials: any): Promise<AuthUser> {
    const { username, password } = credentials;
    const res = await invoke('auth:login', username, password);
    if (res.success) {
      localStorage.setItem('token', res.token);
      // Fetch user details?
      // For now return mock or minimal user from token if decoded
      return { id: 'local', username, role: 'user' };
    }
    throw new Error(res.message);
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    // Call backend logout if needed
    // await invoke('auth:logout');
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;
    // Verify token with backend
    // const user = await invoke('auth:verify');
    return { id: 'local', username: 'User', role: 'user' }; // Placeholder
  }

  async isAuthenticated(): Promise<boolean> {
    return !!localStorage.getItem('token');
  }

  async getAuthHeader(): Promise<Record<string, string>> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
