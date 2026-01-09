import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductStore, useSettingsStore } from '@/store';
import { ProductStackParamList } from '@/navigation/types';

const { width } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<ProductStackParamList>;
type RouteProps = RouteProp<ProductStackParamList, 'ProductDetail'>;

const getApiUrl = () => Platform.OS === 'android' ? 'http://192.168.43.220:3001' : 'http://localhost:3001';
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();
const getImageUrl = (uri: string): string => {
  if (!uri) return '';
  // Data URLs (base64) - use directly without modification
  if (uri.startsWith('data:')) return uri;
  // Already full URLs - use directly
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('blob:')) return uri;
  // Relative URL - prepend API URL
  return `${API_URL}${uri.startsWith('/') ? '' : '/'}${uri}`;
};

interface PublishingStatus {
  facebook: { published: boolean; publishedAt: string | null };
  instagram: { published: boolean; publishedAt: string | null };
  tiktok: { published: boolean; publishedAt: string | null };
}

export const ProductDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { t } = useTranslation();
  const { productId } = route.params;
  const { themeMode, lowStockThreshold } = useSettingsStore();
  const { products, deleteProduct, updateProduct } = useProductStore();
  const isDark = themeMode === 'dark';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [publishingStatus, setPublishingStatus] = useState<PublishingStatus | null>(null);

  const product = products.find(p => p.id === productId);

  // Fetch publishing status
  useEffect(() => {
    if (productId) {
      fetch(`${API_URL}/api/publishing/products/${productId}/status`)
        .then(res => res.json())
        .then(data => setPublishingStatus(data))
        .catch(err => console.log('Publishing status error:', err));
    }
  }, [productId]);

  const colors = {
    bg: isDark ? '#121212' : '#F5F5F5',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
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
  };

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' DA';

  const handleEdit = () => {
    if (product) navigation.navigate('ProductEdit', { product });
  };

  const handleDelete = () => {
    Alert.alert(t('common.delete'), `${t('common.delete')} ?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { deleteProduct(productId); navigation.goBack(); } },
    ]);
  };

  const handleQty = (delta: number) => {
    if (!product) return;
    const newQty = Math.max(0, product.quantity + delta);
    updateProduct(product.id, { quantity: newQty, inStock: newQty > 0 });
  };

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.notFound}>
          <MaterialCommunityIcons name="package-variant" size={64} color={colors.border} />
          <Text style={[styles.notFoundText, { color: colors.text }]}>{t('products.notFound')}</Text>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Parse images if they're a string (JSON)
  const productImages: string[] = React.useMemo(() => {
    if (!product) return [];
    let images: any = product.images;
    
    // If images is a string, try to parse it
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch {
        images = images ? [images] : [];
      }
    }
    
    // Ensure it's an array
    if (!Array.isArray(images)) {
      images = images ? [images] : [];
    }
    
    return images as string[];
  }, [product]);

  const hasImages = productImages.length > 0;
  const stockStatus = product.quantity === 0 ? 'out' : product.quantity <= lowStockThreshold ? 'low' : 'ok';
  const inventory = (product as any).inventory || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
            {hasImages && productImages[currentImageIndex] ? (
              Platform.OS === 'web' ? (
                <img 
                  src={getImageUrl(productImages[currentImageIndex])} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  alt={product.name}
                />
              ) : (
                <Image source={{ uri: getImageUrl(productImages[currentImageIndex]) }} style={styles.productImage} resizeMode="cover" />
              )
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
                <MaterialCommunityIcons name="image-off-outline" size={48} color={colors.textMuted} />
              </View>
            )}
            {!product.inStock && (
              <View style={styles.soldOutBadge}>
                <Text style={styles.soldOutText}>{t('dashboard.outOfStock')}</Text>
              </View>
            )}
          </View>

          {/* Image Thumbnails */}
          {hasImages && productImages.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll} contentContainerStyle={styles.thumbContainer}>
              {productImages.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.thumb, { borderColor: currentImageIndex === idx ? colors.primary : colors.border }]}
                  onPress={() => setCurrentImageIndex(idx)}
                >
                  {Platform.OS === 'web' ? (
                    <img src={getImageUrl(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  ) : (
                    <Image source={{ uri: getImageUrl(img) }} style={styles.thumbImage} resizeMode="cover" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Back Button */}
          <TouchableOpacity style={[styles.floatBackBtn, { backgroundColor: colors.surface }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{product.category}</Text>
            </View>
            <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
            
            {/* Pricing Section */}
            <View style={styles.pricingSection}>
              <View style={styles.priceRow}>
                <View style={[styles.priceTag, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.priceLabel, { color: colors.primary }]}>{t('products.retail')}</Text>
                </View>
                <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(product.price)}</Text>
              </View>
              {(product as any).priceWholesale && (
                <View style={styles.priceRow}>
                  <View style={[styles.priceTag, { backgroundColor: colors.successSoft }]}>
                    <Text style={[styles.priceLabel, { color: colors.success }]}>{t('products.wholesale')}</Text>
                  </View>
                  <View style={styles.wholesalePriceContainer}>
                    <Text style={[styles.wholesalePrice, { color: colors.success }]}>{formatPrice((product as any).priceWholesale)}</Text>
                    <Text style={[styles.wholesaleHint, { color: colors.textMuted }]}>
                      ({(product as any).minWholesaleQty || 3}+ {t('products.piecesOrMore')})
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Quick Stock Control */}
          <View style={[styles.stockCard, { backgroundColor: colors.surface }]}>
            <View style={styles.stockInfo}>
              <View style={[styles.stockIndicator, { backgroundColor: stockStatus === 'ok' ? colors.successSoft : stockStatus === 'low' ? colors.warningSoft : colors.dangerSoft }]}>
                <Feather name={stockStatus === 'ok' ? 'check-circle' : stockStatus === 'low' ? 'alert-triangle' : 'x-circle'} size={18} color={stockStatus === 'ok' ? colors.success : stockStatus === 'low' ? colors.warning : colors.danger} />
              </View>
              <View>
                <Text style={[styles.stockLabel, { color: colors.textMuted }]}>{t('products.availableStock')}</Text>
                <Text style={[styles.stockValue, { color: colors.text }]}>{product.quantity} {t('products.units')}</Text>
              </View>
            </View>
            <View style={styles.stockControls}>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.warningSoft }]} onPress={() => handleQty(-1)}>
                <Feather name="minus" size={18} color={colors.warning} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.successSoft }]} onPress={() => handleQty(1)}>
                <Feather name="plus" size={18} color={colors.success} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('products.description')}</Text>
              <Text style={[styles.description, { color: colors.textSec }]}>{product.description}</Text>
            </View>
          )}

          {/* Inventory Details */}
          {inventory.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('products.detailedStock')}</Text>
              {inventory.map((colorItem: any, idx: number) => (
                <View key={idx} style={[styles.inventoryCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.inventoryHeader}>
                    <View style={[styles.colorDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.colorName, { color: colors.text }]}>{colorItem.color}</Text>
                    <Text style={[styles.colorTotal, { color: colors.textMuted }]}>
                      {colorItem.sizes?.reduce((t: number, s: any) => t + s.qty, 0) || 0} {t('products.units')}
                    </Text>
                  </View>
                  <View style={styles.sizesGrid}>
                    {colorItem.sizes?.map((sz: any, sIdx: number) => (
                      <View key={sIdx} style={[styles.sizeItem, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.sizeLabel, { color: colors.textMuted }]}>{sz.size}</Text>
                        <Text style={[styles.sizeQty, { color: colors.text }]}>{sz.qty}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Colors & Sizes (if no inventory) */}
          {inventory.length === 0 && (
            <>
              {product.colors.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('products.colors')}</Text>
                  <View style={styles.tagsRow}>
                    {product.colors.map((color, index) => (
                      <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.tagText, { color: colors.text }]}>{color}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {product.sizes.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('products.sizes')}</Text>
                  <View style={styles.tagsRow}>
                    {product.sizes.map((size, index) => (
                      <View key={index} style={[styles.tag, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.tagText, { color: colors.text }]}>{size}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Website Publishing Status */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('products.websiteStatus') || 'Site Web'}</Text>
            <View style={[styles.websiteStatusCard, { backgroundColor: (product as any).publishedOnWebsite ? colors.successSoft : colors.surface, borderColor: (product as any).publishedOnWebsite ? colors.success : colors.border }]}>
              <View style={[styles.websiteStatusIcon, { backgroundColor: (product as any).publishedOnWebsite ? colors.success : colors.textMuted }]}>
                <Feather name="globe" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.websiteStatusTitle, { color: colors.text }]}>
                  {(product as any).publishedOnWebsite 
                    ? (t('products.publishedOnWebsite') || 'Publié sur le site web')
                    : (t('products.notPublishedOnWebsite') || 'Non publié sur le site web')}
                </Text>
                <Text style={[styles.websiteStatusHint, { color: colors.textMuted }]}>
                  {(product as any).publishedOnWebsite 
                    ? (t('products.visibleToCustomers') || 'Visible par les clients')
                    : (t('products.notVisibleToCustomers') || 'Non visible par les clients')}
                </Text>
              </View>
              <View style={[styles.websiteStatusBadge, { backgroundColor: (product as any).publishedOnWebsite ? colors.success : colors.textMuted }]}>
                <Feather name={(product as any).publishedOnWebsite ? 'check' : 'x'} size={14} color="#FFF" />
              </View>
            </View>
          </View>

          {/* Publishing Status */}
          {publishingStatus && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('products.publishStatus')}</Text>
              <View style={[styles.publishCard, { backgroundColor: colors.surface }]}>
                {[
                  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
                  { key: 'instagram', label: 'Instagram', color: '#E4405F' },
                  { key: 'tiktok', label: 'TikTok', color: '#000000' },
                ].map((platform, idx) => {
                  const status = publishingStatus[platform.key as keyof PublishingStatus];
                  return (
                    <View key={platform.key}>
                      {idx > 0 && <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />}
                      <View style={styles.publishRow}>
                        <View style={[styles.platformDot, { backgroundColor: platform.color }]} />
                        <Text style={[styles.platformLabel, { color: colors.text }]}>{platform.label}</Text>
                        <View style={[styles.publishBadge, { backgroundColor: status?.published ? colors.successSoft : colors.bg }]}>
                          <Feather name={status?.published ? 'check' : 'x'} size={12} color={status?.published ? colors.success : colors.textMuted} />
                          <Text style={[styles.publishBadgeText, { color: status?.published ? colors.success : colors.textMuted }]}>
                            {status?.published ? t('products.published') : t('products.notPublished')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('products.info')}</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <View style={styles.infoRow}>
                <Feather name="calendar" size={16} color={colors.textMuted} />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('products.createdAt')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{new Date(product.createdAt).toLocaleDateString('fr-FR')}</Text>
              </View>
              <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <Feather name="edit-3" size={16} color={colors.textMuted} />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('products.updatedAt')}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{new Date(product.updatedAt).toLocaleDateString('fr-FR')}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.dangerSoft }]} onPress={handleDelete}>
              <Feather name="trash-2" size={18} color={colors.danger} />
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>{t('common.delete')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]} onPress={handleEdit}>
              <Feather name="edit-2" size={18} color="#FFF" />
              <Text style={styles.editBtnText}>{t('common.edit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notFoundText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 24 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  backBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },

  // Image Section
  imageSection: { position: 'relative' },
  imageContainer: { height: 320, width: '100%' },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  soldOutBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(231, 76, 60, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  soldOutText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  floatBackBtn: { position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  thumbScroll: { position: 'absolute', bottom: 16, left: 0, right: 0 },
  thumbContainer: { paddingHorizontal: 16, gap: 8 },
  thumb: { width: 56, height: 56, borderRadius: 10, borderWidth: 2, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },

  // Content
  content: { padding: 20 },
  header: { marginBottom: 20 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 10 },
  categoryText: { fontWeight: '600', fontSize: 12, textTransform: 'capitalize' },
  productName: { fontSize: 24, fontWeight: '700', marginBottom: 12, lineHeight: 30 },
  
  // Pricing
  pricingSection: { gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  priceLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  price: { fontSize: 26, fontWeight: '700' },
  wholesalePriceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  wholesalePrice: { fontSize: 22, fontWeight: '700' },
  wholesaleHint: { fontSize: 12 },

  // Stock Card
  stockCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, marginBottom: 24 },
  stockInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stockIndicator: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stockLabel: { fontSize: 12 },
  stockValue: { fontSize: 16, fontWeight: '700' },
  stockControls: { flexDirection: 'row', gap: 8 },
  qtyBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 24 },

  // Inventory
  inventoryCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  inventoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  colorName: { flex: 1, fontSize: 15, fontWeight: '600' },
  colorTotal: { fontSize: 13 },
  sizesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeItem: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center', minWidth: 50 },
  sizeLabel: { fontSize: 11, marginBottom: 2 },
  sizeQty: { fontSize: 15, fontWeight: '700' },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  tagText: { fontSize: 14, fontWeight: '500' },

  // Publishing
  websiteStatusCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  websiteStatusIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  websiteStatusTitle: { fontSize: 15, fontWeight: '600' },
  websiteStatusHint: { fontSize: 12, marginTop: 2 },
  websiteStatusBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  publishCard: { borderRadius: 12, padding: 14 },
  publishRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  platformDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  platformLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  publishBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  publishBadgeText: { fontSize: 12, fontWeight: '500' },

  // Info
  infoCard: { borderRadius: 12, padding: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  infoDivider: { height: 1, marginVertical: 12 },

  // Actions
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
  editBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  editBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});

export default ProductDetailScreen;
