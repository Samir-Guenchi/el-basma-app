// Simplified Product Model for Djellaba El Basma
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  priceWholesale?: number;      // Wholesale price (gros) - for 3+ pieces
  minWholesaleQty?: number;     // Minimum quantity for wholesale price (default: 3)
  category: ProductCategory;
  images: string[];
  inStock: boolean;
  quantity: number;
  colors: string[];
  sizes: string[];
  createdAt: string;
  updatedAt: string;
}

// Translated text for multi-language support
export interface TranslatedText {
  en: string;
  fr: string;
  ar: string;
  dz: string;
}

// Notification types
export type NotificationType = 'low-stock' | 'new-order' | 'order-update' | 'general';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type ProductCategory = string;

// Default categories
export const DEFAULT_CATEGORIES: { value: string; labelKey: string; emoji: string }[] = [
  { value: 'djellaba', labelKey: 'categories.djellaba', emoji: '👗' },
  { value: 'caftan', labelKey: 'categories.caftan', emoji: '👘' },
  { value: 'abaya', labelKey: 'categories.abaya', emoji: '🧥' },
  { value: 'takchita', labelKey: 'categories.takchita', emoji: '✨' },
  { value: 'accessories', labelKey: 'categories.accessories', emoji: '💍' },
  { value: 'other', labelKey: 'categories.other', emoji: '🛍️' },
];

// Custom category interface
export interface CustomCategory {
  value: string;
  emoji: string;
}

// This will be populated from store
export let CATEGORIES: { value: string; labelKey: string; emoji: string }[] = [...DEFAULT_CATEGORIES];

// User (simplified - single owner)
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner';
  preferredLocale: Locale;
  createdAt: string;
}

// Settings
export type Locale = 'en' | 'fr' | 'ar' | 'dz';
export type Currency = 'DZD' | 'EUR' | 'USD';

export interface AppSettings {
  locale: Locale;
  currency: Currency;
  notificationsEnabled: boolean;
  lowStockThreshold: number;
}

// Auth tokens (not used but kept for type compatibility)
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export type UserRole = 'owner';

// Order types
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
