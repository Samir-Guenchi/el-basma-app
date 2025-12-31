import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useProductStore, selectFilteredProducts } from '@/store';
import { useTranslatedText } from '@/hooks';
import { Product, AvailabilityStatus } from '@/types';
import { isRTL, getFlexDirection, getTextAlign } from '@/utils/rtl';

interface ProductListProps {
  onProductPress: (product: Product) => void;
  onAddPress?: () => void;
  showAddButton?: boolean;
}

const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  'in-stock': '#4CAF50',
  'limited': '#FF9800',
  'out-of-stock': '#F44336',
};

export const ProductList: React.FC<ProductListProps> = ({
  onProductPress,
  onAddPress,
  showAddButton = false,
}) => {
  const { t } = useTranslation();
  const { getText } = useTranslatedText();
  const [searchQuery, setSearchQuery] = useState('');

  const { isLoading, fetchProducts, setFilters, filters } = useProductStore();
  const products = useProductStore(selectFilteredProducts);

  const rtl = isRTL();

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const name = getText(product.name).toLowerCase();
      const sku = product.sku.toLowerCase();
      return name.includes(query) || sku.includes(query);
    });
  }, [products, searchQuery, getText]);

  const handleRefresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setFilters({ ...filters, search: text });
  }, [filters, setFilters]);

  const getAvailabilityLabel = (status: AvailabilityStatus): string => {
    switch (status) {
      case 'in-stock':
        return t('products.inStock');
      case 'limited':
        return t('products.limited');
      case 'out-of-stock':
        return t('products.outOfStock');
    }
  };

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      const todayStock = item.stockByDate.find(
        (s) => s.date === new Date().toISOString().split('T')[0]
      );

      return (
        <TouchableOpacity
          style={[styles.productCard, rtl && styles.productCardRTL]}
          onPress={() => onProductPress(item)}
          accessibilityRole="button"
          accessibilityLabel={`${getText(item.name)}, ${getAvailabilityLabel(item.availabilityStatus)}`}
        >
          <Image
            source={{ uri: item.images[0] || 'https://via.placeholder.com/100' }}
            style={styles.productImage}
            accessibilityIgnoresInvertColors
          />
          <View style={styles.productInfo}>
            <Text
              style={[styles.productName, { textAlign: getTextAlign() }]}
              numberOfLines={2}
            >
              {getText(item.name)}
            </Text>
            <Text style={[styles.productSku, { textAlign: getTextAlign() }]}>
              SKU: {item.sku}
            </Text>
            <View style={[styles.priceRow, { flexDirection: getFlexDirection() }]}>
              <Text style={styles.productPrice}>
                {item.price.toLocaleString()} {item.currency}
              </Text>
              {todayStock && (
                <Text style={styles.stockCount}>
                  {t('calendar.quantity')}: {todayStock.quantity}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.availabilityBadge,
                { backgroundColor: AVAILABILITY_COLORS[item.availabilityStatus] },
              ]}
            >
              <Text style={styles.availabilityText}>
                {getAvailabilityLabel(item.availabilityStatus)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [getText, onProductPress, rtl, t]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.searchContainer, rtl && styles.searchContainerRTL]}>
        <TextInput
          style={[styles.searchInput, { textAlign: getTextAlign() }]}
          placeholder={t('common.search')}
          value={searchQuery}
          onChangeText={handleSearch}
          accessibilityLabel={t('common.search')}
        />
      </View>
      {showAddButton && onAddPress && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPress}
          accessibilityRole="button"
          accessibilityLabel={t('products.addProduct')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('products.noProducts')}</Text>
    </View>
  );

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        accessibilityRole="list"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#E91E63',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productCardRTL: {
    flexDirection: 'row-reverse',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  priceRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  stockCount: {
    fontSize: 12,
    color: '#757575',
  },
  availabilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
});

export default ProductList;
