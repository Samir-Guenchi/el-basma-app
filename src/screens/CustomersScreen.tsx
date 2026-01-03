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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '@/store';
import { useToast } from '@/context/ToastContext';
import { MoreStackParamList } from '@/navigation/types';

const API_URL = 'https://web-production-1c70.up.railway.app';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  platform: string;
  platform_user_id: string;
  last_message_at: string;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_spent: number;
}

type FilterType = 'all' | 'buyers' | 'cancelled';

export const CustomersScreen: React.FC = () => {
  const { themeMode } = useSettingsStore();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const route = useRoute<RouteProp<MoreStackParamList, 'CustomersDetail'>>();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', platform: 'app', type: 'buyer', amount: '' });

  const dark = themeMode === 'dark';
  const c = {
    bg: dark ? '#0a0a0f' : '#f8f9fa',
    card: dark ? '#16161f' : '#ffffff',
    text: dark ? '#ffffff' : '#111827',
    sub: dark ? '#9ca3af' : '#6b7280',
    line: dark ? '#1f1f2e' : '#e5e7eb',
    pink: '#ec4899',
    green: '#22c55e',
    red: '#ef4444',
    blue: '#3b82f6',
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/customers`);
      if (res.ok) setCustomers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i); }, [load]);
  useEffect(() => { if (route.params?.filter) setFilter(route.params.filter as FilterType); }, [route.params?.filter]);

  const filtered = customers.filter(cu => {
    const matchSearch = !search || cu.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || 
      (filter === 'buyers' && (cu.completed_orders || 0) > 0) ||
      (filter === 'cancelled' && (cu.cancelled_orders || 0) > 0);
    return matchSearch && matchFilter;
  });

  const stats = {
    total: customers.length,
    buyers: customers.filter(c => (c.completed_orders || 0) > 0).length,
    cancelled: customers.filter(c => (c.cancelled_orders || 0) > 0).length,
    revenue: customers.reduce((s, c) => s + (c.total_spent || 0), 0),
  };

  const icon = (p: string) => ({ facebook: '📘', instagram: '📸', whatsapp: '💬', tiktok: '🎵', website: '🌐' }[p] || '👤');

  const del = async (cu: Customer) => {
    try {
      await fetch(`${API_URL}/api/customers/${cu.id}`, { method: 'DELETE' });
      setCustomers(prev => prev.filter(c => c.id !== cu.id));
      showSuccess(t('common.success'));
    } catch { showError(t('common.error')); }
  };

  const save = async () => {
    if (!form.name.trim()) return showError(t('orders.customerRequired'));
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, phone: form.phone, platform: form.platform,
          completed_orders: form.type === 'buyer' ? 1 : 0,
          cancelled_orders: form.type === 'cancelled' ? 1 : 0,
          total_spent: form.type === 'buyer' ? (parseInt(form.amount) || 0) : 0,
        }),
      });
      showSuccess(t('common.success'));
      setShowAdd(false);
      setForm({ name: '', phone: '', platform: 'app', type: 'buyer', amount: '' });
      load();
    } catch { showError(t('common.error')); }
    finally { setSaving(false); }
  };

  const update = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/customers/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selected.name, phone: selected.phone || '',
          completed_orders: selected.completed_orders,
          cancelled_orders: selected.cancelled_orders,
          total_spent: selected.total_spent,
        }),
      });
      showSuccess(t('common.success'));
      setShowEdit(false);
      load();
    } catch { showError(t('common.error')); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <ActivityIndicator size="large" color={c.pink} style={{ flex: 1 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.line }]}>
        <View style={[styles.searchBar, { backgroundColor: c.card }]}>
          <Feather name="search" size={18} color={c.sub} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder={t('common.search') + '...'}
            placeholderTextColor={c.sub}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.pink }]} onPress={() => setShowAdd(true)}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={c.pink} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: c.card }]}>
            <Text style={[styles.statNum, { color: c.pink }]}>{stats.total}</Text>
            <Text style={[styles.statLbl, { color: c.sub }]}>{t('customers.clients')}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.card }]}>
            <Text style={[styles.statNum, { color: c.green }]}>{stats.buyers}</Text>
            <Text style={[styles.statLbl, { color: c.sub }]}>{t('customers.buyers')}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.card }]}>
            <Text style={[styles.statNum, { color: c.red }]}>{stats.cancelled}</Text>
            <Text style={[styles.statLbl, { color: c.sub }]}>{t('orders.cancelled')}</Text>
          </View>
        </View>

        {/* Revenue */}
        <View style={[styles.revenueBox, { backgroundColor: c.pink }]}>
          <Text style={styles.revenueLbl}>{t('customers.totalRevenue')}</Text>
          <Text style={styles.revenueNum}>{stats.revenue.toLocaleString()} DA</Text>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {(['all', 'buyers', 'cancelled'] as FilterType[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && { backgroundColor: c.pink + '20', borderColor: c.pink }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTxt, { color: filter === f ? c.pink : c.sub }]}>
                {f === 'all' ? t('common.all') : f === 'buyers' ? t('customers.buyers') : t('orders.cancelled')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <Text style={[styles.listTitle, { color: c.text }]}>{filtered.length} {t('customers.clients').toLowerCase()}</Text>
        
        {filtered.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: c.card }]}>
            <Text style={{ fontSize: 40 }}>👥</Text>
            <Text style={[styles.emptyTxt, { color: c.sub }]}>{t('customers.noClients')}</Text>
          </View>
        ) : filtered.map(cu => (
          <View key={cu.id} style={[styles.card, { backgroundColor: c.card }]}>
            <View style={styles.cardTop}>
              <View style={[styles.avatar, { backgroundColor: c.pink + '15' }]}>
                <Text style={{ fontSize: 20 }}>{icon(cu.platform)}</Text>
              </View>
              <TouchableOpacity style={styles.cardInfo} onPress={() => { setSelected({...cu}); setShowEdit(true); }}>
                <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>{cu.name || t('customers.client')}</Text>
                <Text style={[styles.cardSub, { color: c.sub }]}>{cu.platform}</Text>
              </TouchableOpacity>
              <View style={styles.cardBadges}>
                {(cu.completed_orders || 0) > 0 && (
                  <View style={[styles.badge, { backgroundColor: c.green + '20' }]}>
                    <Text style={[styles.badgeTxt, { color: c.green }]}>✓{cu.completed_orders}</Text>
                  </View>
                )}
                {(cu.cancelled_orders || 0) > 0 && (
                  <View style={[styles.badge, { backgroundColor: c.red + '20' }]}>
                    <Text style={[styles.badgeTxt, { color: c.red }]}>✕{cu.cancelled_orders}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.cardBtn} onPress={() => { setSelected({...cu}); setShowEdit(true); }}>
                <Feather name="edit-2" size={16} color={c.sub} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cardBtn, { backgroundColor: c.red + '15' }]} onPress={() => del(cu)}>
                <Feather name="trash-2" size={16} color={c.red} />
              </TouchableOpacity>
            </View>
            <View style={[styles.cardBottom, { borderTopColor: c.line }]}>
              <View style={styles.cardStat}>
                <Text style={[styles.cardStatNum, { color: c.text }]}>{cu.total_orders || 0}</Text>
                <Text style={[styles.cardStatLbl, { color: c.sub }]}>{t('orders.title')}</Text>
              </View>
              <View style={[styles.cardDivider, { backgroundColor: c.line }]} />
              <View style={styles.cardStat}>
                <Text style={[styles.cardStatNum, { color: c.green }]}>{(cu.total_spent || 0).toLocaleString()} DA</Text>
                <Text style={[styles.cardStatLbl, { color: c.sub }]}>{t('customers.spent')}</Text>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: c.card }]}>
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: c.text }]}>{t('common.add')} {t('customers.client')}</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}><Feather name="x" size={24} color={c.sub} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: c.sub }]}>{t('orders.customerName')}</Text>
              <TextInput style={[styles.input, { backgroundColor: c.bg, color: c.text, borderColor: c.line }]} value={form.name} onChangeText={v => setForm({...form, name: v})} placeholder={t('orders.customerName')} placeholderTextColor={c.sub} />
              
              <Text style={[styles.label, { color: c.sub }]}>{t('orders.phone')}</Text>
              <TextInput style={[styles.input, { backgroundColor: c.bg, color: c.text, borderColor: c.line }]} value={form.phone} onChangeText={v => setForm({...form, phone: v})} placeholder="0555..." placeholderTextColor={c.sub} keyboardType="phone-pad" />
              
              <Text style={[styles.label, { color: c.sub }]}>Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity style={[styles.typeBtn, form.type === 'buyer' && { backgroundColor: c.green + '20', borderColor: c.green }]} onPress={() => setForm({...form, type: 'buyer'})}>
                  <Text style={{ color: form.type === 'buyer' ? c.green : c.text }}>✅ {t('customers.buyers')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, form.type === 'cancelled' && { backgroundColor: c.red + '20', borderColor: c.red }]} onPress={() => setForm({...form, type: 'cancelled'})}>
                  <Text style={{ color: form.type === 'cancelled' ? c.red : c.text }}>❌ {t('orders.cancelled')}</Text>
                </TouchableOpacity>
              </View>

              {form.type === 'buyer' && (
                <>
                  <Text style={[styles.label, { color: c.sub }]}>{t('common.total')} (DA)</Text>
                  <TextInput style={[styles.input, { backgroundColor: c.bg, color: c.text, borderColor: c.line }]} value={form.amount} onChangeText={v => setForm({...form, amount: v})} placeholder="0" placeholderTextColor={c.sub} keyboardType="numeric" />
                </>
              )}

              <Text style={[styles.label, { color: c.sub }]}>Platform</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[{k:'app',e:'🏪'},{k:'facebook',e:'📘'},{k:'instagram',e:'📸'},{k:'whatsapp',e:'💬'},{k:'tiktok',e:'🎵'},{k:'website',e:'🌐'}].map(p => (
                  <TouchableOpacity key={p.k} style={[styles.platBtn, form.platform === p.k && { backgroundColor: c.pink, borderColor: c.pink }]} onPress={() => setForm({...form, platform: p.k})}>
                    <Text>{p.e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
            <View style={styles.modalFoot}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: c.line }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: c.text }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.green }]} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.add')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: c.card }]}>
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: c.text }]}>{t('common.edit')}</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}><Feather name="x" size={24} color={c.sub} /></TouchableOpacity>
            </View>
            {selected && (
              <ScrollView style={styles.modalBody}>
                <Text style={[styles.label, { color: c.sub }]}>{t('orders.customerName')}</Text>
                <TextInput style={[styles.input, { backgroundColor: c.bg, color: c.text, borderColor: c.line }]} value={selected.name} onChangeText={v => setSelected({...selected, name: v})} />
                
                <Text style={[styles.label, { color: c.sub }]}>{t('orders.phone')}</Text>
                <TextInput style={[styles.input, { backgroundColor: c.bg, color: c.text, borderColor: c.line }]} value={selected.phone || ''} onChangeText={v => setSelected({...selected, phone: v})} keyboardType="phone-pad" />
                
                <View style={styles.editStats}>
                  <View style={[styles.editStatBox, { backgroundColor: c.green + '10' }]}>
                    <Text style={{ color: c.green, fontSize: 12, marginBottom: 8 }}>{t('customers.purchases')}</Text>
                    <View style={styles.editStatRow}>
                      <TouchableOpacity style={[styles.pmBtn, { backgroundColor: c.green }]} onPress={() => setSelected({...selected, completed_orders: Math.max(0, (selected.completed_orders || 0) - 1)})}>
                        <Feather name="minus" size={16} color="#fff" />
                      </TouchableOpacity>
                      <Text style={[styles.editStatNum, { color: c.text }]}>{selected.completed_orders || 0}</Text>
                      <TouchableOpacity style={[styles.pmBtn, { backgroundColor: c.green }]} onPress={() => setSelected({...selected, completed_orders: (selected.completed_orders || 0) + 1})}>
                        <Feather name="plus" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.editStatBox, { backgroundColor: c.red + '10' }]}>
                    <Text style={{ color: c.red, fontSize: 12, marginBottom: 8 }}>{t('orders.cancelled')}</Text>
                    <View style={styles.editStatRow}>
                      <TouchableOpacity style={[styles.pmBtn, { backgroundColor: c.red }]} onPress={() => setSelected({...selected, cancelled_orders: Math.max(0, (selected.cancelled_orders || 0) - 1)})}>
                        <Feather name="minus" size={16} color="#fff" />
                      </TouchableOpacity>
                      <Text style={[styles.editStatNum, { color: c.text }]}>{selected.cancelled_orders || 0}</Text>
                      <TouchableOpacity style={[styles.pmBtn, { backgroundColor: c.red }]} onPress={() => setSelected({...selected, cancelled_orders: (selected.cancelled_orders || 0) + 1})}>
                        <Feather name="plus" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={[styles.label, { color: c.sub }]}>{t('customers.spent')} (DA)</Text>
                <TextInput style={[styles.input, { backgroundColor: c.bg, color: c.text, borderColor: c.line }]} value={String(selected.total_spent || 0)} onChangeText={v => setSelected({...selected, total_spent: parseInt(v) || 0})} keyboardType="numeric" />

                <TouchableOpacity style={[styles.delBtn, { backgroundColor: c.red + '15' }]} onPress={() => { del(selected); setShowEdit(false); }}>
                  <Feather name="trash-2" size={18} color={c.red} />
                  <Text style={{ color: c.red, marginLeft: 8 }}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
            <View style={styles.modalFoot}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: c.line }]} onPress={() => setShowEdit(false)}>
                <Text style={{ color: c.text }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: c.green }]} onPress={update} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>{t('common.save')}</Text>}
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
  header: { flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: 1 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 44, borderRadius: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '700' },
  statLbl: { fontSize: 12, marginTop: 4 },
  revenueBox: { padding: 20, borderRadius: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueLbl: { color: '#fff', fontSize: 14, opacity: 0.9 },
  revenueNum: { color: '#fff', fontSize: 24, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  filterTxt: { fontSize: 13, fontWeight: '500' },
  listTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  empty: { padding: 40, borderRadius: 16, alignItems: 'center' },
  emptyTxt: { marginTop: 12, fontSize: 14 },
  card: { borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardSub: { fontSize: 12, marginTop: 2 },
  cardBadges: { flexDirection: 'row', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTxt: { fontSize: 11, fontWeight: '600' },
  cardBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardBottom: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 12 },
  cardStat: { flex: 1, alignItems: 'center' },
  cardStatNum: { fontSize: 15, fontWeight: '600' },
  cardStatLbl: { fontSize: 11, marginTop: 2 },
  cardDivider: { width: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 0 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { padding: 20 },
  modalFoot: { flexDirection: 'row', gap: 12, padding: 20, paddingTop: 0 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', alignItems: 'center' },
  platBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'transparent', marginRight: 8 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  saveBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  editStats: { flexDirection: 'row', gap: 12, marginTop: 16 },
  editStatBox: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center' },
  editStatRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  editStatNum: { fontSize: 24, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  pmBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  delBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginTop: 20 },
});

export default CustomersScreen;
