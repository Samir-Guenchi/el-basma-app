import { Platform } from 'react-native';

// ============================================
// API CONFIGURATION
// ============================================

// PRODUCTION URL (Railway)
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';

// DEVELOPMENT URLs
const DEV_ANDROID_URL = 'http://192.168.43.220:3001';
const DEV_IOS_URL = 'http://localhost:3001';

// Set to true for production APK, false for local development
const USE_PRODUCTION = true;

// Get base API URL (without /api)
export const getApiUrl = (): string => {
  if (USE_PRODUCTION) {
    return PRODUCTION_URL;
  }
  
  if (Platform.OS === 'android') {
    return DEV_ANDROID_URL;
  }
  
  return DEV_IOS_URL;
};

// Get full API URL (with /api)
export const getApiBaseUrl = (): string => {
  return `${getApiUrl()}/api`;
};

// Get image URL from relative path
export const getImageUrl = (uri: string): string => {
  if (!uri) return '';
  
  // Already a full URL
  if (uri.startsWith('http://') || uri.startsWith('https://') || 
      uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  
  // Relative path - prepend API URL
  return `${getApiUrl()}${uri}`;
};

export const API_URL = getApiUrl();
export const API_BASE_URL = getApiBaseUrl();
