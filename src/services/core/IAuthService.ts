export interface AuthUser {
  id: number | string;
  username: string;
  role: string;
  // better-auth might have more fields
}

export interface IAuthService {
  login(credentials: any): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  isAuthenticated(): Promise<boolean>;
  getAuthHeader(): Promise<Record<string, string>>; // Bearer token or empty for cookie
}
