/**
 * Settings Entity
 * Single Responsibility: Defines the settings data structure
 */

import { Locale } from './User';

export type Currency = 'DZD' | 'EUR' | 'USD';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  locale: Locale;
  currency: Currency;
  notificationsEnabled: boolean;
  lowStockThreshold: number;
}
