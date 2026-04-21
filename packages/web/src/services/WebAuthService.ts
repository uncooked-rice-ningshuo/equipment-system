/**
 * Web 认证服务实现
 * 使用 better-auth 客户端
 */

import { authClient } from '@/lib/auth/client';
import {
  AuthResult,
  AuthUser,
  ChangePasswordInput,
  IAuthService,
  LoginCredentials,
} from '@equipment/shared';

export class WebAuthService implements IAuthService {
  private async loginViaServer(
    identifier: string,
    password: string,
  ): Promise<void> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || payload?.message || '登录失败');
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      await this.loginViaServer(credentials.username, credentials.password);

      // 获取 session 信息
      const session = await authClient.getSession();

      return {
        success: true,
        user: session.data?.user
          ? {
              id: parseInt(session.data.user.id) || 0,
              username: session.data.user.email || '',
              displayName: session.data.user.name || undefined,
            }
          : undefined,
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async logout(): Promise<void> {
    await authClient.signOut();
  }

  async changePassword(
    input: ChangePasswordInput,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await authClient.changePassword({
        currentPassword: input.oldPassword,
        newPassword: input.newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        return { success: false, message: result.error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await authClient.getSession();

    if (!session.data?.user) {
      return null;
    }

    return {
      id: parseInt(session.data.user.id) || 0,
      username: session.data.user.email || '',
      displayName: session.data.user.name || undefined,
    };
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await authClient.getSession();
    return !!session.data;
  }

  async verifyToken(_token: string): Promise<AuthResult> {
    // better-auth 使用 cookie，不需要手动验证 token
    const session = await authClient.getSession();

    if (!session.data) {
      return { success: false, message: 'Session expired' };
    }

    return {
      success: true,
      user: session.data.user
        ? {
            id: parseInt(session.data.user.id) || 0,
            username: session.data.user.email || '',
            displayName: session.data.user.name || undefined,
          }
        : undefined,
    };
  }
}
