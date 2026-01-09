/**
 * User Entity
 * Single Responsibility: Defines the user data structure
 */

export type UserRole = 'owner';
export type Locale = 'en' | 'fr' | 'ar' | 'dz';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLocale: Locale;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
