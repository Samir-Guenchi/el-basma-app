import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOffline } from '@/hooks';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.offlineText}>{t('offline.offlineMode')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
  },
});

export default OfflineBanner;
