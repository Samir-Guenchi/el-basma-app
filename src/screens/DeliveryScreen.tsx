import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store';
import { useToast } from '@/context/ToastContext';

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.43.220:3001';
  }
  return 'http://localhost:3001';
};
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();

interface DeliveryPrice {
  id?: number;
  city: string;
  home: number;
  office: number;
  agencies: string | null;
}

export const DeliveryScreen: React.FC = () => {
  const { themeMode } = useSettingsStore();
  const { showSuccess, showError } = useToast();
  const { t } = useTranslation();
  const [prices, setPrices] = useState<DeliveryPrice[]>([]);
  const [filteredPrices, setFilteredPrices] = useState<DeliveryPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryPrice | null>(null);
  const [formData, setFormData] = useState({ city: '', home: '', office: '', agencies: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isDark = themeMode === 'dark';
  const colors = {
    bg: isDark ? '#121212' : '#F5F5F5',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
    surfaceAlt: isDark ? '#252525' : '#FAFAFA',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSec: isDark ? '#A0A0A0' : '#666666',
    textMuted: isDark ? '#707070' : '#999999',
    border: isDark ? '#2A2A2A' : '#E8E8E8',
    primary: '#D4436A',
    primarySoft: isDark ? 'rgba(212, 67, 106, 0.15)' : 'rgba(212, 67, 106, 0.08)',
    success: '#2ECC71',
    successSoft: isDark ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.08)',
    warning: '#F39C12',
    warningSoft: isDark ? 'rgba(243, 156, 18, 0.15)' : 'rgba(243, 156, 18, 0.08)',
    danger: '#E74C3C',
    dangerSoft: isDark ? 'rgba(231, 76, 60, 0.15)' : 'rgba(231, 76, 60, 0.08)',
    accent: '#9B59B6',
  };

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/delivery`);
      const data = await res.json();
      setPrices(data);
      setFilteredPrices(data);
    } catch (error) {
      console.error('Error fetching delivery prices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    
    // Auto-refresh every 10 seconds for multi-user sync
    const interval = setInterval(() => {
      fetchPrices();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredPrices(prices);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredPrices(prices.filter(p => p.city.toLowerCase().includes(q)));
    }
  }, [searchQuery, prices]);

  const formatPrice = (price: number) => {
    if (price === 0) return t('common.free');
    return `${price.toLocaleString()} DA`;
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ city: '', home: '', office: '', agencies: '' });
    setShowModal(true);
  };

  const openEditModal = (item: DeliveryPrice) => {
    setEditingItem(item);
    setFormData({
      city: item.city,
      home: item.home.toString(),
      office: item.office.toString(),
      agencies: item.agencies || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.city.trim()) {
      showError(t('delivery.cityRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        city: formData.city.trim(),
        home: parseInt(formData.home) || 0,
        office: parseInt(formData.office) || 0,
        agencies: formData.agencies.trim() || null,
      };

      if (editingItem) {
        // Update existing
        const url = `${API_URL}/api/delivery/${encodeURIComponent(editingItem.city)}`;
        console.log('Updating:', url, payload);
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log('Update response:', res.status, data);
        if (res.ok && data.success) {
          showSuccess(t('delivery.cityUpdated'));
          // Update prices - useEffect will handle filteredPrices
          setPrices(prev => prev.map(p => 
            p.city === editingItem.city ? { ...p, ...payload } : p
          ));
        } else {
          showError(data.error || t('common.error'));
        }
      } else {
        // Add new
        const res = await fetch(`${API_URL}/api/delivery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log('Add response:', res.status, data);
        if (res.ok && data.success) {
          showSuccess(t('delivery.cityAdded'));
          // Add to prices - useEffect will handle filteredPrices
          const newItem = { ...payload, id: Date.now() };
          setPrices(prev => [...prev, newItem]);
        } else {
          showError(data.error || t('common.error'));
        }
      }

      setShowModal(false);
    } catch (error) {
      console.error('Save error:', error);
      showError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: DeliveryPrice) => {
    console.log('=== DELETE CLICKED ===', item.city);
    
    // Direct delete without Alert for testing
    setDeleting(item.city);
    try {
      const url = `${API_URL}/api/delivery/${encodeURIComponent(item.city)}`;
      console.log('DELETE URL:', url);
      
      const res = await fetch(url, { method: 'DELETE' });
      console.log('Response status:', res.status);
      
      const data = await res.json();
      console.log('Response data:', JSON.stringify(data));
      
      if (res.ok && data.success) {
        showSuccess(`${item.city} supprimé`);
        setPrices(prev => prev.filter(p => p.city !== item.city));
      } else {
        showError(data.error || 'Erreur de suppression');
      }
    } catch (error: any) {
      console.error('DELETE ERROR:', error.message);
      showError('Erreur: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  // Calculate stats
  const homeMin = Math.min(...prices.filter(p => p.home > 0).map(p => p.home), 9999);
  const homeMax = Math.max(...prices.map(p => p.home), 0);
  const officeMin = Math.min(...prices.filter(p => p.office > 0).map(p => p.office), 9999);
  const officeMax = Math.max(...prices.map(p => p.office), 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('delivery.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{prices.length} {t('common.cities')}</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAddModal}>
          <Feather name="plus" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>{t('common.add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('delivery.searchCity')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchPrices(); }} 
            colors={[colors.primary]}
          />
        }
      >
        {/* Free Delivery Banner */}
        <View style={[styles.freeBanner, { backgroundColor: colors.success }]}>
          <View style={styles.freeBannerIcon}>
            <Feather name="gift" size={24} color="#FFF" />
          </View>
          <View style={styles.freeBannerContent}>
            <Text style={styles.freeBannerTitle}>{t('delivery.freeDelivery')}</Text>
            <Text style={styles.freeBannerSubtitle}>{t('delivery.freeDeliverySubtitle')}</Text>
          </View>
          <View style={styles.freeBannerBadge}>
            <Feather name="check" size={16} color={colors.success} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="city" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{prices.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('common.cities')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningSoft }]}>
              <Feather name="home" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{homeMin}-{homeMax}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>DA {t('delivery.home')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.successSoft }]}>
              <Feather name="package" size={18} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{officeMin}-{officeMax}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>DA {t('delivery.office')}</Text>
          </View>
        </View>

        {/* Price List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('delivery.pricesByCity')}</Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{filteredPrices.length} {t('common.results')}</Text>
        </View>

        {filteredPrices.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceAlt }]}>
              <Feather name="map-pin" size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('delivery.noCity')}</Text>
          </View>
        ) : (
          filteredPrices.map((item, index) => (
            <View 
              key={item.city + index} 
              style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.priceHeader}>
                <TouchableOpacity 
                  style={styles.cityInfo}
                  onPress={() => openEditModal(item)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.cityIcon, 
                    { backgroundColor: item.home === 0 ? colors.successSoft : colors.primarySoft }
                  ]}>
                    {item.home === 0 ? (
                      <Feather name="star" size={16} color={colors.success} />
                    ) : (
                      <Feather name="map-pin" size={16} color={colors.primary} />
                    )}
                  </View>
                  <Text style={[styles.cityName, { color: colors.text }]}>{item.city}</Text>
                </TouchableOpacity>
                <View style={styles.cardActions}>
                  {item.home === 0 && (
                    <View style={[styles.freeBadge, { backgroundColor: colors.successSoft }]}>
                      <Text style={[styles.freeBadgeText, { color: colors.success }]}>{t('common.free')}</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={[styles.editBtn, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => openEditModal(item)}
                  >
                    <Feather name="edit-2" size={14} color={colors.textSec} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.deleteIconBtn, { backgroundColor: colors.dangerSoft }]}
                    onPress={() => handleDelete(item)}
                    disabled={deleting === item.city}
                  >
                    {deleting === item.city ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <Feather name="trash-2" size={14} color={colors.danger} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              
              {item.home > 0 && (
                <View style={[styles.priceRow, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={styles.priceItem}>
                    <Feather name="home" size={14} color={colors.warning} />
                    <Text style={[styles.priceLabel, { color: colors.textMuted }]}>{t('delivery.home')}</Text>
                    <Text style={[styles.priceValue, { color: colors.text }]}>{formatPrice(item.home)}</Text>
                  </View>
                  <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.priceItem}>
                    <Feather name="package" size={14} color={colors.success} />
                    <Text style={[styles.priceLabel, { color: colors.textMuted }]}>{t('delivery.office')}</Text>
                    <Text style={[styles.priceValue, { color: colors.text }]}>{formatPrice(item.office)}</Text>
                  </View>
                </View>
              )}
              
              {item.agencies && (
                <View style={styles.agenciesRow}>
                  <Feather name="info" size={12} color={colors.textSec} />
                  <Text style={[styles.agencies, { color: colors.textSec }]}>{item.agencies}</Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingItem ? t('delivery.editPrice') : t('delivery.addCity')}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('delivery.cityName')} *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Feather name="map-pin" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ex: Alger, Oran..."
                  placeholderTextColor={colors.textMuted}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  editable={!editingItem}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('delivery.homePrice')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Feather name="home" size={18} color={colors.warning} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={`0 ${t('common.free').toLowerCase()}`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={formData.home}
                  onChangeText={(text) => setFormData({ ...formData, home: text })}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('delivery.officePrice')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Feather name="package" size={18} color={colors.success} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder={`0 ${t('common.free').toLowerCase()}`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={formData.office}
                  onChangeText={(text) => setFormData({ ...formData, office: text })}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('delivery.agencies')}</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: colors.text }]}
                  placeholder="Ex: Yalidine, ZR Express..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                  value={formData.agencies}
                  onChangeText={(text) => setFormData({ ...formData, agencies: text })}
                />
              </View>

              {editingItem && (
                <TouchableOpacity 
                  style={[styles.deleteBtn, { backgroundColor: colors.dangerSoft }]}
                  onPress={() => { setShowModal(false); handleDelete(editingItem); }}
                >
                  <Feather name="trash-2" size={18} color={colors.danger} />
                  <Text style={[styles.deleteBtnText, { color: colors.danger }]}>{t('delivery.deleteCity')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.cancelBtn, { borderColor: colors.border }]} 
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.success }]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Feather name="check" size={18} color="#FFF" />
                    <Text style={styles.saveBtnText}>{editingItem ? t('common.edit') : t('common.add')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 12, 
    gap: 6 
  },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  // Search
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    borderWidth: 1, 
    paddingHorizontal: 14, 
    height: 46,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },

  content: { flex: 1, paddingHorizontal: 16 },

  // Free Banner
  freeBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 16 
  },
  freeBannerIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 14,
  },
  freeBannerContent: { flex: 1 },
  freeBannerTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  freeBannerSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  freeBannerBadge: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sectionCount: { fontSize: 13 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14 },

  // Price Card
  priceCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cityInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cityName: { fontSize: 15, fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  freeBadgeText: { fontSize: 11, fontWeight: '700' },
  editBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  deleteIconBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12 },
  priceItem: { flex: 1, alignItems: 'center', gap: 4 },
  priceLabel: { fontSize: 11 },
  priceValue: { fontSize: 14, fontWeight: '700' },
  priceDivider: { width: 1, height: 36 },
  agenciesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  agencies: { fontSize: 12, flex: 1 },

  bottomSpacer: { height: 100 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    borderWidth: 1, 
    paddingHorizontal: 14, 
    height: 50, 
    gap: 10 
  },
  input: { flex: 1, fontSize: 15 },
  textAreaWrapper: { height: 80, alignItems: 'flex-start', paddingVertical: 12 },
  textArea: { textAlignVertical: 'top', height: '100%' },
  deleteBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 14, 
    borderRadius: 12, 
    marginTop: 24,
    gap: 8,
  },
  deleteBtnText: { fontWeight: '600', fontSize: 14 },
  modalFooter: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', fontSize: 15 },
  saveBtn: { flex: 2, flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
});

export default DeliveryScreen;
