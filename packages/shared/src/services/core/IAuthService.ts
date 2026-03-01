/**
 * 认证服务接口定义
 * Electron 使用本地 bcrypt + Token
 * Web 使用 better-auth
 */

import {
  AuthResult,
  AuthUser,
  ChangePasswordInput,
  LoginCredentials,
} from '../../db/types';

export interface IAuthService {
  /**
   * 用户登录
   */
  login(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * 用户登出
   */
  logout(): Promise<void>;

  /**
   * 修改密码
   */
  changePassword(
    input: ChangePasswordInput,
  ): Promise<{ success: boolean; message?: string }>;

  /**
   * 获取当前登录用户
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * 检查是否已登录
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * 验证 Token（主要用于 Electron）
   */
  verifyToken?(token: string): Promise<AuthResult>;
}
