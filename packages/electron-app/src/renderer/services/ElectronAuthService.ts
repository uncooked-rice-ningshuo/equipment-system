/**
 * Electron 认证服务实现
 * 通过 IPC 与主进程通信
 */

import {
  AuthResult,
  AuthUser,
  ChangePasswordInput,
  IAuthService,
  LoginCredentials,
} from '@equipment/shared';

export class ElectronAuthService implements IAuthService {
  private token: string | null = null;

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const result = await window.electronAPI.invoke('auth:login', credentials);

    if (result.success && result.token) {
      this.token = result.token;
      localStorage.setItem('auth_token', result.token);
    }

    return result;
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      await window.electronAPI.invoke('auth:logout', token);
    }
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async changePassword(
    input: ChangePasswordInput,
  ): Promise<{ success: boolean; message?: string }> {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: '未登录' };
    }

    return window.electronAPI.invoke('auth:changePassword', {
      ...input,
      token,
    });
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = this.getToken();
    if (!token) return null;

    const result = await window.electronAPI.invoke('auth:verify', token);
    return result.success ? result.user || null : null;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async verifyToken(token: string): Promise<AuthResult> {
    return window.electronAPI.invoke('auth:verify', token);
  }

  private getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }
}
