/**
 * 认证 IPC Handlers
 * 纯离线本地认证
 */

import type {
  AuthResult,
  ChangePasswordInput,
  LoginCredentials,
} from '@equipment/shared';
import bcrypt from 'bcryptjs';
import { ipcMain } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/connection';

const SALT_ROUNDS = 10;
const SESSION_DAYS = 7;

/**
 * 初始化默认用户
 */
export function initDefaultUser(): void {
  const db = getDatabase();

  const admin = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get('admin');

  if (!admin) {
    const hash = bcrypt.hashSync('admin123', SALT_ROUNDS);
    db.prepare(
      `
      INSERT INTO users (username, password_hash, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    ).run('admin', hash, '管理员', Date.now(), Date.now());

    console.log('[Auth] Default user created: admin / admin123');
  }
}

/**
 * 注册认证 IPC handlers
 */
export function registerAuthIpc(): void {
  // 登录
  ipcMain.removeHandler('auth:login');
  ipcMain.handle(
    'auth:login',
    async (_event, credentials: LoginCredentials): Promise<AuthResult> => {
      const db = getDatabase();

      const user = db
        .prepare('SELECT * FROM users WHERE username = ?')
        .get(credentials.username) as any;

      if (
        !user ||
        !bcrypt.compareSync(credentials.password, user.password_hash)
      ) {
        return { success: false, message: '用户名或密码错误' };
      }

      // 创建 session
      const token = uuidv4();
      const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;

      db.prepare(
        `
        INSERT INTO sessions (id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      ).run(uuidv4(), user.id, token, expiresAt, Date.now());

      // 清理过期 session
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name,
        },
      };
    },
  );

  // 验证 Token
  ipcMain.removeHandler('auth:verify');
  ipcMain.handle(
    'auth:verify',
    async (_event, token: string): Promise<AuthResult> => {
      const db = getDatabase();

      const session = db
        .prepare(
          `
        SELECT s.*, u.username, u.display_name
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > ?
      `,
        )
        .get(token, Date.now()) as any;

      if (!session) {
        return { success: false, message: '会话已过期' };
      }

      return {
        success: true,
        user: {
          id: session.user_id,
          username: session.username,
          displayName: session.display_name,
        },
      };
    },
  );

  // 修改密码
  ipcMain.removeHandler('auth:changePassword');
  ipcMain.handle(
    'auth:changePassword',
    async (
      _event,
      {
        token,
        oldPassword,
        newPassword,
      }: ChangePasswordInput & { token: string },
    ): Promise<{ success: boolean; message?: string }> => {
      const db = getDatabase();

      // 验证 token
      const session = db
        .prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?')
        .get(token, Date.now()) as any;

      if (!session) {
        return { success: false, message: '会话已过期，请重新登录' };
      }

      // 验证旧密码
      const user = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(session.user_id) as any;

      if (!bcrypt.compareSync(oldPassword, user.password_hash)) {
        return { success: false, message: '原密码错误' };
      }

      // 更新密码
      const newHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
      db.prepare(
        'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      ).run(newHash, Date.now(), user.id);

      // 使所有 session 失效（强制重新登录）
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

      return { success: true };
    },
  );

  // 登出
  ipcMain.removeHandler('auth:logout');
  ipcMain.handle(
    'auth:logout',
    async (_event, token: string): Promise<void> => {
      const db = getDatabase();
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    },
  );
}
