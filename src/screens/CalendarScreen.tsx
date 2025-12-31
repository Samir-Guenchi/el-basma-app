import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCalendar, OfflineBanner } from '@/components';
import { useAuthStore, selectIsOwner, selectIsStaff } from '@/store';

export const CalendarScreen: React.FC = () => {
  const isOwner = useAuthStore(selectIsOwner);
  const isStaff = useAuthStore(selectIsStaff);
  const canEdit = isOwner || isStaff;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <OfflineBanner />
      <ProductCalendar editable={canEdit} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});

export default CalendarScreen;
