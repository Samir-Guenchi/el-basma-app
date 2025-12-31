import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettingsStore, useProductStore } from '@/store';
import { useToast } from '@/context/ToastContext';

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.43.220:3001';
  }
  return 'http://localhost:3001';
};

type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  date: string;
  notes: string;
}

const DEMO_ORDERS: Order[] = [
  {
    id: '1',
    customerName: 'Fatima Benali',
    customerPhone: '0555 12 34 56',
    productName: 'Djellaba Traditionnelle Blanche',
    quantity: 1,
    totalPrice: 15000,
    status: 'pending',
    date: '2024-12-28',
    notes: 'Taille M, livraison à domicile',
  },
  {
    id: '2',
    customerName: 'Amina Khelifi',
    customerPhone: '0661 98 76 54',
    productName: 'Caftan Marocain Doré',
    quantity: 1,
    totalPrice: 25000,
    status: 'pending',
    date: '2024-12-27',
    notes: 'Pour mariage, besoin avant le 5 janvier',
  },
];

export const OrderListScreen: React.FC = () => {
  const { themeMode } = useSettingsStore();
  const { products } = useProductStore();
  const { showSuccess, showError, showWarning } = useToast();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    productName: '',
    quantity: '1',
    notes: '',
  });
  
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'delete' | 'validate' | 'cancel';
    onConfirm: () => void;
  }>({ visible: false, title: '', message: '', type: 'delete', onConfirm: () => {} });
  
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    return searchQuery === '' || 
      order.customerName.toLowerCase().includes(query) ||
      order.productName.toLowerCase().includes(query) ||
      order.customerPhone.includes(query);
  });

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' DA';
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const callCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const whatsappCustomer = (phone: string, productName: string) => {
    const message = `Bonjour! Concernant votre commande "${productName}" chez Djellaba El Basma...`;
    const cleanPhone = phone.replace(/\s/g, '').replace(/^0/, '213');
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`);
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    
    if (order && (newStatus === 'completed' || newStatus === 'cancelled')) {
      addCustomerFromOrder(order, newStatus);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setSelectedOrder(null);
      
      if (newStatus === 'completed') {
        showSuccess('Commande validée!');
      } else {
        showWarning('Commande annulée');
      }
    }
  };

  const addCustomerFromOrder = async (order: Order, status: 'completed' | 'cancelled') => {
    try {
      await fetch(`${getApiUrl()}/api/customers/from-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: order.customerName,
          phone: order.customerPhone,
          productName: order.productName,
          quantity: order.quantity,
          total: order.totalPrice,
          status: status,
        }),
      });
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const confirmValidate = (order: Order) => {
    setConfirmModal({
      visible: true,
      title: t('orders.confirmOrder'),
      message: `${t('common.confirm')} ${order.customerName} - "${order.productName}"?`,
      type: 'validate',
      onConfirm: () => {
        updateOrderStatus(order.id, 'completed');
        setConfirmModal(prev => ({ ...prev, visible: false }));
      }
    });
  };

  const confirmCancel = (order: Order) => {
    setConfirmModal({
      visible: true,
      title: t('common.cancel'),
      message: `${t('orders.deleteConfirm')}`,
      type: 'cancel',
      onConfirm: () => {
        updateOrderStatus(order.id, 'cancelled');
        setConfirmModal(prev => ({ ...prev, visible: false }));
      }
    });
  };

  const deleteAllOrders = () => {
    if (orders.length === 0) {
      showWarning(t('orders.noOrders'));
      return;
    }
    
    setConfirmModal({
      visible: true,
      title: t('orders.deleteAllOrders'),
      message: t('orders.deleteAllConfirm'),
      type: 'delete',
      onConfirm: () => {
        setOrders([]);
        setConfirmModal(prev => ({ ...prev, visible: false }));
        showSuccess(t('orders.allOrdersDeleted'));
      }
    });
  };

  const addNewOrder = () => {
    if (!newOrder.customerName.trim()) {
      showError(t('orders.customerRequired'));
      return;
    }
    if (!newOrder.productName) {
      showError(t('orders.productRequired'));
      return;
    }
    
    const product = products.find(p => p.name === newOrder.productName);
    const order: Order = {
      id: Date.now().toString(),
      customerName: newOrder.customerName.trim(),
      customerPhone: newOrder.customerPhone.trim(),
      productName: newOrder.productName,
      quantity: parseInt(newOrder.quantity) || 1,
      totalPrice: (product?.price || 0) * (parseInt(newOrder.quantity) || 1),
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      notes: newOrder.notes.trim(),
    };
    
    setOrders(prev => [order, ...prev]);
    setNewOrder({ customerName: '', customerPhone: '', productName: '', quantity: '1', notes: '' });
    setShowNewOrder(false);
    showSuccess(t('orders.orderCreated'));
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => setSelectedOrder(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.customerInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {item.customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName}</Text>
            <View style={styles.phoneRow}>
              <Feather name="phone" size={12} color={colors.textMuted} />
              <Text style={[styles.customerPhone, { color: colors.textMuted }]}>{item.customerPhone}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.warningSoft }]}>
          <Feather name="clock" size={12} color={colors.warning} />
          <Text style={[styles.statusText, { color: colors.warning }]}>{t('orders.pending')}</Text>
        </View>
      </View>

      <View style={[styles.productRow, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.productIcon, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="hanger" size={18} color={colors.primary} />
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{item.productName}</Text>
          <Text style={[styles.productQty, { color: colors.textMuted }]}>{t('orders.quantity')}: {item.quantity}</Text>
        </View>
        <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(item.totalPrice)}</Text>
      </View>

      {item.notes ? (
        <View style={styles.notesRow}>
          <Feather name="message-circle" size={14} color={colors.textSec} />
          <Text style={[styles.notes, { color: colors.textSec }]} numberOfLines={2}>{item.notes}</Text>
        </View>
      ) : null}

      <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
        <View style={styles.dateRow}>
          <Feather name="calendar" size={13} color={colors.textMuted} />
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickBtn, { backgroundColor: colors.successSoft }]}
            onPress={() => callCustomer(item.customerPhone)}
          >
            <Feather name="phone-call" size={16} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickBtn, { backgroundColor: 'rgba(37, 211, 102, 0.1)' }]}
            onPress={() => whatsappCustomer(item.customerPhone, item.productName)}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('orders.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {orders.length} {t('orders.pending').toLowerCase()}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {orders.length > 0 && (
            <TouchableOpacity 
              style={[styles.headerBtn, { backgroundColor: colors.dangerSoft }]} 
              onPress={deleteAllOrders}
            >
              <Feather name="trash-2" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.addOrderBtn, { backgroundColor: colors.primary }]} 
            onPress={() => setShowNewOrder(true)}
          >
            <Feather name="plus" size={18} color="#FFF" />
            <Text style={styles.addOrderText}>{t('orders.newOrder')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('common.search') + '...'}
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

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.warningSoft }]}>
          <Feather name="clock" size={20} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.warning }]}>{orders.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSec }]}>{t('orders.pending')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.primarySoft }]}>
          <Feather name="shopping-bag" size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatPrice(orders.reduce((sum, o) => sum + o.totalPrice, 0))}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSec }]}>{t('common.total')}</Text>
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.successSoft }]}>
              <Feather name="check-circle" size={40} color={colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('common.success')}!</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t('orders.noOrders')}
            </Text>
          </View>
        }
      />

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            
            {selectedOrder && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[styles.detailAvatar, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.detailAvatarText, { color: colors.primary }]}>
                      {selectedOrder.customerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailCustomer}>
                    <Text style={[styles.detailName, { color: colors.text }]}>{selectedOrder.customerName}</Text>
                    <Text style={[styles.detailPhone, { color: colors.textMuted }]}>{selectedOrder.customerPhone}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                    <Feather name="x" size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.detailProduct, { backgroundColor: colors.surfaceAlt }]}>
                  <MaterialCommunityIcons name="hanger" size={24} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.detailProductName, { color: colors.text }]}>{selectedOrder.productName}</Text>
                    <Text style={[styles.detailProductQty, { color: colors.textMuted }]}>{t('orders.quantity')}: {selectedOrder.quantity}</Text>
                  </View>
                  <Text style={[styles.detailPrice, { color: colors.primary }]}>{formatPrice(selectedOrder.totalPrice)}</Text>
                </View>

                {selectedOrder.notes && (
                  <View style={[styles.detailNotes, { backgroundColor: colors.surfaceAlt }]}>
                    <Feather name="file-text" size={16} color={colors.textSec} />
                    <Text style={[styles.detailNotesText, { color: colors.textSec }]}>{selectedOrder.notes}</Text>
                  </View>
                )}

                <View style={styles.contactBtns}>
                  <TouchableOpacity 
                    style={[styles.contactBtn, { backgroundColor: colors.success }]}
                    onPress={() => callCustomer(selectedOrder.customerPhone)}
                  >
                    <Feather name="phone" size={18} color="#FFF" />
                    <Text style={styles.contactBtnText}>{t('common.call')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => whatsappCustomer(selectedOrder.customerPhone, selectedOrder.productName)}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                    <Text style={styles.contactBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionBtns}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.danger }]}
                    onPress={() => { setSelectedOrder(null); confirmCancel(selectedOrder); }}
                  >
                    <Feather name="x-circle" size={18} color={colors.danger} />
                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.validateBtn, { backgroundColor: colors.success }]}
                    onPress={() => { setSelectedOrder(null); confirmValidate(selectedOrder); }}
                  >
                    <Feather name="check-circle" size={18} color="#FFF" />
                    <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{t('common.validate')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* New Order Modal */}
      <Modal visible={showNewOrder} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.newOrderModal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('orders.newOrder')}</Text>
              <TouchableOpacity onPress={() => setShowNewOrder(false)}>
                <Feather name="x" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('orders.customerName')} *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Feather name="user" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ex: Fatima Benali"
                  placeholderTextColor={colors.textMuted}
                  value={newOrder.customerName}
                  onChangeText={(text) => setNewOrder({ ...newOrder, customerName: text })}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('orders.phone')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Feather name="phone" size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ex: 0555 12 34 56"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={newOrder.customerPhone}
                  onChangeText={(text) => setNewOrder({ ...newOrder, customerPhone: text })}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('orders.product')} *</Text>
              {products.length === 0 ? (
                <Text style={[styles.noProducts, { color: colors.textMuted }]}>{t('orders.noProductsAvailable')}</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productPicker}>
                  {products.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.productOption,
                        { 
                          backgroundColor: newOrder.productName === p.name ? colors.primary : colors.surfaceAlt, 
                          borderColor: newOrder.productName === p.name ? colors.primary : colors.border 
                        }
                      ]}
                      onPress={() => setNewOrder({ ...newOrder, productName: p.name })}
                    >
                      <Text 
                        style={[styles.productOptionText, { color: newOrder.productName === p.name ? '#FFF' : colors.text }]} 
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                      <Text style={[styles.productOptionPrice, { color: newOrder.productName === p.name ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                        {formatPrice(p.price)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('orders.quantity')}</Text>
              <View style={[styles.qtyWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: colors.border }]}
                  onPress={() => setNewOrder({ ...newOrder, quantity: Math.max(1, parseInt(newOrder.quantity) - 1).toString() })}
                >
                  <Feather name="minus" size={18} color={colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.qtyInput, { color: colors.text }]}
                  value={newOrder.quantity}
                  onChangeText={(text) => setNewOrder({ ...newOrder, quantity: text })}
                  keyboardType="number-pad"
                />
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setNewOrder({ ...newOrder, quantity: (parseInt(newOrder.quantity) + 1).toString() })}
                >
                  <Feather name="plus" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSec }]}>{t('orders.notes')}</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, styles.textArea, { color: colors.text }]}
                  placeholder="Taille, couleur, adresse..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={newOrder.notes}
                  onChangeText={(text) => setNewOrder({ ...newOrder, notes: text })}
                />
              </View>
              
              <View style={{ height: 20 }} />
            </ScrollView>

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.success }]} onPress={addNewOrder}>
              <Feather name="check" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>{t('orders.createOrder')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal visible={confirmModal.visible} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContent, { backgroundColor: colors.surface }]}>
            <View style={[
              styles.alertIconWrapper, 
              { backgroundColor: confirmModal.type === 'validate' ? colors.successSoft : colors.dangerSoft }
            ]}>
              <Feather 
                name={confirmModal.type === 'validate' ? 'check-circle' : confirmModal.type === 'cancel' ? 'x-circle' : 'trash-2'} 
                size={32} 
                color={confirmModal.type === 'validate' ? colors.success : colors.danger} 
              />
            </View>
            <Text style={[styles.alertTitle, { color: colors.text }]}>{confirmModal.title}</Text>
            <Text style={[styles.alertMessage, { color: colors.textSec }]}>{confirmModal.message}</Text>
            
            <View style={styles.alertBtns}>
              <TouchableOpacity 
                style={[styles.alertBtn, { backgroundColor: colors.surfaceAlt }]} 
                onPress={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={[styles.alertBtnText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.alertBtn, { backgroundColor: confirmModal.type === 'validate' ? colors.success : colors.danger }]} 
                onPress={confirmModal.onConfirm}
              >
                <Text style={styles.alertBtnTextWhite}>{t('common.confirm')}</Text>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addOrderBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 12, 
    gap: 6 
  },
  addOrderText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

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

  // Stats
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  statCard: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 14, 
    gap: 10 
  },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 12 },

  // List
  listContent: { padding: 16, paddingBottom: 100 },

  // Order Card
  orderCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  customerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  customerDetails: { marginLeft: 12, flex: 1 },
  customerName: { fontSize: 15, fontWeight: '600' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  customerPhone: { fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },

  productRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 10 },
  productIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '500' },
  productQty: { fontSize: 12, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700' },

  notesRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, gap: 8 },
  notes: { flex: 1, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },

  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 12 },
  quickActions: { flexDirection: 'row', gap: 8 },
  quickBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  emptyText: { fontSize: 14 },

  // Detail Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  detailAvatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  detailAvatarText: { fontSize: 24, fontWeight: '700' },
  detailCustomer: { flex: 1, marginLeft: 14 },
  detailName: { fontSize: 18, fontWeight: '700' },
  detailPhone: { fontSize: 14, marginTop: 2 },
  detailProduct: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 12 },
  detailProductName: { fontSize: 15, fontWeight: '600' },
  detailProductQty: { fontSize: 13, marginTop: 2 },
  detailPrice: { fontSize: 18, fontWeight: '700' },
  detailNotes: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, marginBottom: 16, gap: 10 },
  detailNotesText: { flex: 1, fontSize: 14, lineHeight: 20 },
  contactBtns: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  contactBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  actionBtns: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 8 },
  cancelBtn: { borderWidth: 2, backgroundColor: 'transparent' },
  validateBtn: {},
  actionBtnText: { fontWeight: '600', fontSize: 15 },

  // New Order Modal
  newOrderModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50, gap: 10 },
  input: { flex: 1, fontSize: 15 },
  textAreaWrapper: { height: 90, alignItems: 'flex-start', paddingVertical: 12 },
  textArea: { textAlignVertical: 'top', height: '100%' },
  noProducts: { fontSize: 14, fontStyle: 'italic', marginTop: 8 },
  productPicker: { marginTop: 8 },
  productOption: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginRight: 10, minWidth: 140 },
  productOptionText: { fontSize: 13, fontWeight: '500' },
  productOptionPrice: { fontSize: 12, marginTop: 4 },
  qtyWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 6 },
  qtyBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 14, gap: 8 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

  // Alert Modal
  alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertContent: { width: '100%', maxWidth: 320, borderRadius: 20, padding: 24, alignItems: 'center' },
  alertIconWrapper: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  alertTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  alertMessage: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  alertBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  alertBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  alertBtnText: { fontSize: 15, fontWeight: '600' },
  alertBtnTextWhite: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});

export default OrderListScreen;
