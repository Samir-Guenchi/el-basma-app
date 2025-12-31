import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initI18n } from '@/i18n';
import { AppNavigator } from '@/navigation/AppNavigator';
import { ThemeProvider } from '@/theme/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { useSettingsStore } from '@/store';

function AppContent() {
  const { themeMode } = useSettingsStore();
  const isDark = themeMode === 'dark';

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
