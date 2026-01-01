import { Platform } from 'react-native';
import { useProductStore } from '@/store/productStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useLLMSettingsStore } from '@/store/llmSettingsStore';

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.43.220:3001';
  }
  return 'http://localhost:3001';
};
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();

// Sync interval in milliseconds (10 seconds for real-time feel)
const SYNC_INTERVAL = 10000;

interface SyncState {
  lastSync: number;
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
}

const syncState: SyncState = {
  lastSync: 0,
  isRunning: false,
  intervalId: null,
};

// Check server for updates
export const checkForUpdates = async (): Promise<{ hasUpdates: boolean; lastUpdate: string }> => {
  try {
    const res = await fetch(`${API_URL}/api/sync/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.log('Sync check failed:', error);
  }
  return { hasUpdates: false, lastUpdate: '' };
};

// Sync all data from server
export const syncAllData = async () => {
  console.log('🔄 Syncing data from server...');
  
  try {
    const { fetchProducts } = useProductStore.getState();
    const { fetchSettings, fetchCategories } = useSettingsStore.getState();
    const { fetchLLMSettings, fetchCommentSettings } = useLLMSettingsStore.getState();
    
    await Promise.all([
      fetchProducts(),
      fetchSettings(),
      fetchCategories(),
      fetchLLMSettings(),
      fetchCommentSettings(),
    ]);
    
    syncState.lastSync = Date.now();
    console.log('✅ Sync complete');
    return true;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return false;
  }
};

// Start auto-sync (call this when app starts)
export const startAutoSync = () => {
  if (syncState.isRunning) {
    console.log('Auto-sync already running');
    return;
  }
  
  console.log('🚀 Starting auto-sync (every 10s)');
  syncState.isRunning = true;
  
  // Initial sync
  syncAllData();
  
  // Set up interval
  syncState.intervalId = setInterval(async () => {
    await syncAllData();
  }, SYNC_INTERVAL);
};

// Stop auto-sync (call when app goes to background)
export const stopAutoSync = () => {
  if (syncState.intervalId) {
    clearInterval(syncState.intervalId);
    syncState.intervalId = null;
  }
  syncState.isRunning = false;
  console.log('⏹️ Auto-sync stopped');
};

// Manual refresh trigger
export const triggerSync = async () => {
  return await syncAllData();
};

// Get sync status
export const getSyncStatus = () => ({
  lastSync: syncState.lastSync,
  isRunning: syncState.isRunning,
});

export default {
  startAutoSync,
  stopAutoSync,
  triggerSync,
  syncAllData,
  getSyncStatus,
};
