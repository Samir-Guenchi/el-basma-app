import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProductStore, useSettingsStore } from '@/store';
import { ProductStackParamList } from '@/navigation/types';
import { ProductCategory } from '@/types';
import { useToast } from '@/context/ToastContext';
import { uploadApi } from '@/services/api';

type RouteProps = RouteProp<ProductStackParamList, 'ProductEdit'>;

interface SizeStock { size: string; qty: number; }
interface ColorStock { color: string; sizes: SizeStock[]; }
interface PublishingStatus {
  facebook: { published: boolean; publishedAt: string | null };
  instagram: { published: boolean; publishedAt: string | null };
  tiktok: { published: boolean; publishedAt: string | null };
}

const SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'Standard', '36', '38', '40', '42', '44', '46', '48', '50'];
const COLORS_LIST = ['Noir', 'Blanc', 'Beige', 'Rouge', 'Bleu', 'Vert', 'Rose', 'Doré', 'Marron'];
const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'ar', label: 'العربية', flag: 'AR' },
  { code: 'dz', label: 'Darija', flag: 'DZ' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'multi', label: 'Multi', flag: 'ALL' },
];
const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
  { key: 'instagram', label: 'Instagram', color: '#E4405F' },
  { key: 'tiktok', label: 'TikTok', color: '#000000' },
];

