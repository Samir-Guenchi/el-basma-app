import { Platform } from 'react-native';
import { AppNotification, NotificationType } from '@/types';

// Dynamic imports to avoid module resolution issues before npm install
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

const loadModules = async () => {
  if (!Notifications) {
    Notifications = await import('expo-notifications');
  }
  if (!Device) {
    Device = await import('expo-device');
  }
  return { Notifications, Device };
};

/**
 * Configure notification handler - call this on app init
 */
export const configureNotifications = async (): Promise<void> => {
  const { Notifications: N } = await loadModules();
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

/**
 * Register for push notifications and get token
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  const { Notifications: N, Device: D } = await loadModules();

  if (!D.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await N.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  const token = await N.getExpoPushTokenAsync({
    projectId: 'your-project-id', // Replace with actual project ID
  });

  // Configure Android channel
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E91E63',
    });

    await N.setNotificationChannelAsync('low-stock', {
      name: 'Low Stock Alerts',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
    });

    await N.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });
  }

  return token.data;
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, unknown>,
  _channelId: string = 'default'
): Promise<string> => {
  const { Notifications: N } = await loadModules();
  return await N.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate
  });
};

/**
 * Schedule low stock alert
 */
export const scheduleLowStockAlert = async (
  productName: string,
  quantity: number,
  productId: string
): Promise<string> => {
  return await scheduleLocalNotification(
    'Low Stock Alert',
    `${productName} has only ${quantity} items left`,
    { type: 'low-stock', productId },
    'low-stock'
  );
};

/**
 * Schedule new order notification
 */
export const scheduleNewOrderNotification = async (
  orderId: string,
  customerName: string
): Promise<string> => {
  return await scheduleLocalNotification(
    'New Order',
    `New order from ${customerName}`,
    { type: 'new-order', orderId },
    'orders'
  );
};

/**
 * Add notification response listener
 */
export const addNotificationResponseListener = async (
  callback: (notification: any) => void
) => {
  const { Notifications: N } = await loadModules();
  return N.addNotificationResponseReceivedListener(callback);
};

/**
 * Add notification received listener
 */
export const addNotificationReceivedListener = async (
  callback: (notification: any) => void
) => {
  const { Notifications: N } = await loadModules();
  return N.addNotificationReceivedListener(callback);
};

/**
 * Get badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  const { Notifications: N } = await loadModules();
  return await N.getBadgeCountAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  const { Notifications: N } = await loadModules();
  await N.setBadgeCountAsync(count);
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  const { Notifications: N } = await loadModules();
  await N.dismissAllNotificationsAsync();
  await setBadgeCount(0);
};

/**
 * Get notification channel for type
 */
export const getChannelForType = (type: NotificationType): string => {
  switch (type) {
    case 'low-stock':
      return 'low-stock';
    case 'new-order':
    case 'order-update':
      return 'orders';
    default:
      return 'default';
  }
};
