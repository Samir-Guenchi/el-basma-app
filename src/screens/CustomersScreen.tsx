import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store';
import { MoreStackParamList } from '@/navigation/types';

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.43.220:3001';
  }
  return 'http://localhost:3001';
};
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();

interface Customer {
  id: string;
  name: string;
  platform: string;
  platform_user_id: string;
  last_message_at: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spent: number;
}

type FilterType = 'all' | 'completed' | 'cancelled';

export const CustomersScreen: React.FC = () => {
  const { themeMode } = useSettingsStore();
  const { t } = useTranslation();
  const route = useRoute<RouteProp<MoreStackParamList, 'CustomersDetail'>>();
  const initialFilter = route.params?.filter || 'all';
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>(initialFilter);

  const isDark = themeMode === 'dark';
  const colors = {
    background: isDark ? '#0D0D1A' : '#FAFAFA',
    surface: isDark ? '#1A1A2E' : '#FFFFFF',
    text: isDark ? '#F5F5F7' : '#1A1A2E',
    textSecondary: isDark ? '#B8B8C7' : '#6B6B80',
    border: isDark ? '#2D2D45' : '#E8E8EF',
    primary: isDark ? '#F48FB1' : '#E91E63',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  };

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/customers`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Update filter when navigating with params
  useEffect(() => {
    if (route.params?.filter) {
      setFilter(route.params.filter);
    }
  }, [route.params?.filter]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return '📘';
      case 'instagram': return '📸';
      case 'whatsapp': return '💬';
      case 'tiktok': return '🎵';
      default: return '👤';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      (customer.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    let matchesFilter = true;
    if (filter === 'completed') {
      matchesFilter = (customer.completed_orders || 0) > 0;
    } else if (filter === 'cancelled') {
      matchesFilter = (customer.cancelled_orders || 0) > 0;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Stats
  const totalCompleted = customers.reduce((sum, c) => sum + (c.completed_orders || 0), 0);
  const totalCancelled = customers.reduce((sum, c) => sum + (c.cancelled_orders || 0), 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

  const filters: { key: FilterType; label: string; icon: string; color: string }[] = [
    { key: 'all', label: t('common.all'), icon: '👥', color: colors.primary },
    { key: 'completed', label: t('customers.buyers'), icon: '✅', color: colors.success },
    { key: 'cancelled', label: t('orders.cancelled'), icon: '❌', color: colors.error },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('common.search') + '...'}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCustomers(); }} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{customers.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('customers.clients')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{totalCompleted}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('customers.purchases')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{totalCancelled}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('orders.cancelled')}</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={[styles.revenueCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.revenueLabel}>💰 {t('customers.totalRevenue')}</Text>
          <Text style={styles.revenueValue}>{totalRevenue.toLocaleString()} DA</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterTab,
                { backgroundColor: filter === f.key ? f.color + '20' : colors.surface, borderColor: filter === f.key ? f.color : colors.border }
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={styles.filterIcon}>{f.icon}</Text>
              <Text style={[styles.filterLabel, { color: filter === f.key ? f.color : colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Customer List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {filter === 'all' ? t('customers.allClients') : filter === 'completed' ? t('customers.buyerClients') : t('customers.cancelledOrders')} ({filteredCustomers.length})
        </Text>

        {filteredCustomers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.emptyIcon}>{filter === 'cancelled' ? '🎉' : '👥'}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'cancelled' ? t('customers.noCancellations') : searchQuery ? t('common.noData') : t('customers.noClients')}
            </Text>
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <View key={customer.id} style={[styles.customerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.customerHeader}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={styles.avatarText}>{getPlatformIcon(customer.platform)}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={[styles.customerName, { color: colors.text }]}>{customer.name || t('customers.client')}</Text>
                  <Text style={[styles.customerPlatform, { color: colors.textSecondary }]}>
                    {customer.platform} • {formatDate(customer.last_message_at)}
                  </Text>
                </View>
                {/* Status badges */}
                <View style={styles.badges}>
                  {(customer.completed_orders || 0) > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.success }]}>✓ {customer.completed_orders}</Text>
                    </View>
                  )}
                  {(customer.cancelled_orders || 0) > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.error }]}>✕ {customer.cancelled_orders}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={[styles.customerStats, { borderTopColor: colors.border }]}>
                <View style={styles.customerStat}>
                  <Text style={[styles.customerStatValue, { color: colors.text }]}>{customer.total_orders || 0}</Text>
                  <Text style={[styles.customerStatLabel, { color: colors.textSecondary }]}>{t('orders.title')}</Text>
                </View>
                <View style={[styles.customerStatDivider, { backgroundColor: colors.border }]} />
                <View style={styles.customerStat}>
                  <Text style={[styles.customerStatValue, { color: colors.success }]}>{(customer.total_spent || 0).toLocaleString()} DA</Text>
                  <Text style={[styles.customerStatLabel, { color: colors.textSecondary }]}>{t('customers.spent')}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 46 },
  searchIcon: { fontSize: 18, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  content: { flex: 1, padding: 16, paddingTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4 },
  revenueCard: { borderRadius: 14, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueLabel: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  revenueValue: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  filterContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  filterTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  filterIcon: { fontSize: 14 },
  filterLabel: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  emptyCard: { borderRadius: 16, padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  customerCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  customerHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 20 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600' },
  customerPlatform: { fontSize: 12, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  customerStats: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  customerStat: { flex: 1, alignItems: 'center' },
  customerStatDivider: { width: 1, height: '100%' },
  customerStatValue: { fontSize: 15, fontWeight: '700' },
  customerStatLabel: { fontSize: 10, marginTop: 2 },
  bottomSpacer: { height: 100 },
});

export default CustomersScreen;
