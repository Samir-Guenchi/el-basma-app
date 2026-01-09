/**
 * API Configuration
 * Single Responsibility: API URL and environment configuration
 */

import { Platform } from 'react-native';

const PRODUCTION_API_URL = 'https://web-production-1c70.up.railway.app/api';
const DEV_ANDROID_URL = 'http://192.168.43.220:3001/api';
const DEV_IOS_URL = 'http://localhost:3001/api';
const USE_PRODUCTION = true;

export const ApiConfig = {
  TIMEOUT: 30000,
  USE_PRODUCTION,

  getBaseUrl(): string {
    if (USE_PRODUCTION && PRODUCTION_API_URL) {
      return PRODUCTION_API_URL;
    }

    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }

    if (Platform.OS === 'android') {
      return DEV_ANDROID_URL;
    }

    return DEV_IOS_URL;
  },

  getServerUrl(): string {
    if (USE_PRODUCTION) {
      return 'https://web-production-1c70.up.railway.app';
    }
    if (Platform.OS === 'android') {
      return 'http://192.168.43.220:3001';
    }
    return 'http://localhost:3001';
  },
};
