/**
 * Better Auth 客户端
 * 用于前端调用认证 API
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

// 导出便捷方法
export const { signIn, signOut, signUp, useSession } = authClient;
