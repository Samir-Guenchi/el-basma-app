import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductStore, useSettingsStore } from '@/store';
import { ProductCategory, Product } from '@/types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const getApiUrl = () => Platform.OS === 'android' ? 'http://192.168.43.220:3001' : 'http://localhost:3001';
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();
const getImageUrl = (uri: string): string => {
  if (!uri) return '';
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `${API_URL}${uri}`;
};

export const ProductListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { products, updateProduct, deleteProduct, fetchProducts } = useProductStore();
  const { themeMode, lowStockThreshold, getAllCategories } = useSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const isDark = themeMode === 'dark';
  const categories = getAllCategories();

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const colors = {
    bg: isDark ? '#121212' : '#F5F5F5',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSec: isDark ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDark ? '#A0A0A0' : '#595959',
    border: isDark ? '#2A2A2A' : '#E8E8E8',
    primary: '#B03052',
    primarySoft: isDark ? 'rgba(176, 48, 82, 0.15)' : 'rgba(176, 48, 82, 0.08)',
    success: '#1E8449',
    successSoft: isDark ? 'rgba(30, 132, 73, 0.15)' : 'rgba(30, 132, 73, 0.08)',
    warning: '#9A7B0A',
    warningSoft: isDark ? 'rgba(243, 156, 18, 0.15)' : 'rgba(243, 156, 18, 0.08)',
    danger: '#E74C3C',
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' DA';

  const handleDelete = (product: Product) => {
    const doDelete = () => deleteProduct(product.id);
    if (Platform.OS === 'web') {
      if (window.confirm(`${t('common.delete')} "${product.name}" ?`)) doDelete();
    } else {
      Alert.alert(t('common.delete'), `${t('common.delete')} "${product.name}" ?`, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const hasImages = item.images && Array.isArray(item.images) && item.images.length > 0;
    const imageUri = hasImages ? getImageUrl(item.images[0]) : null;
    const imageCount = hasImages ? item.images.length : 0;
    
    return (
    <View style={[styles.productCard, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.productImageBox}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.productImage} />
          ) : (
            <View style={[styles.productPlaceholder, { backgroundColor: colors.border }]}>
              <MaterialCommunityIcons name="image-off-outline" size={28} color={colors.textMuted} />
            </View>
          )}
          {!item.inStock && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>{t('dashboard.outOfStock')}</Text>
            </View>
          )}
          {imageCount > 1 && (
            <View style={styles.imageCountBadge}>
              <Feather name="image" size={10} color="#FFF" />
              <Text style={styles.imageCountText}>{imageCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.productCat, { color: colors.textMuted }]}>{item.category}</Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
        {/* Stock indicator */}
        <View style={[styles.stockBadge, { backgroundColor: item.quantity > lowStockThreshold ? colors.successSoft : colors.warningSoft }]}>
          <Text style={[styles.stockText, { color: item.quantity > lowStockThreshold ? colors.success : colors.warning }]}>
            {item.quantity} {t('products.units')}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => navigation.navigate('ProductEdit', { product: item })}
        >
          <Feather name="edit-2" size={14} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}
          onPress={() => handleDelete(item)}
        >
          <Feather name="trash-2" size={14} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{t('products.myProducts')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{products.length} {t('dashboard.articles')}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
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

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ value: 'all', emoji: '', label: t('common.all') }, ...categories.map(c => ({ ...c, label: c.value }))]}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.value;
            const count = item.value === 'all' ? products.length : products.filter(p => p.category === item.value).length;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.surface, 
                    borderColor: isSelected ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => setSelectedCategory(item.value as any)}
              >
                <Text style={[styles.filterText, { color: isSelected ? '#FFF' : colors.text }]}>
                  {item.value === 'all' ? t('common.all') : item.value}
                </Text>
                <View style={[styles.filterCount, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : colors.border }]}>
                  <Text style={[styles.filterCountText, { color: isSelected ? '#FFF' : colors.textMuted }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="package-variant" size={64} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('products.noProducts')}</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery ? t('common.noData') : t('products.addProduct')}
            </Text>
          </View>
        }
        renderItem={renderProduct}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.success }]}
        onPress={() => navigation.navigate('ProductEdit', { product: undefined })}
      >
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },

  // Filter
  filterContainer: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  filterCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  row: {
    gap: 12,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 4,
  },

  // Product Card
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
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
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  imageCountText: {
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
    lineHeight: 18,
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
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default ProductListScreen;