const getApiUrl = () => Platform.OS === 'android' ? 'http://192.168.43.220:3001' : 'http://localhost:3001';
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();
const getImageUrl = (uri: string): string => {
  if (!uri) return '';
  // Handle blob URLs from web image picker
  if (uri.startsWith('blob:')) return uri;
  // Handle data URLs
  if (uri.startsWith('data:')) return uri;
  if (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  return `${API_URL}${uri}`;
};

export const ProductEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { t } = useTranslation();
  const product = route.params?.product;
  const isEditing = !!product;
  const { themeMode, getAllCategories, addCategory } = useSettingsStore();
  const { addProduct, updateProduct } = useProductStore();
  const { showSuccess, showError } = useToast();
  const isDark = themeMode === 'dark';
  const categories = getAllCategories();
  const [publishingStatus, setPublishingStatus] = useState<PublishingStatus | null>(null);

  // Fetch publishing status for existing product
  useEffect(() => {
    if (isEditing && product?.id) {
      fetch(`${API_URL}/api/publishing/products/${product.id}/status`)
        .then(res => res.json())
        .then(data => setPublishingStatus(data))
        .catch(err => console.log('Publishing status error:', err));
    }
  }, [isEditing, product?.id]);

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
    danger: '#E74C3C',
    accent: '#9B59B6',
    accentSoft: isDark ? 'rgba(155, 89, 182, 0.15)' : 'rgba(155, 89, 182, 0.08)',
  };

  // Form state
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [priceWholesale, setPriceWholesale] = useState((product as any)?.priceWholesale?.toString() || '');
  const [minWholesaleQty, setMinWholesaleQty] = useState((product as any)?.minWholesaleQty?.toString() || '3');
  const [category, setCategory] = useState<ProductCategory>(product?.category || 'djellaba');
  const [publishedOnWebsite, setPublishedOnWebsite] = useState<boolean>((product as any)?.publishedOnWebsite || false);

  const initInventory = (): ColorStock[] => {
    if ((product as any)?.inventory) return (product as any).inventory;
    if (product?.colors?.length) {
      return product.colors.map(c => ({
        color: c,
        sizes: (product?.sizes || ['S', 'M', 'L', 'XL']).map(s => ({ size: s, qty: 1 }))
      }));
    }
    return [];
  };

  const [inventory, setInventory] = useState<ColorStock[]>(initInventory());
  const [newColor, setNewColor] = useState('');
  const [showAddColor, setShowAddColor] = useState(false);
  const totalQty = inventory.reduce((t, c) => t + c.sizes.reduce((s, sz) => s + sz.qty, 0), 0);

  const [media, setMedia] = useState<{uri: string; type: 'image' | 'video'}[]>(
    product?.images?.map(uri => ({ uri, type: 'image' as const })) || []
  );

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [captionLanguage, setCaptionLanguage] = useState('fr');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [publishPlatforms, setPublishPlatforms] = useState({ facebook: false, instagram: false, tiktok: false });

  // Inventory functions
  const addColor = (colorName: string) => {
    if (!colorName.trim() || inventory.find(c => c.color.toLowerCase() === colorName.toLowerCase())) return;
    setInventory([...inventory, { color: colorName.trim(), sizes: SIZES.slice(0, 4).map(s => ({ size: s, qty: 0 })) }]);
    setNewColor('');
    setShowAddColor(false);
  };
  const removeColor = (idx: number) => setInventory(inventory.filter((_, i) => i !== idx));
  const toggleSize = (cIdx: number, size: string) => {
    const inv = [...inventory];
    const sIdx = inv[cIdx].sizes.findIndex(s => s.size === size);
    if (sIdx >= 0) inv[cIdx].sizes = inv[cIdx].sizes.filter(s => s.size !== size);
    else {
      inv[cIdx].sizes.push({ size, qty: 0 });
      inv[cIdx].sizes.sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size));
    }
    setInventory(inv);
  };
  const updateQty = (cIdx: number, sIdx: number, qty: number) => {
    const inv = [...inventory];
    inv[cIdx].sizes[sIdx].qty = Math.max(0, qty);
    setInventory(inv);
  };

  // Media functions
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showError('Permission photos requise'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled && result.assets) {
      setMedia([...media, ...result.assets.map(a => ({ uri: a.uri, type: (a.type === 'video' ? 'video' : 'image') as 'image' | 'video' }))]);
    }
    setShowMediaPicker(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { showError('Permission caméra requise'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setMedia([...media, { uri: result.assets[0].uri, type: (result.assets[0].type === 'video' ? 'video' : 'image') as 'image' | 'video' }]);
    }
    setShowMediaPicker(false);
  };

  const removeMedia = (index: number) => setMedia(media.filter((_, i) => i !== index));

  // Caption generation
  const generateCaption = async () => {
    generateCaptionWithLang(captionLanguage);
  };

  const generateCaptionWithLang = async (lang: string) => {
    if (!name.trim()) { showError('Entrez le nom du produit'); return; }
    setIsGeneratingCaption(true);
    try {
      const res = await fetch(`${API_URL}/api/publishing/generate-caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: name.trim(), description: description.trim(), price: parseFloat(price) || 0,
          category, colors: inventory.map(c => c.color),
          sizes: [...new Set(inventory.flatMap(c => c.sizes.map(s => s.size)))], 
          language: lang,
          customInstruction: customInstruction.trim(),
        }),
      });
      const data = await res.json();
      if (data.caption) setGeneratedCaption(data.caption);
      else setGeneratedCaption(generateLocalCaption(lang));
    } catch { setGeneratedCaption(generateLocalCaption(lang)); }
    finally { setIsGeneratingCaption(false); }
  };

  const generateLocalCaption = (lang: string) => {
    const priceNum = parseFloat(price) || 0;
    const colorList = inventory.map(c => c.color);
    const sizeList = [...new Set(inventory.flatMap(c => c.sizes.map(s => s.size)))];
    
    const captions: Record<string, string> = {
      fr: `✨ ${name} ✨\n\n${description || 'Magnifique pièce!'}\n\n💰 ${priceNum.toLocaleString()} DA\n${colorList.length ? `🎨 Couleurs: ${colorList.join(', ')}\n` : ''}${sizeList.length ? `📏 Tailles: ${sizeList.join(', ')}\n` : ''}\n🎉 -15% sur tout!\n📍 Maghnia | Livraison partout\n📩 Commandez en DM!`,
      ar: `✨ ${name} ✨\n\n${description || 'قطعة رائعة!'}\n\n💰 ${priceNum.toLocaleString()} دج\n${colorList.length ? `🎨 الألوان: ${colorList.join('، ')}\n` : ''}${sizeList.length ? `📏 المقاسات: ${sizeList.join('، ')}\n` : ''}\n🎉 خصم 15%!\n📍 مغنية | توصيل لكل الجزائر\n📩 اطلبوا في الخاص!`,
      dz: `✨ ${name} ✨\n\n${description || 'حاجة زينة بزاف!'}\n\n💰 ${priceNum.toLocaleString()} دج\n${colorList.length ? `🎨 الألوان: ${colorList.join('، ')}\n` : ''}${sizeList.length ? `📏 المقاسات: ${sizeList.join('، ')}\n` : ''}\n🎉 -15% على كلش!\n📍 مغنية | نوصلو لكل بلاصة\n📩 راسلونا في الخاص!`,
      en: `✨ ${name} ✨\n\n${description || 'Beautiful piece!'}\n\n💰 ${priceNum.toLocaleString()} DA\n${colorList.length ? `🎨 Colors: ${colorList.join(', ')}\n` : ''}${sizeList.length ? `📏 Sizes: ${sizeList.join(', ')}\n` : ''}\n🎉 -15% on everything!\n📍 Maghnia | Nationwide delivery\n📩 Order via DM!`,
      multi: `✨ ${name} ✨\n\n🇫🇷 ${description || 'Magnifique!'} | ${priceNum.toLocaleString()} DA\n🇩🇿 حاجة زينة! -15% على كلش\n🇸🇦 قطعة رائعة!\n\n📍 Maghnia | مغنية\n📩 DM / راسلونا`,
    };
    
    return captions[lang] || captions.fr;
  };

  // Submit
  const handleSubmit = async () => {
    if (!name.trim()) { showError('Nom requis'); return; }
    if (!price || parseFloat(price) <= 0) { showError('Prix requis'); return; }
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const item of media) {
        // Upload local files (mobile) or blob URLs (web)
        if (item.uri.startsWith('file://') || item.uri.startsWith('content://') || item.uri.startsWith('blob:')) {
          try {
            console.log('Uploading image:', item.uri.substring(0, 50));
            const result = await uploadApi.uploadImage(item.uri, undefined, name.trim());
            console.log('Upload result:', result);
            if (result.success && result.url) {
              uploadedUrls.push(result.url);
            } else if (result.error) {
              console.error('Upload failed:', result.error);
              // Skip failed uploads but continue
            }
          } catch (err) { 
            console.error('Upload error:', err);
            // Continue without this image
          }
        } else {
          // Already a URL (http/https), keep it
          uploadedUrls.push(item.uri);
        }
      }
      
      console.log('Final uploaded URLs:', uploadedUrls);
      
      const productData = {
        name: name.trim(), description: description.trim(), price: parseFloat(price), category,
        priceWholesale: priceWholesale ? parseFloat(priceWholesale) : undefined,
        minWholesaleQty: parseInt(minWholesaleQty) || 3,
        images: uploadedUrls, inStock: totalQty > 0, quantity: totalQty,
        colors: inventory.map(c => c.color), sizes: [...new Set(inventory.flatMap(c => c.sizes.map(s => s.size)))], inventory,
        publishedOnWebsite,
      };
      
      console.log('Saving product:', productData.name);
      
      if (isEditing && product) { 
        await updateProduct(product.id, productData); 
        showSuccess('Produit modifié'); 
      } else { 
        await addProduct(productData); 
        showSuccess('Produit ajouté'); 
      }
      navigation.navigate('Dashboard' as never);
    } catch (err: any) { 
      console.error('Save error:', err); 
      showError(err?.message || 'Erreur de sauvegarde'); 
    }
    finally { setIsUploading(false); }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) { showError('Nom requis'); return; }
    addCategory({ value: newCategoryName.trim().toLowerCase(), emoji: '🏷️' });
    setCategory(newCategoryName.trim().toLowerCase());
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isEditing ? t('products.editProduct') : t('products.newProduct')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          {/* Photos */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('products.photos')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
              {media.map((item, index) => (
                <View key={index} style={styles.mediaItem}>
                  <Image source={{ uri: getImageUrl(item.uri) }} style={styles.mediaImage} />
                  {item.type === 'video' && (
                    <View style={styles.videoOverlay}>
                      <Ionicons name="play" size={24} color="#FFF" />
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeMedia} onPress={() => removeMedia(index)}>
                    <Feather name="x" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={[styles.addMediaBtn, { borderColor: colors.border }]} onPress={() => setShowMediaPicker(true)}>
                <Feather name="camera" size={24} color={colors.textMuted} />
                <Text style={[styles.addMediaText, { color: colors.textMuted }]}>{t('products.addMedia')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('products.name')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={name} onChangeText={setName}
              placeholder={t('products.namePlaceholder')} placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('products.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={description} onChangeText={setDescription}
              placeholder={t('products.descriptionPlaceholder')} placeholderTextColor={colors.textMuted}
              multiline numberOfLines={3}
            />
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('products.retailPrice')} (DA)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={price} onChangeText={setPrice}
              placeholder="15000" placeholderTextColor={colors.textMuted} keyboardType="numeric"
            />
          </View>

          {/* Wholesale Price */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('products.wholesalePrice')} (DA)</Text>
            <View style={styles.wholesaleRow}>
              <TextInput
                style={[styles.input, styles.wholesaleInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={priceWholesale} onChangeText={setPriceWholesale}
                placeholder="12000" placeholderTextColor={colors.textMuted} keyboardType="numeric"
              />
              <View style={styles.minQtyContainer}>
                <Text style={[styles.minQtyLabel, { color: colors.textMuted }]}>{t('products.minWholesaleQty')}</Text>
                <View style={styles.minQtyControls}>
                  <TouchableOpacity 
                    style={[styles.minQtyBtn, { backgroundColor: colors.border }]} 
                    onPress={() => setMinWholesaleQty(Math.max(2, parseInt(minWholesaleQty) - 1).toString())}
                  >
                    <Feather name="minus" size={14} color={colors.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.minQtyInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                    value={minWholesaleQty} onChangeText={setMinWholesaleQty}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity 
                    style={[styles.minQtyBtn, { backgroundColor: colors.primary }]} 
                    onPress={() => setMinWholesaleQty((parseInt(minWholesaleQty) + 1).toString())}
                  >
                    <Feather name="plus" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {priceWholesale && (
              <Text style={[styles.wholesaleHint, { color: colors.textSec }]}>
                {t('products.wholesale')}: {parseInt(minWholesaleQty) || 3}+ {t('products.piecesOrMore')}
              </Text>
            )}
          </View>

          {/* Publish on Website Toggle */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.websiteToggle, { backgroundColor: publishedOnWebsite ? colors.successSoft : colors.surface, borderColor: publishedOnWebsite ? colors.success : colors.border }]}
              onPress={() => setPublishedOnWebsite(!publishedOnWebsite)}
              activeOpacity={0.7}
            >
              <View style={[styles.websiteToggleIcon, { backgroundColor: publishedOnWebsite ? colors.success : colors.textMuted }]}>
                <Feather name="globe" size={18} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.websiteToggleTitle, { color: colors.text }]}>{t('products.publishOnWebsite') || 'Publier sur le site web'}</Text>
                <Text style={[styles.websiteToggleHint, { color: colors.textMuted }]}>
                  {publishedOnWebsite 
                    ? (t('products.visibleOnWebsite') || 'Visible sur le site web') 
                    : (t('products.notVisibleOnWebsite') || 'Non visible sur le site web')}
                </Text>
              </View>
              <View style={[styles.websiteToggleSwitch, { backgroundColor: publishedOnWebsite ? colors.success : colors.border }]}>
                <View style={[styles.websiteToggleDot, { transform: [{ translateX: publishedOnWebsite ? 18 : 2 }] }]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('products.category')}</Text>
              <TouchableOpacity style={[styles.addCatBtn, { backgroundColor: colors.accentSoft }]} onPress={() => setShowNewCategory(true)}>
                <Feather name="plus" size={14} color={colors.accent} />
                <Text style={[styles.addCatText, { color: colors.accent }]}>{t('products.newCategory')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.catChip, { backgroundColor: category === cat.value ? colors.primary : colors.surface, borderColor: category === cat.value ? colors.primary : colors.border }]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={[styles.catChipText, { color: category === cat.value ? '#FFF' : colors.text }]}>{cat.value}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Inventory */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>{t('products.stockByColor')}</Text>
              <Text style={[styles.totalQty, { color: colors.primary }]}>{t('common.total')}: {totalQty}</Text>
            </View>

            {inventory.map((colorItem, cIdx) => (
              <View key={cIdx} style={[styles.colorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.colorHeader}>
                  <View style={styles.colorNameRow}>
                    <View style={[styles.colorDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.colorName, { color: colors.text }]}>{colorItem.color}</Text>
                  </View>
                  <View style={styles.colorActions}>
                    <Text style={[styles.colorQty, { color: colors.textSec }]}>{colorItem.sizes.reduce((s, sz) => s + sz.qty, 0)} {t('products.units')}</Text>
                    <TouchableOpacity onPress={() => removeColor(cIdx)}>
                      <Feather name="trash-2" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.sizesRow}>
                  {SIZES.map(size => {
                    const hasSize = colorItem.sizes.find(s => s.size === size);
                    return (
                      <TouchableOpacity
                        key={size}
                        style={[styles.sizeChip, { backgroundColor: hasSize ? colors.primary : colors.bg, borderColor: hasSize ? colors.primary : colors.border }]}
                        onPress={() => toggleSize(cIdx, size)}
                      >
                        <Text style={[styles.sizeChipText, { color: hasSize ? '#FFF' : colors.textMuted }]}>{size}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {colorItem.sizes.length > 0 && (
                  <View style={styles.qtyList}>
                    {colorItem.sizes.map((sz, sIdx) => (
                      <View key={sz.size} style={styles.qtyRow}>
                        <Text style={[styles.qtyLabel, { color: colors.text }]}>{sz.size}</Text>
                        <View style={styles.qtyControls}>
                          <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.border }]} onPress={() => updateQty(cIdx, sIdx, sz.qty - 1)}>
                            <Feather name="minus" size={14} color={colors.text} />
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.qtyInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                            value={sz.qty.toString()} onChangeText={(v) => updateQty(cIdx, sIdx, parseInt(v) || 0)} keyboardType="numeric"
                          />
                          <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.primary }]} onPress={() => updateQty(cIdx, sIdx, sz.qty + 1)}>
                            <Feather name="plus" size={14} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {!showAddColor ? (
              <TouchableOpacity style={[styles.addColorBtn, { backgroundColor: colors.accentSoft }]} onPress={() => setShowAddColor(true)}>
                <Feather name="plus" size={18} color={colors.accent} />
                <Text style={[styles.addColorText, { color: colors.accent }]}>{t('products.colors')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.addColorForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                  value={newColor} onChangeText={setNewColor}
                  placeholder={t('products.colorNamePlaceholder')} placeholderTextColor={colors.textMuted} autoFocus
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorSuggestions}>
                  {COLORS_LIST.filter(c => !inventory.find(i => i.color.toLowerCase() === c.toLowerCase())).map(c => (
                    <TouchableOpacity key={c} style={[styles.colorSuggest, { backgroundColor: colors.bg, borderColor: colors.border }]} onPress={() => addColor(c)}>
                      <Text style={{ color: colors.text }}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.addColorActions}>
                  <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => { setShowAddColor(false); setNewColor(''); }}>
                  <Text style={{ color: colors.text }}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.success }]} onPress={() => addColor(newColor)}>
                  <Text style={{ color: '#FFF' }}>{t('common.add')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Publishing Status (for existing products) */}
          {isEditing && publishingStatus && (
            <View style={[styles.publishStatusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.publishStatusTitle, { color: colors.text }]}>{t('products.publishStatus')}</Text>
              <View style={styles.publishStatusRow}>
                {[
                  { key: 'facebook', label: 'Facebook', color: '#1877F2' },
                  { key: 'instagram', label: 'Instagram', color: '#E4405F' },
                  { key: 'tiktok', label: 'TikTok', color: '#000000' },
                ].map((platform) => {
                  const status = publishingStatus[platform.key as keyof PublishingStatus];
                  return (
                    <View key={platform.key} style={[styles.publishStatusItem, { backgroundColor: status?.published ? colors.successSoft : colors.bg }]}>
                      <View style={[styles.publishStatusDot, { backgroundColor: platform.color }]} />
                      <Text style={[styles.publishStatusLabel, { color: status?.published ? colors.success : colors.textMuted }]}>
                        {platform.label}
                      </Text>
                      <Feather name={status?.published ? 'check' : 'x'} size={14} color={status?.published ? colors.success : colors.textMuted} />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Publish Button */}
          <TouchableOpacity style={[styles.publishBtn, { backgroundColor: colors.primary }]} onPress={() => setShowPublishModal(true)}>
            <Feather name="share-2" size={20} color="#FFF" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.publishBtnText}>{t('publishing.publishToSocial')}</Text>
              <Text style={styles.publishBtnHint}>Facebook, Instagram, TikTok</Text>
            </View>
            <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.cancelAction, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
              <Text style={[styles.cancelActionText, { color: colors.text }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitAction, { backgroundColor: isUploading ? colors.textMuted : colors.success }]}
              onPress={handleSubmit} disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFF" />
                  <Text style={styles.submitActionText}>{isEditing ? t('common.edit') : t('common.add')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Media Picker Modal */}
      <Modal visible={showMediaPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('products.addMedia')}</Text>
            <TouchableOpacity style={[styles.modalOption, { backgroundColor: colors.primary }]} onPress={takePhoto}>
              <Feather name="camera" size={20} color="#FFF" />
              <Text style={styles.modalOptionText}>{t('products.takePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalOption, { backgroundColor: colors.accent }]} onPress={pickImage}>
              <Feather name="image" size={20} color="#FFF" />
              <Text style={styles.modalOptionText}>{t('products.chooseGallery')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setShowMediaPicker(false)}>
              <Text style={{ color: colors.text }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Category Modal */}
      <Modal visible={showNewCategory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('products.newCategory')}</Text>
              <TouchableOpacity onPress={() => setShowNewCategory(false)}>
                <Feather name="x" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text, marginVertical: 16 }]}
              placeholder={t('products.categoryName')} placeholderTextColor={colors.textMuted}
              value={newCategoryName} onChangeText={setNewCategoryName}
            />
            <TouchableOpacity style={[styles.modalSubmit, { backgroundColor: colors.success }]} onPress={handleAddCategory}>
              <Feather name="check" size={18} color="#FFF" />
              <Text style={styles.modalSubmitText}>{t('products.createCategory')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Publish Modal */}
      <Modal visible={showPublishModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.publishModal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('publishing.title')}</Text>
              <TouchableOpacity onPress={() => setShowPublishModal(false)}>
                <Feather name="x" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Language */}
              <Text style={[styles.publishLabel, { color: colors.text }]}>{t('publishing.language')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langChip, { backgroundColor: captionLanguage === lang.code ? colors.primary : colors.bg, borderColor: captionLanguage === lang.code ? colors.primary : colors.border }]}
                    onPress={() => {
                      setCaptionLanguage(lang.code);
                      // Auto-regenerate caption when language changes
                      if (generatedCaption && lang.code !== captionLanguage) {
                        generateCaptionWithLang(lang.code);
                      }
                    }}
                  >
                    <Text style={[styles.langFlag, { color: captionLanguage === lang.code ? '#FFF' : colors.textMuted }]}>{lang.flag}</Text>
                    <Text style={[styles.langText, { color: captionLanguage === lang.code ? '#FFF' : colors.text }]}>{lang.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Platforms */}
              <Text style={[styles.publishLabel, { color: colors.text }]}>{t('publishing.platforms')}</Text>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.platformRow, { backgroundColor: publishPlatforms[p.key as keyof typeof publishPlatforms] ? p.color + '15' : colors.bg, borderColor: publishPlatforms[p.key as keyof typeof publishPlatforms] ? p.color : colors.border }]}
                  onPress={() => setPublishPlatforms(prev => ({ ...prev, [p.key]: !prev[p.key as keyof typeof prev] }))}
                >
                  <Text style={[styles.platformName, { color: colors.text }]}>{p.label}</Text>
                  <View style={[styles.platformCheck, { backgroundColor: publishPlatforms[p.key as keyof typeof publishPlatforms] ? p.color : 'transparent', borderColor: publishPlatforms[p.key as keyof typeof publishPlatforms] ? p.color : colors.border }]}>
                    {publishPlatforms[p.key as keyof typeof publishPlatforms] && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              ))}

              {/* Caption */}
              <View style={styles.captionSection}>
                {/* Custom Instruction */}
                <View style={{ marginBottom: 14 }}>
                  <Text style={[styles.publishLabel, { color: colors.text }]}>{t('publishing.customInstructions')}</Text>
                  <TextInput
                    style={[styles.customInstructionInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }]}
                    value={customInstruction} onChangeText={setCustomInstruction}
                    placeholder={t('publishing.customPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    multiline numberOfLines={2}
                  />
                </View>

                <View style={styles.captionHeader}>
                  <Text style={[styles.publishLabel, { color: colors.text, marginBottom: 0 }]}>{t('publishing.caption')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={[styles.genBtn, { backgroundColor: colors.accent }]} onPress={generateCaption} disabled={isGeneratingCaption}>
                      {isGeneratingCaption ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.genBtnText}>{t('publishing.generate')}</Text>}
                    </TouchableOpacity>
                    {generatedCaption && (
                      <TouchableOpacity style={[styles.genBtn, { backgroundColor: colors.accentSoft }]} onPress={generateCaption}>
                        <Feather name="refresh-cw" size={14} color={colors.accent} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <TextInput
                  style={[styles.captionInput, { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text, textAlign: captionLanguage === 'ar' || captionLanguage === 'dz' ? 'right' : 'left' }]}
                  value={generatedCaption} onChangeText={setGeneratedCaption}
                  placeholder={t('publishing.writeOrGenerate')} placeholderTextColor={colors.textMuted}
                  multiline numberOfLines={5}
                />
              </View>

              {/* Publish Button */}
              <TouchableOpacity
                style={[styles.publishNowBtn, { backgroundColor: (publishPlatforms.facebook || publishPlatforms.instagram || publishPlatforms.tiktok) ? colors.success : colors.textMuted }]}
                onPress={async () => {
                  const selected = Object.entries(publishPlatforms).filter(([_, v]) => v).map(([k]) => k);
                  if (!selected.length) { showError(t('publishing.selectPlatform')); return; }
                  if (!media.length) { showError(t('publishing.addPhoto')); return; }
                  setIsUploading(true);
                  try {
                    // First save the product to get uploaded image URLs
                    const uploadedUrls: string[] = [];
                    for (const item of media) {
                      if (item.uri.startsWith('file://') || item.uri.startsWith('content://')) {
                        try {
                          const result = await uploadApi.uploadImage(item.uri, undefined, name.trim());
                          uploadedUrls.push(result.success && result.url ? `${API_URL}${result.url}` : item.uri);
                        } catch { uploadedUrls.push(item.uri); }
                      } else if (item.uri.startsWith('/uploads')) {
                        uploadedUrls.push(`${API_URL}${item.uri}`);
                      } else {
                        uploadedUrls.push(item.uri);
                      }
                    }
                    
                    // Save product
                    const productData = {
                      name: name.trim(), description: description.trim(), price: parseFloat(price), category,
                      priceWholesale: priceWholesale ? parseFloat(priceWholesale) : undefined,
                      minWholesaleQty: parseInt(minWholesaleQty) || 3,
                      images: uploadedUrls, inStock: totalQty > 0, quantity: totalQty,
                      colors: inventory.map(c => c.color), sizes: [...new Set(inventory.flatMap(c => c.sizes.map(s => s.size)))], inventory,
                    };
                    if (isEditing && product) { await updateProduct(product.id, productData); }
                    else { await addProduct(productData); }
                    
                    // Publish with images
                    const res = await fetch(`${API_URL}/api/publishing/publish`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        product: { name, description, price: parseFloat(price), category, colors: inventory.map(c => c.color), sizes: [...new Set(inventory.flatMap(c => c.sizes.map(s => s.size)))] }, 
                        platforms: selected, 
                        language: captionLanguage, 
                        caption: generatedCaption,
                        images: uploadedUrls 
                      }),
                    });
                    const data = await res.json();
                    
                    // Show result message
                    if (data.results) {
                      const manualPlatforms = Object.entries(data.results).filter(([_, r]: [string, any]) => r.manual).map(([p]) => p);
                      if (manualPlatforms.length > 0) {
                        showSuccess(`${t('publishing.captionReady')} ${t('publishing.copyFor')} ${manualPlatforms.join(', ')}`);
                      } else {
                        showSuccess(t('publishing.publishSuccess'));
                      }
                    } else {
                      showSuccess(t('publishing.publishSuccess'));
                    }
                    setShowPublishModal(false);
                    navigation.navigate('Dashboard' as never);
                  } catch (e) { console.error(e); showError(t('publishing.publishError')); }
                  finally { setIsUploading(false); }
                }}
                disabled={isUploading}
              >
                {isUploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishNowText}>{t('publishing.saveAndPublish')}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },

  form: { padding: 16 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalQty: { fontSize: 14, fontWeight: '700' },

  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },

  // Wholesale
  wholesaleRow: { flexDirection: 'row', gap: 12 },
  wholesaleInput: { flex: 1 },
  minQtyContainer: { alignItems: 'center' },
  minQtyLabel: { fontSize: 11, marginBottom: 6 },
  minQtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  minQtyBtn: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  minQtyInput: { width: 40, height: 36, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontWeight: '600', fontSize: 14 },
  wholesaleHint: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },

  // Website Toggle
  websiteToggle: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  websiteToggleIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  websiteToggleTitle: { fontSize: 15, fontWeight: '600' },
  websiteToggleHint: { fontSize: 12, marginTop: 2 },
  websiteToggleSwitch: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  websiteToggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },

  // Media
  mediaScroll: { marginTop: 4 },
  mediaItem: { width: 90, height: 90, marginRight: 10, borderRadius: 12, overflow: 'hidden' },
  mediaImage: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  removeMedia: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: '#E74C3C', alignItems: 'center', justifyContent: 'center' },
  addMediaBtn: { width: 90, height: 90, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addMediaText: { fontSize: 11, marginTop: 4 },

  // Category
  addCatBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  addCatText: { fontSize: 12, fontWeight: '600' },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginRight: 8 },
  catChipText: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },

  // Color inventory
  colorCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  colorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  colorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  colorName: { fontSize: 15, fontWeight: '600' },
  colorActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorQty: { fontSize: 13 },
  sizesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  sizeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  sizeChipText: { fontSize: 12, fontWeight: '600' },
  qtyList: { gap: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyLabel: { fontSize: 14, fontWeight: '600', width: 40 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { width: 50, height: 30, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontWeight: '600' },

  addColorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  addColorText: { fontSize: 14, fontWeight: '600' },
  addColorForm: { borderRadius: 12, borderWidth: 1, padding: 12 },
  colorSuggestions: { marginVertical: 10 },
  colorSuggest: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  addColorActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },

  // Publishing status
  publishStatusCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  publishStatusTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  publishStatusRow: { flexDirection: 'row', gap: 8 },
  publishStatusItem: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, gap: 6 },
  publishStatusDot: { width: 6, height: 6, borderRadius: 3 },
  publishStatusLabel: { flex: 1, fontSize: 11, fontWeight: '500' },

  // Publish button
  publishBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 16 },
  publishBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  publishBtnHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // Action buttons
  actionButtons: { flexDirection: 'row', gap: 12 },
  cancelAction: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelActionText: { fontSize: 15, fontWeight: '600' },
  submitAction: { flex: 2, flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitActionText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginBottom: 10, gap: 10 },
  modalOptionText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  modalCancel: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  modalSubmit: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalSubmitText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // Publish modal
  publishModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  publishLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  langChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginRight: 8, gap: 6 },
  langFlag: { fontSize: 11, fontWeight: '700' },
  langText: { fontSize: 13, fontWeight: '500' },
  platformRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  platformName: { fontSize: 15, fontWeight: '500' },
  platformCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  captionSection: { marginTop: 16 },
  captionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  customInstructionInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13, minHeight: 50, textAlignVertical: 'top' },
  genBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  genBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  captionInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 100, textAlignVertical: 'top' },
  publishNowBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  publishNowText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});

export default ProductEditScreen;
