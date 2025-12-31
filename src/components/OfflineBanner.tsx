import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOffline } from '@/hooks';
import { isRTL, getFlexDirection } from '@/utils/rtl';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isOnline, hasPendingChanges, pendingChangesCount, sync, lastSynced } = useOffline();
  const rtl = isRTL();

  if (isOnline && !hasPendingChanges) return null;

  const formatLastSynced = () => {
    if (!lastSynced) return '';
    const date = new Date(lastSynced);
    return date.toLocaleTimeString();
  };

  return (
    <View style={[styles.container, !isOnline && styles.containerOffline]}>
      <View style={[styles.content, { flexDirection: getFlexDirection() }]}>
        <View style={styles.info}>
          {!isOnline && (
            <Text style={styles.offlineText}>{t('offline.offlineMode')}</Text>
          )}
          {hasPendingChanges && (
            <Text style={styles.pendingText}>
              {t('offline.pendingChanges', { count: pendingChangesCount })}
            </Text>
          )}
          {lastSynced && (
            <Text style={styles.syncedText}>
              {t('offline.lastSynced', { time: formatLastSynced() })}
            </Text>
          )}
        </View>
        {isOnline && hasPendingChanges && (
          <TouchableOpacity style={styles.syncButton} onPress={sync}>
            <Text style={styles.syncButtonText}>{t('offline.syncNow')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  containerOffline: {
    backgroundColor: '#FFEBEE',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  offlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
  },
  pendingText: {
    fontSize: 12,
    color: '#E65100',
  },
  syncedText: {
    fontSize: 10,
    color: '#757575',
  },
  syncButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineBanner;
