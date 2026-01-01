import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, useProductStore } from '@/store';
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

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  quantity: number;
  publishedPlatforms: string[];
}

interface PublishingStatus {
  facebook: { published: boolean; caption: string | null; publishedAt: string | null };
  instagram: { published: boolean; caption: string | null; publishedAt: string | null };
  tiktok: { published: boolean; caption: string | null; publishedAt: string | null };
}

interface Stats {
  totalProducts: number;
  publishedFacebook: number;
  publishedInstagram: number;
  publishedTiktok: number;
  unpublished: number;
}

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: '📘', color: '#1877F2' },
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#E4405F' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', color: '#000000' },
];

export const PublishingScreen: React.FC = () => {
  const { t } = useTranslation();
  const { themeMode } = useSettingsStore();
  const { showToast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [publishingStatus, setPublishingStatus] = useState<PublishingStatus | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState<string | null>(null);
  const [captions, setCaptions] = useState<{ [key: string]: string }>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [captionLanguage, setCaptionLanguage] = useState('fr');

  // Language options
  const LANGUAGES = [
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'ar', label: '🇸🇦 العربية' },
    { code: 'dz', label: '🇩🇿 Darija' },
    { code: 'en', label: '🇬🇧 English' },
    { code: 'multi', label: '🌐 Multi' },
  ];

  // Get products from local store as fallback
  const localProducts = useProductStore(state => state.products);

  const isDark = themeMode === 'dark';
  const colors = {
    background: isDark ? '#0D0D1A' : '#FAFAFA',
    surface: isDark ? '#1A1A2E' : '#FFFFFF',
    text: isDark ? '#F5F5F7' : '#1A1A2E',
    textSecondary: isDark ? '#B8B8C7' : '#6B6B80',
    border: isDark ? '#2D2D45' : '#E8E8EF',
    primary: isDark ? '#F48FB1' : '#E91E63',
    success: '#4CAF50',
    warning: '#FF9800',
  };

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/publishing/products`),
        fetch(`${API_URL}/api/publishing/stats`),
      ]);
      
      const productsData = await productsRes.json();
      const statsData = await statsRes.json();
      
      // If backend returns products, use them
      if (Array.isArray(productsData) && productsData.length > 0) {
        setProducts(productsData);
      } else {
        // Fallback to local products
        const localWithPublishing = localProducts.map(p => ({
          ...p,
          publishedPlatforms: []
        }));
        setProducts(localWithPublishing);
      }
      
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use local products as fallback
      const localWithPublishing = localProducts.map(p => ({
        ...p,
        publishedPlatforms: []
      }));
      setProducts(localWithPublishing);
      setStats({
        totalProducts: localProducts.length,
        publishedFacebook: 0,
        publishedInstagram: 0,
        publishedTiktok: 0,
        unpublished: localProducts.length
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, t, localProducts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openProductModal = async (product: Product) => {
    setSelectedProduct(product);
    setSelectedPlatforms([]);
    setCaptions({});
    setModalVisible(true);
    
    // Fetch publishing status
    try {
      const res = await fetch(`${API_URL}/api/publishing/products/${product.id}/status`);
      const status = await res.json();
      setPublishingStatus(status);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const generateCaption = async (platform: string) => {
    if (!selectedProduct) return;
    
    setGeneratingCaption(platform);
    try {
      const res = await fetch(`${API_URL}/api/publishing/products/${selectedProduct.id}/preview-caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, language: captionLanguage }),
      });
      const data = await res.json();
      
      if (data.success) {
        setCaptions(prev => ({ ...prev, [platform]: data.caption }));
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      showToast('Erreur génération caption', 'error');
    } finally {
      setGeneratingCaption(null);
    }
  };

  const regenerateCaption = async (platform: string) => {
    // Clear existing caption and regenerate
    setCaptions(prev => ({ ...prev, [platform]: '' }));
    await generateCaption(platform);
  };

  const generateAllCaptions = async () => {
    if (!selectedProduct || selectedPlatforms.length === 0) return;
    
    setPublishing(true);
    try {
      for (const platform of selectedPlatforms) {
        await generateCaption(platform);
      }
      showToast('Captions générés!', 'success');
    } catch (error) {
      console.error('Error generating captions:', error);
      showToast('Erreur génération', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const publishToSelected = async () => {
    if (!selectedProduct || selectedPlatforms.length === 0) return;
    
    setPublishing(true);
    try {
      const res = await fetch(`${API_URL}/api/publishing/products/${selectedProduct.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms: selectedPlatforms, language: captionLanguage }),
      });
      const data = await res.json();
      
      if (data.success) {
        // Update captions from results
        Object.entries(data.results).forEach(([platform, result]: [string, any]) => {
          if (result.caption) {
            setCaptions(prev => ({ ...prev, [platform]: result.caption }));
          }
        });
        
        showToast('Captions générés! Copiez et publiez.', 'success');
        
        // Refresh status
        const statusRes = await fetch(`${API_URL}/api/publishing/products/${selectedProduct.id}/status`);
        const status = await statusRes.json();
        setPublishingStatus(status);
        
        // Refresh products list
        fetchData();
      }
    } catch (error) {
      console.error('Error publishing:', error);
      showToast('Erreur publication', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const renderStats = () => (
    <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statsTitle, { color: colors.text }]}>📊 Statistiques</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.primary + '20' }]}>
          <Text style={styles.statNumber}>{stats?.totalProducts || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Produits</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#1877F220' }]}>
          <Text style={styles.statNumber}>{stats?.publishedFacebook || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>📘 FB</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E4405F20' }]}>
          <Text style={styles.statNumber}>{stats?.publishedInstagram || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>📸 IG</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#00000020' }]}>
          <Text style={styles.statNumber}>{stats?.publishedTiktok || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>🎵 TT</Text>
        </View>
      </View>
    </View>
  );

  const renderProductCard = (product: Product) => {
    const hasImage = product.images && product.images.length > 0;
    const publishedCount = product.publishedPlatforms?.length || 0;
    
    return (
      <TouchableOpacity
        key={product.id}
        style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => openProductModal(product)}
      >
        <View style={styles.productImageContainer}>
          {hasImage ? (
            <Image source={{ uri: product.images[0] }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
              <Text style={styles.placeholderEmoji}>👗</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            {product.price.toLocaleString()} DA
          </Text>
          
          <View style={styles.platformBadges}>
            {PLATFORMS.map(p => (
              <View
                key={p.key}
                style={[
                  styles.platformBadge,
                  {
                    backgroundColor: product.publishedPlatforms?.includes(p.key)
                      ? p.color + '30'
                      : colors.border,
                  },
                ]}
              >
                <Text style={styles.platformBadgeIcon}>{p.icon}</Text>
                {product.publishedPlatforms?.includes(p.key) && (
                  <Text style={[styles.checkMark, { color: colors.success }]}>✓</Text>
                )}
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.publishStatus}>
          {publishedCount === 0 ? (
            <Text style={[styles.statusText, { color: colors.warning }]}>Non publié</Text>
          ) : publishedCount === 3 ? (
            <Text style={[styles.statusText, { color: colors.success }]}>✓ Partout</Text>
          ) : (
            <Text style={[styles.statusText, { color: colors.primary }]}>{publishedCount}/3</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              📤 Publier: {selectedProduct?.name}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll}>
            {/* Language Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🌍 Langue de la description:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languageScroll}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageChip,
                    {
                      backgroundColor: captionLanguage === lang.code ? colors.primary : colors.background,
                      borderColor: captionLanguage === lang.code ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setCaptionLanguage(lang.code)}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      { color: captionLanguage === lang.code ? '#FFF' : colors.text },
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Platform Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
              Sélectionner les plateformes:
            </Text>
            
            {PLATFORMS.map(platform => {
              const status = publishingStatus?.[platform.key as keyof PublishingStatus];
              const isSelected = selectedPlatforms.includes(platform.key);
              const caption = captions[platform.key];
              
              return (
                <View key={platform.key} style={[styles.platformSection, { borderColor: colors.border }]}>
                  <View style={styles.platformHeader}>
                    <TouchableOpacity
                      style={[
                        styles.platformToggle,
                        { backgroundColor: isSelected ? platform.color + '30' : colors.border },
                      ]}
                      onPress={() => togglePlatform(platform.key)}
                    >
                      <Text style={styles.platformIcon}>{platform.icon}</Text>
                      <Text style={[styles.platformLabel, { color: colors.text }]}>
                        {platform.label}
                      </Text>
                      {status?.published && (
                        <Text style={[styles.publishedBadge, { color: colors.success }]}>
                          ✓ Publié
                        </Text>
                      )}
                    </TouchableOpacity>
                    
                    <Switch
                      value={isSelected}
                      onValueChange={() => togglePlatform(platform.key)}
                      trackColor={{ false: colors.border, true: platform.color }}
                    />
                  </View>
                  
                  {isSelected && (
                    <View style={styles.captionSection}>
                      <View style={styles.captionButtons}>
                        <TouchableOpacity
                          style={[styles.generateBtn, { backgroundColor: platform.color, flex: 1 }]}
                          onPress={() => generateCaption(platform.key)}
                          disabled={generatingCaption === platform.key}
                        >
                          {generatingCaption === platform.key ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Text style={styles.generateBtnText}>
                              ✨ Générer Caption
                            </Text>
                          )}
                        </TouchableOpacity>
                        
                        {caption && (
                          <TouchableOpacity
                            style={[styles.regenerateBtn, { backgroundColor: '#8B5CF6' }]}
                            onPress={() => regenerateCaption(platform.key)}
                            disabled={generatingCaption === platform.key}
                          >
                            <Text style={styles.regenerateBtnText}>🔄</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {caption && (
                        <View style={[styles.captionBox, { backgroundColor: colors.background }]}>
                          <TextInput
                            style={[
                              styles.captionInput,
                              { 
                                color: colors.text,
                                textAlign: captionLanguage === 'ar' || captionLanguage === 'dz' ? 'right' : 'left',
                              },
                            ]}
                            value={caption}
                            onChangeText={(text) => setCaptions(prev => ({ ...prev, [platform.key]: text }))}
                            multiline
                            numberOfLines={6}
                          />
                          <View style={styles.captionActions}>
                            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                              📊 {caption.length} caractères
                            </Text>
                            <TouchableOpacity
                              style={[styles.copyBtn, { backgroundColor: colors.primary }]}
                              onPress={() => {
                                // Copy to clipboard would go here
                                showToast('Caption copié!', 'success');
                              }}
                            >
                              <Text style={styles.copyBtnText}>📋 Copier</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            
            {/* Generate All Button */}
            {selectedPlatforms.length > 0 && (
              <TouchableOpacity
                style={[styles.publishBtn, { backgroundColor: colors.primary }]}
                onPress={generateAllCaptions}
                disabled={publishing}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.publishBtnText}>
                    🚀 Générer Captions ({selectedPlatforms.length} plateformes)
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderStats()}
        
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          Produits ({products.length})
        </Text>
        
        {products.map(renderProductCard)}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  header: { padding: 20, paddingBottom: 15 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  
  // Stats
  statsContainer: { borderRadius: 16, padding: 16, marginBottom: 20 },
  statsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, marginHorizontal: 4 },
  statNumber: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4 },
  
  // Products
  sectionHeader: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  productImageContainer: { marginRight: 12 },
  productImage: { width: 60, height: 60, borderRadius: 10 },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: { fontSize: 24 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600' },
  productPrice: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  platformBadges: { flexDirection: 'row', marginTop: 8, gap: 6 },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  platformBadgeIcon: { fontSize: 12 },
  checkMark: { fontSize: 10, marginLeft: 2 },
  publishStatus: { marginLeft: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8EF',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
  closeButton: { fontSize: 24, padding: 4 },
  modalScroll: { padding: 20 },
  
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  platformSection: { borderWidth: 1, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  platformToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  platformIcon: { fontSize: 20, marginRight: 8 },
  platformLabel: { fontSize: 15, fontWeight: '500', flex: 1 },
  publishedBadge: { fontSize: 12, fontWeight: '600' },
  
  captionSection: { padding: 12, paddingTop: 0 },
  captionButtons: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  generateBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateBtnText: { color: '#FFF', fontWeight: '600' },
  regenerateBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
  },
  regenerateBtnText: { fontSize: 18 },
  captionBox: { padding: 12, borderRadius: 8 },
  captionInput: { fontSize: 13, lineHeight: 20, minHeight: 100, textAlignVertical: 'top' },
  captionActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  charCount: { fontSize: 12 },
  copyBtn: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyBtnText: { color: '#FFF', fontWeight: '600' },
  
  // Language selection
  languageScroll: { marginBottom: 8 },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  languageChipText: { fontSize: 13, fontWeight: '600' },
  
  publishBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  publishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  bottomSpacer: { height: 100 },
});

export default PublishingScreen;
