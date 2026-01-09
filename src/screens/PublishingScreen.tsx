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
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
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

const getImageUrl = (uri: string): string => {
  if (!uri) return '';
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://')) return uri;
  return `${API_URL}${uri}`;
};

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  images: string[];
  quantity: number;
}

interface PublishingStatus {
  website: { published: boolean; caption: string | null; publishedAt: string | null };
  facebook: { published: boolean; caption: string | null; publishedAt: string | null };
  instagram: { published: boolean; caption: string | null; publishedAt: string | null };
  tiktok: { published: boolean; caption: string | null; publishedAt: string | null };
}

const PLATFORMS = [
  { key: 'website', label: 'Site Web', icon: 'globe-outline', color: '#3B82F6' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
];

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'dz', label: 'Darija', flag: '🇩🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'multi', label: 'Multi', flag: '🌐' },
];

export const PublishingScreen: React.FC = () => {
  const { t } = useTranslation();
  const { themeMode } = useSettingsStore();
  const { showToast } = useToast();
  const localProducts = useProductStore(state => state.products);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productStatuses, setProductStatuses] = useState<{ [key: string]: PublishingStatus }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState<string | null>(null);
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null);
  const [captions, setCaptions] = useState<{ [key: string]: string }>({});
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [captionLanguage, setCaptionLanguage] = useState('fr');
  const [customPrompt, setCustomPrompt] = useState('');

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
      // Use local products
      setProducts(localProducts);
      
      // Fetch publishing status for each product
      const statuses: { [key: string]: PublishingStatus } = {};
      for (const product of localProducts) {
        try {
          const res = await fetch(`${API_URL}/api/publishing/products/${product.id}/status`);
          if (res.ok) {
            statuses[product.id] = await res.json();
          }
        } catch (e) {
          // Ignore individual errors
        }
      }
      setProductStatuses(statuses);
    } catch (error) {
      console.error('Error fetching data:', error);
      setProducts(localProducts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [localProducts]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10 seconds for multi-user sync
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openProductModal = async (product: Product) => {
    setSelectedProduct(product);
    setSelectedPlatforms([]);
    setCaptions({});
    setCustomPrompt('');
    setModalVisible(true);
  };

  const generateCaption = async (platform: string) => {
    if (!selectedProduct) return;
    
    setGeneratingCaption(platform);
    try {
      const res = await fetch(`${API_URL}/api/publishing/generate-caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: selectedProduct.id,
          platform, 
          language: captionLanguage,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      
      if (data.caption) {
        setCaptions(prev => ({ ...prev, [platform]: data.caption }));
        showToast('Caption généré!', 'success');
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      showToast('Erreur génération caption', 'error');
    } finally {
      setGeneratingCaption(null);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const copyCaption = (caption: string) => {
    Clipboard.setString(caption);
    showToast('Caption copié!', 'success');
  };

  const shareToApp = async (platform: string) => {
    const caption = captions[platform];
    if (!caption || !selectedProduct) return;

    setSharingPlatform(platform);
    try {
      const imageUrl = selectedProduct.images?.[0] ? getImageUrl(selectedProduct.images[0]) : '';
      
      const result = await Share.share({
        message: caption,
        url: imageUrl,
        title: selectedProduct.name,
      });
      
      // Only mark as published if user actually shared (not dismissed)
      if (result.action === Share.sharedAction) {
        await fetch(`${API_URL}/api/publishing/products/${selectedProduct.id}/mark-published`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform, caption }),
        });
        
        showToast(`Partagé sur ${platform}!`, 'success');
        fetchData();
      } else if (result.action === Share.dismissedAction) {
        showToast('Partage annulé', 'info');
      }
    } catch (error: any) {
      console.error('Share error:', error);
      // User cancelled or error - don't show error for cancellation
      if (error.message !== 'User did not share') {
        showToast('Erreur de partage', 'error');
      }
    } finally {
      setSharingPlatform(null);
    }
  };

  const getPublishStatus = (productId: string) => {
    const status = productStatuses[productId];
    if (!status) return { count: 0, platforms: [] };
    
    const published: string[] = [];
    if (status.website?.published) published.push('website');
    if (status.facebook?.published) published.push('facebook');
    if (status.instagram?.published) published.push('instagram');
    if (status.tiktok?.published) published.push('tiktok');
    
    return { count: published.length, platforms: published };
  };

  const renderProductCard = (product: Product) => {
    const hasImage = product.images && product.images.length > 0;
    const { count, platforms } = getPublishStatus(product.id);
    
    return (
      <TouchableOpacity
        key={product.id}
        style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => openProductModal(product)}
      >
        <View style={styles.productImageContainer}>
          {hasImage ? (
            <Image source={{ uri: getImageUrl(product.images[0]) }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: colors.border }]}>
              <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
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
            {PLATFORMS.map(p => {
              const isPublished = platforms.includes(p.key);
              return (
                <View
                  key={p.key}
                  style={[
                    styles.platformBadge,
                    { backgroundColor: isPublished ? p.color + '30' : colors.border },
                  ]}
                >
                  <Ionicons name={p.icon as any} size={14} color={isPublished ? p.color : colors.textSecondary} />
                  {isPublished && (
                    <Ionicons name="checkmark" size={10} color={colors.success} style={{ marginLeft: 2 }} />
                  )}
                </View>
              );
            })}
          </View>
        </View>
        
        <View style={styles.publishStatus}>
          {count === 0 ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
              <Text style={[styles.statusText, { color: colors.warning }]}>Non publié</Text>
            </View>
          ) : count === 4 ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.statusText, { color: colors.success }]}>✓ Partout</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.statusText, { color: colors.primary }]}>{count}/4</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderModal = () => {
    const currentStatus = selectedProduct ? productStatuses[selectedProduct.id] : null;
    
    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedProduct?.name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Language Selection */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="language" size={16} /> Langue
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
                {LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langChip,
                      {
                        backgroundColor: captionLanguage === lang.code ? colors.primary : colors.background,
                        borderColor: captionLanguage === lang.code ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setCaptionLanguage(lang.code)}
                  >
                    <Text style={{ fontSize: 16 }}>{lang.flag}</Text>
                    <Text style={[styles.langText, { color: captionLanguage === lang.code ? '#FFF' : colors.text }]}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Custom Prompt */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
                <Ionicons name="create" size={16} /> Instructions personnalisées (optionnel)
              </Text>
              <TextInput
                style={[styles.promptInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Ex: Ajoute une promo -15%, mentionne la livraison gratuite..."
                placeholderTextColor={colors.textSecondary}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
                numberOfLines={2}
              />

              {/* Platform Selection */}
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
                <Ionicons name="share-social" size={16} /> Plateformes
              </Text>
              
              {PLATFORMS.map(platform => {
                const isSelected = selectedPlatforms.includes(platform.key);
                const caption = captions[platform.key];
                const status = currentStatus?.[platform.key as keyof PublishingStatus];
                const isWebsite = platform.key === 'website';
                const isPublishedOnWebsite = selectedProduct && (selectedProduct as any).publishedOnWebsite;
                
                return (
                  <View key={platform.key} style={[styles.platformSection, { borderColor: colors.border }]}>
                    <TouchableOpacity
                      style={styles.platformHeader}
                      onPress={() => isWebsite ? null : togglePlatform(platform.key)}
                    >
                      <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                        <Ionicons name={platform.icon as any} size={20} color={platform.color} />
                      </View>
                      <Text style={[styles.platformLabel, { color: colors.text }]}>{platform.label}</Text>
                      {(isWebsite ? isPublishedOnWebsite : status?.published) && (
                        <View style={[styles.publishedTag, { backgroundColor: colors.success + '20' }]}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                          <Text style={[styles.publishedText, { color: colors.success }]}>Publié</Text>
                        </View>
                      )}
                      {isWebsite ? (
                        <Switch
                          value={isPublishedOnWebsite}
                          onValueChange={async (value) => {
                            if (!selectedProduct) return;
                            try {
                              await fetch(`${API_URL}/api/products/${selectedProduct.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ publishedOnWebsite: value }),
                              });
                              showToast(value ? 'Publié sur le site!' : 'Retiré du site', 'success');
                              // Update local state
                              setSelectedProduct({ ...selectedProduct, publishedOnWebsite: value } as any);
                              fetchData();
                            } catch (error) {
                              showToast('Erreur', 'error');
                            }
                          }}
                          trackColor={{ false: colors.border, true: platform.color }}
                        />
                      ) : (
                        <Switch
                          value={isSelected}
                          onValueChange={() => togglePlatform(platform.key)}
                          trackColor={{ false: colors.border, true: platform.color }}
                        />
                      )}
                    </TouchableOpacity>
                    
                    {isWebsite && (
                      <View style={[styles.websiteInfo, { backgroundColor: colors.background }]}>
                        <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
                        <Text style={[styles.websiteInfoText, { color: colors.textSecondary }]}>
                          {isPublishedOnWebsite 
                            ? 'Ce produit est visible sur votre site web' 
                            : 'Activez pour afficher ce produit sur votre site web'}
                        </Text>
                      </View>
                    )}
                    
                    {!isWebsite && isSelected && (
                      <View style={styles.captionArea}>
                        {/* Generate Button */}
                        <TouchableOpacity
                          style={[styles.generateBtn, { backgroundColor: platform.color }]}
                          onPress={() => generateCaption(platform.key)}
                          disabled={generatingCaption === platform.key}
                        >
                          {generatingCaption === platform.key ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <>
                              <Ionicons name="sparkles" size={18} color="#FFF" />
                              <Text style={styles.generateText}>Générer Caption</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        
                        {/* Caption Display */}
                        {caption && (
                          <View style={[styles.captionBox, { backgroundColor: colors.background }]}>
                            <TextInput
                              style={[styles.captionInput, { color: colors.text }]}
                              value={caption}
                              onChangeText={(text) => setCaptions(prev => ({ ...prev, [platform.key]: text }))}
                              multiline
                              numberOfLines={5}
                            />
                            
                            <View style={styles.captionActions}>
                              <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.border }]}
                                onPress={() => copyCaption(caption)}
                              >
                                <Ionicons name="copy" size={16} color={colors.text} />
                                <Text style={[styles.actionText, { color: colors.text }]}>Copier</Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: platform.color }]}
                                onPress={() => shareToApp(platform.key)}
                                disabled={sharingPlatform === platform.key}
                              >
                                {sharingPlatform === platform.key ? (
                                  <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                  <>
                                    <Ionicons name="share" size={16} color="#FFF" />
                                    <Text style={[styles.actionText, { color: '#FFF' }]}>Publier</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  // Stats
  const totalPublished = Object.values(productStatuses).filter(s => 
    s.facebook?.published || s.instagram?.published || s.tiktok?.published
  ).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{products.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Produits</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{totalPublished}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Publiés</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{products.length - totalPublished}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En attente</Text>
          </View>
        </View>
        
        {/* Products List */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          Tous les produits
        </Text>
        
        {products.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun produit</Text>
          </View>
        ) : (
          products.map(renderProductCard)
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  content: { flex: 1, padding: 16 },
  
  // Stats
  statsRow: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: '100%' },
  
  // Section
  sectionHeader: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  
  // Product Card
  productCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  productImageContainer: { marginRight: 12 },
  productImage: { width: 60, height: 60, borderRadius: 10 },
  productImagePlaceholder: { width: 60, height: 60, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600' },
  productPrice: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  platformBadges: { flexDirection: 'row', marginTop: 8, gap: 6 },
  platformBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  publishStatus: { marginLeft: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  
  // Empty
  emptyState: { padding: 40, borderRadius: 16, alignItems: 'center' },
  emptyText: { fontSize: 15, marginTop: 12 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E8E8EF' },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '600' },
  closeBtn: { padding: 4 },
  modalScroll: { padding: 16 },
  
  // Language
  langScroll: { marginBottom: 8 },
  langChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, gap: 6 },
  langText: { fontSize: 13, fontWeight: '500' },
  
  // Prompt
  promptInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  
  // Platform Section
  platformSection: { borderWidth: 1, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  platformHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  platformIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  platformLabel: { flex: 1, fontSize: 16, fontWeight: '500' },
  publishedTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 10, gap: 4 },
  publishedText: { fontSize: 11, fontWeight: '600' },
  
  // Caption Area
  captionArea: { padding: 12, paddingTop: 0 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, gap: 8 },
  generateText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  captionBox: { marginTop: 12, padding: 12, borderRadius: 10 },
  captionInput: { fontSize: 14, lineHeight: 20, minHeight: 100, textAlignVertical: 'top' },
  captionActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 13, fontWeight: '600' },
  websiteInfo: { flexDirection: 'row', alignItems: 'center', padding: 12, margin: 12, marginTop: 0, borderRadius: 10, gap: 8 },
  websiteInfoText: { flex: 1, fontSize: 13 },
});

export default PublishingScreen;
