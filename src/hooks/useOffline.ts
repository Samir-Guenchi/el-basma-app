import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

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

  return {
    ...state,
  };
};
