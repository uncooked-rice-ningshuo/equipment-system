/**
 * Better Auth 配置
 * Web 版使用 better-auth 进行认证
 */

import { getDb } from '@/lib/db';
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from '@equipment/shared/db/auth-schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';

let auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth(): ReturnType<typeof betterAuth> {
  if (auth) return auth;
  const db = getDb();
  auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
    plugins: [username()],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 6,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    socialProviders: {},
  });
  return auth;
}

// 导出类型
export type AuthSession = ReturnType<typeof getAuth>['$Infer']['Session'];
export type AuthUser = ReturnType<typeof getAuth>['$Infer']['Session']['user'];
