/**
 * Notification Entity
 * Single Responsibility: Defines the notification data structure
 */

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

export interface TranslatedText {
  en: string;
  fr: string;
  ar: string;
  dz: string;
}
