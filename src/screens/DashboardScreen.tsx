import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useProductStore, useSettingsStore } from '@/store';
import { Product } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.43.220:3001';
  }
  return 'http://localhost:3001';
};
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();

const getImageUrl = (uri: string): string => {
  if (!uri) return '';
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  if (uri.startsWith('/uploads/') || uri.startsWith('/')) return `${API_URL}${uri}`;
  return uri;
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { products, deleteProduct, fetchProducts } = useProductStore();
  const { themeMode, lowStockThreshold, getAllCategories, fetchSettings, fetchCategories } = useSettingsStore();
  const isDark = themeMode === 'dark';
  const categories = getAllCategories();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCategories();
    fetchProducts();
    
    // Auto-refresh every 10 seconds for multi-user sync
    const interval = setInterval(() => {
      fetchProducts();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  // Stats
  const totalProducts = products.length;
  const inStockCount = products.filter(p => p.inStock).length;
  const lowStockCount = products.filter(p => p.quantity <= lowStockThreshold && p.quantity > 0).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const recentProducts = [...products].slice(0, 6);

  const colors = {
    bg: isDark ? '#121212' : '#F5F5F5',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSec: isDark ? '#B0B0B0' : '#555555',
    textMuted: isDark ? '#808080' : '#666666',
    border: isDark ? '#2A2A2A' : '#E0E0E0',
    primary: '#C13B5E',
    primarySoft: isDark ? 'rgba(193, 59, 94, 0.15)' : 'rgba(193, 59, 94, 0.1)',
    success: '#1E8449',
    successSoft: isDark ? 'rgba(30, 132, 73, 0.15)' : 'rgba(30, 132, 73, 0.1)',
    warning: '#B7770A',
    warningSoft: isDark ? 'rgba(183, 119, 10, 0.15)' : 'rgba(183, 119, 10, 0.1)',
    danger: '#C0392B',
    accent: '#7D3C98',
  };

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' DA';

  const handleDelete = (product: Product) => {
    const doDelete = () => deleteProduct(product.id);
    if (Platform.OS === 'web') {
      if (window.confirm(`${t('common.delete')} "${product.name}" ?`)) doDelete();
    } else {
      Alert.alert(t('common.confirm'), `${t('common.delete')} "${product.name}" ?`, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerLeft}>
            <Image source={require('../../assets/logo.jpg')} style={styles.logo} />
            <View>
              <Text style={[styles.shopName, { color: colors.text }]}>Djellaba El Basma</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSec} />
                <Text style={[styles.locationText, { color: colors.textSec }]}>{t('dashboard.location')}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.notifBtn, { backgroundColor: colors.primarySoft }]}
            onPress={() => navigation.navigate('Orders')}
            accessibilityLabel={t('orders.title')}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View 
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            accessibilityLabel={`${totalProducts} ${t('dashboard.products')}`}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="hanger" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalProducts}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('dashboard.products')}</Text>
          </View>

          <View 
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            accessibilityLabel={`${inStockCount} ${t('dashboard.inStock')}`}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.successSoft }]}>
              <Feather name="check-circle" size={22} color={colors.success} />
            </View>
            <Text style={[styles.statValue, { color: colors.success }]}>{inStockCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('dashboard.inStock')}</Text>
          </View>

          <View 
            style={[styles.statCard, { backgroundColor: colors.surface }]}
            accessibilityLabel={`${lowStockCount} ${t('dashboard.lowStock')}`}
          >
            <View style={[styles.statIcon, { backgroundColor: colors.warningSoft }]}>
              <Feather name="alert-triangle" size={22} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.warning }]}>{lowStockCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('dashboard.lowStock')}</Text>
          </View>
        </View>

        {/* Value Card */}
        <View style={[styles.valueCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.valueLabel}>{t('dashboard.stockValue')}</Text>
            <Text style={styles.valueAmount}>{formatPrice(totalValue)}</Text>
          </View>
          <View style={styles.valueIcon}>
            <Ionicons name="wallet-outline" size={32} color="rgba(255,255,255,0.3)" />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.categories')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {categories.map((cat) => {
              const count = products.filter(p => p.category === cat.value).length;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.catCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => navigation.navigate('Home', { screen: 'ProductList' })}
                >
                  <View style={[styles.catIconBox, { backgroundColor: colors.primarySoft }]}>
                    <MaterialCommunityIcons name="tag-outline" size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.catName, { color: colors.text }]}>{cat.value}</Text>
                  <Text style={[styles.catCount, { color: colors.textMuted }]}>{count} {t('dashboard.articles')}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.recentProducts')}</Text>
            <TouchableOpacity 
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate('Home', { screen: 'ProductList' })}
              accessibilityLabel={t('dashboard.seeAll')}
              accessibilityRole="button"
            >
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t('dashboard.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {recentProducts.map((product) => (
              <View key={product.id} style={[styles.productCard, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Home', { screen: 'ProductDetail', params: { productId: product.id } })}
                  activeOpacity={0.9}
                >
                  <View style={styles.productImageBox}>
                    {product.images && product.images.length > 0 ? (
                      <Image source={{ uri: getImageUrl(product.images[0]) }} style={styles.productImage} />
                    ) : (
                      <View style={[styles.productPlaceholder, { backgroundColor: colors.border }]}>
                        <MaterialCommunityIcons name="image-off-outline" size={28} color={colors.textMuted} />
                      </View>
                    )}
                    {!product.inStock && (
                      <View style={styles.soldOutBadge}>
                        <Text style={styles.soldOutText}>{t('dashboard.outOfStock')}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[styles.productCat, { color: colors.textMuted }]}>{product.category}</Text>
                  <Text style={[styles.productPrice, { color: colors.primary }]}>{formatPrice(product.price)}</Text>
                  {/* Stock badge (read-only) */}
                  <View style={[styles.stockBadge, { backgroundColor: product.quantity > lowStockThreshold ? colors.successSoft : colors.warningSoft }]}>
                    <Text style={[styles.stockText, { color: product.quantity > lowStockThreshold ? colors.success : colors.warning }]}>
                      {product.quantity} {t('products.units')}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]}
                    onPress={() => navigation.navigate('Home', { screen: 'ProductEdit', params: { product } })}
                  >
                    <Feather name="edit-2" size={14} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}
                    onPress={() => handleDelete(product)}
                  >
                    <Feather name="trash-2" size={14} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.quickActions')}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Home', { screen: 'ProductEdit', params: { product: undefined } })}
            >
              <Feather name="plus" size={20} color="#FFF" />
              <Text style={styles.quickActionText}>{t('dashboard.newProduct')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('Orders')}
            >
              <Feather name="shopping-bag" size={20} color="#FFF" />
              <Text style={styles.quickActionText}>{t('orders.title')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
  },
  notifBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },

  // Value Card
  valueCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  valueLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 4,
  },
  valueAmount: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  valueIcon: {
    opacity: 0.5,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllBtn: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Categories
  catScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  catCard: {
    width: 110,
    minHeight: 100,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  catIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  catCount: {
    fontSize: 11,
    marginTop: 4,
  },

  // Products
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
  },
  productImageBox: {
    height: 130,
    backgroundColor: '#F0F0F0',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldOutText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
  },
  productCat: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  stockBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Card Actions
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;
