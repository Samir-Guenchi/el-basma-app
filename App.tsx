import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initI18n } from '@/i18n';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ThemeProvider } from '@/theme/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { useSettingsStore, useProductStore, useLLMSettingsStore } from '@/store';
import { startAutoSync, stopAutoSync } from '@/services/syncService';

function AppContent() {
  const { themeMode, fetchSettings, fetchCategories } = useSettingsStore();
  const { fetchProducts } = useProductStore();
  const { fetchLLMSettings, fetchCommentSettings } = useLLMSettingsStore();
  const isDark = themeMode === 'dark';

  // Fetch all data from server on app start and set up auto-sync
  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 Loading data from server...');
      try {
        await Promise.all([
          fetchSettings(),
          fetchCategories(),
          fetchProducts(),
          fetchLLMSettings(),
          fetchCommentSettings(),
        ]);
        console.log('✅ All data loaded from server');
        
        // Start auto-sync for multi-user support
        startAutoSync();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();

    // Handle app state changes (background/foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 App came to foreground - starting sync');
        startAutoSync();
      } else if (nextAppState === 'background') {
        console.log('📱 App went to background - stopping sync');
        stopAutoSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopAutoSync();
      subscription.remove();
    };
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppNavigator />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initI18n();
        setIsReady(true);
      } catch (err) {
        setError('Failed to initialize app');
        console.error('Initialization error:', err);
      }
    };

    initialize();
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>👗</Text>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>Loading your boutique...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
});
