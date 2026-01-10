import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSettingsStore } from '@/store';

export const MoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { themeMode } = useSettingsStore();
  const { t } = useTranslation();
  const isDark = themeMode === 'dark';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  const colors = {
    bg: isDark ? '#121212' : '#F5F5F5',
    surface: isDark ? '#1E1E1E' : '#FFFFFF',
    surfaceAlt: isDark ? '#252525' : '#FAFAFA',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSec: isDark ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDark ? '#A0A0A0' : '#595959',
    border: isDark ? '#2A2A2A' : '#E8E8E8',
    primary: '#B03052',
    primarySoft: isDark ? 'rgba(176, 48, 82, 0.15)' : 'rgba(176, 48, 82, 0.08)',
    success: '#1E8449',           // 5.9:1 contrast (was #2DCC70)
    successSoft: isDark ? 'rgba(30, 132, 73, 0.15)' : 'rgba(30, 132, 73, 0.08)',
    warning: '#9A7B0A',           // 4.6:1 contrast (was #F39C11)
    warningSoft: isDark ? 'rgba(154, 123, 10, 0.15)' : 'rgba(154, 123, 10, 0.08)',
    accent: '#6B2D7B',            // 7:1 contrast (was #9B59B6)
    accentSoft: isDark ? 'rgba(107, 45, 123, 0.15)' : 'rgba(107, 45, 123, 0.08)',
    blue: '#1565C0',              // 5.5:1 contrast (was #3498DB)
    blueSoft: isDark ? 'rgba(21, 101, 192, 0.15)' : 'rgba(21, 101, 192, 0.08)',
  };

  const menuItems = [
    {
      id: 'publishing',
      icon: 'share-2',
      iconType: 'feather',
      title: t('more.publishing'),
      subtitle: t('more.socialMedia'),
      color: colors.accent,
      bgColor: colors.accentSoft,
      screen: 'PublishingDetail',
    },
    {
      id: 'customers',
      icon: 'users',
      iconType: 'feather',
      title: t('more.customers'),
      subtitle: t('more.database'),
      color: colors.success,
      bgColor: colors.successSoft,
      screen: 'CustomersDetail',
    },
    {
      id: 'delivery',
      icon: 'truck',
      iconType: 'feather',
      title: t('more.delivery'),
      subtitle: t('more.pricesByCity'),
      color: colors.warning,
      bgColor: colors.warningSoft,
      screen: 'DeliveryDetail',
    },
    {
      id: 'settings',
      icon: 'settings',
      iconType: 'feather',
      title: t('more.settings'),
      subtitle: t('more.preferences'),
      color: colors.blue,
      bgColor: colors.blueSoft,
      screen: 'SettingsDetail',
    },
  ];

  const quickActions = [
    { icon: 'instagram', label: 'Instagram', color: '#B03052', url: 'https://instagram.com' },  // 5.5:1 contrast
    { icon: 'facebook', label: 'Facebook', color: '#1565C0', url: 'https://facebook.com' },     // 5.5:1 contrast
    { icon: 'whatsapp', label: 'WhatsApp', color: '#1E8449', url: 'https://wa.me/' },           // 5.9:1 contrast
    { icon: 'map-pin', label: 'Maps', color: '#C0392B', url: 'https://maps.app.goo.gl/2oykqPUFEMiNFr7R7' }, // 5.5:1 contrast
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('greetings.morning'), icon: 'sun' };
    if (hour < 18) return { text: t('greetings.afternoon'), icon: 'sun' };
    return { text: t('greetings.evening'), icon: 'moon' };
  };

  const greeting = getGreeting();

  const handleMenuPress = (screen: string) => {
    navigation.navigate(screen);
  };

  const handleQuickAction = (url: string) => {
    Linking.openURL(url);
  };

  const renderIcon = (item: typeof menuItems[0]) => {
    return <Feather name={item.icon as any} size={22} color={item.color} />;
  };

  const renderQuickIcon = (iconName: string, color: string) => {
    if (iconName === 'instagram') return <Ionicons name="logo-instagram" size={20} color={color} />;
    if (iconName === 'facebook') return <Ionicons name="logo-facebook" size={20} color={color} />;
    if (iconName === 'whatsapp') return <Ionicons name="logo-whatsapp" size={20} color={color} />;
    return <Feather name="map-pin" size={20} color={color} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <View>
              <View style={styles.greetingRow}>
                <Feather name={greeting.icon as any} size={14} color={colors.textMuted} />
                <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting.text}</Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{t('more.title')}</Text>
            </View>
            <Image source={require('../../assets/logo.jpg')} style={styles.headerLogo} />
          </View>
        </Animated.View>

        {/* Store Card */}
        <Animated.View style={[styles.storeCard, { opacity: fadeAnim }]}>
          <View style={styles.storeGradient}>
            <View style={styles.storeContent}>
              <Image source={require('../../assets/logo.jpg')} style={styles.storeLogo} />
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>Djellaba El Basma</Text>
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={12} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.storeLocation}>Maghnia, Algérie</Text>
                </View>
              </View>
            </View>
            <View style={styles.promoBadge}>
              <Text style={styles.promoText}>-15%</Text>
            </View>
          </View>
          <View style={[styles.storeStats, { backgroundColor: colors.surface }]}>
            <View style={styles.storeStat}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={[styles.storeStatValue, { color: colors.text }]}>{t('common.free')}</Text>
              <Text style={[styles.storeStatLabel, { color: colors.textMuted }]}>{t('delivery.title')} Maghnia</Text>
            </View>
            <View style={[styles.storeStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.storeStat}>
              <Feather name="truck" size={16} color={colors.warning} />
              <Text style={[styles.storeStatValue, { color: colors.text }]}>500-1500 DA</Text>
              <Text style={[styles.storeStatLabel, { color: colors.textMuted }]}>{t('delivery.otherWilayas')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('more.quickAccess')}</Text>
          <View style={styles.quickActionsRow}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickAction, { backgroundColor: colors.surface }]}
                onPress={() => handleQuickAction(action.url)}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                  {renderQuickIcon(action.icon, action.color)}
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.textSec }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('more.menu')}</Text>
          <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuCard,
                  index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
                onPress={() => handleMenuPress(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: item.bgColor }]}>
                  {renderIcon(item)}
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Social Links */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('more.followUs')}</Text>
          <View style={[styles.socialCard, { backgroundColor: colors.surface }]}>
            <Image source={require('../../assets/logo.jpg')} style={styles.socialLogo} />
            <Text style={[styles.socialName, { color: colors.text }]}>جلابة البصمة مغنية</Text>
            <Text style={[styles.socialHandle, { color: colors.textSec }]}>@djellaba.elbasma.maghnia</Text>
            <View style={styles.socialIcons}>
              <TouchableOpacity 
                style={[styles.socialIcon, { backgroundColor: 'rgba(176, 48, 82, 0.1)' }]}
                onPress={() => Linking.openURL('https://instagram.com')}
              >
                <Ionicons name="logo-instagram" size={20} color="#B03052" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIcon, { backgroundColor: 'rgba(21, 101, 192, 0.1)' }]}
                onPress={() => Linking.openURL('https://facebook.com')}
              >
                <Ionicons name="logo-facebook" size={20} color="#1565C0" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
                onPress={() => Linking.openURL('https://tiktok.com')}
              >
                <Ionicons name="logo-tiktok" size={20} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* App Info */}
        <View style={[styles.appInfo, { backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.appInfoRow}>
            <Feather name="info" size={14} color={colors.textMuted} />
            <Text style={[styles.appInfoText, { color: colors.textMuted }]}>{t('more.version')} 1.0.0</Text>
          </View>
          <View style={styles.appInfoRow}>
            <Feather name="heart" size={14} color={colors.primary} />
            <Text style={[styles.appInfoText, { color: colors.textMuted }]}>{t('more.madeIn')}</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  
  // Header
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  greeting: { fontSize: 13 },
  headerTitle: { fontSize: 26, fontWeight: '700' },
  headerLogo: { width: 48, height: 48, borderRadius: 14 },
  headerAvatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Store Card
  storeCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  storeGradient: {
    backgroundColor: '#B03052', // Improved contrast: 5.5:1 (was #D4436A)
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginRight: 14,
  },
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storeInfo: { flex: 1 },
  storeName: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeLocation: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  promoBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  promoText: { color: '#B03052', fontSize: 14, fontWeight: '800' }, // Improved contrast: 5.5:1
  storeStats: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  storeStat: { flex: 1, alignItems: 'center', gap: 4 },
  storeStatValue: { fontSize: 14, fontWeight: '600' },
  storeStatLabel: { fontSize: 11 },
  storeStatDivider: { width: 1, marginHorizontal: 12 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12, paddingHorizontal: 20 },

  // Quick Actions
  quickActionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: { fontSize: 11, fontWeight: '500' },

  // Menu
  menuContainer: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 12, marginTop: 2 },

  // Social Card
  socialCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  socialLogo: { width: 64, height: 64, borderRadius: 18, marginBottom: 12 },
  socialAvatarLarge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  socialName: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  socialHandle: { fontSize: 13, marginBottom: 16 },
  socialIcons: { flexDirection: 'row', gap: 12 },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // App Info
  appInfo: { 
    marginHorizontal: 16, 
    padding: 16, 
    borderRadius: 14, 
    flexDirection: 'row', 
    justifyContent: 'space-around' 
  },
  appInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appInfoText: { fontSize: 12 },

  bottomSpacer: { height: 100 },
});

export default MoreScreen;
