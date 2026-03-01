import { createAuthClient } from 'better-auth/react';
import { AuthUser, IAuthService } from '../core/IAuthService';

// Assuming Umi sets process.env
const baseURL = process.env.API_BASE_URL || 'http://localhost:3001';

const authClient = createAuthClient({
  baseURL,
});

export class WebAuthService implements IAuthService {
  async login(credentials: any): Promise<AuthUser> {
    const { email, password, username } = credentials;
    // Adapt to interface which might pass username instead of email
    const loginEmail = email || username;

    const { data, error } = await authClient.signIn.email({
      email: loginEmail,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Login failed');

    return {
      id: data.user.id,
      username: data.user.email || data.user.name,
      role: (data.user as any).role || 'user',
    } as unknown as AuthUser;
  }

  async logout(): Promise<void> {
    await authClient.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await authClient.getSession();
    if (!data) return null;
    return {
      id: data.user.id,
      username: data.user.email || data.user.name,
      role: (data.user as any).role || 'user',
    } as unknown as AuthUser;
  }

  async isAuthenticated(): Promise<boolean> {
    const { data } = await authClient.getSession();
    return !!data;
  }

  async getAuthHeader(): Promise<Record<string, string>> {
    // Better-auth uses cookies by default for web
    return {};
  }
}
