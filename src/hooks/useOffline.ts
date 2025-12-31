import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useProductStore } from '@/store';

interface OfflineState {
  isOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
}

export const useOffline = () => {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    isConnected: null,
    connectionType: null,
  });

  const { pendingChanges, syncPendingChanges, lastSynced } = useProductStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      setState({
        isOnline: netState.isConnected === true && netState.isInternetReachable === true,
        isConnected: netState.isConnected,
        connectionType: netState.type,
      });
    });

    // Initial check
    NetInfo.fetch().then((netState) => {
      setState({
        isOnline: netState.isConnected === true && netState.isInternetReachable === true,
        isConnected: netState.isConnected,
        connectionType: netState.type,
      });
    });

    return () => unsubscribe();
  }, []);

  const sync = useCallback(async () => {
    if (state.isOnline && pendingChanges.length > 0) {
      await syncPendingChanges();
    }
  }, [state.isOnline, pendingChanges.length, syncPendingChanges]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && pendingChanges.length > 0) {
      sync();
    }
  }, [state.isOnline, pendingChanges.length, sync]);

  return {
    ...state,
    pendingChangesCount: pendingChanges.length,
    lastSynced,
    sync,
    hasPendingChanges: pendingChanges.length > 0,
  };
};
