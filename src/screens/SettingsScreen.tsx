import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, useSettingsStore } from '@/store';
import { Currency } from '@/types';
import { isRTL, getFlexDirection } from '@/utils/rtl';
import { LANGUAGES, LanguageCode, isRTL as checkRTL } from '@/i18n';

const getApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://192.168.43.220:3001';
  }
  return 'http://localhost:3001';
};
const USE_PRODUCTION = true;
const PRODUCTION_URL = 'https://web-production-1c70.up.railway.app';
const API_URL = USE_PRODUCTION ? PRODUCTION_URL : getApiUrl();

interface LLMSettings {
  global: boolean;
  facebook: boolean;
  instagram: boolean;
  whatsapp: boolean;
  tiktok: boolean;
}

interface CommentReplySettings {
  global: boolean;
  facebook: boolean;
  instagram: boolean;
  sendDM: boolean;
  publicReply: boolean;
}

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'DZD', label: 'Dinar Algérien', symbol: 'د.ج' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
];

export const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    currency,
    setCurrency,
    notificationsEnabled,
    setNotificationsEnabled,
    lowStockThreshold,
    setLowStockThreshold,
    themeMode,
    setThemeMode,
    setLocale,
  } = useSettingsStore();
  
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  
  const [llmSettings, setLlmSettings] = useState<LLMSettings>({
    global: true, facebook: true, instagram: true, whatsapp: true, tiktok: true,
  });
  const [llmLoading, setLlmLoading] = useState(true);
  const [llmToggling, setLlmToggling] = useState<string | null>(null);
  
  const [commentSettings, setCommentSettings] = useState<CommentReplySettings>({
    global: true, facebook: true, instagram: true, sendDM: true, publicReply: true,
  });
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentToggling, setCommentToggling] = useState<string | null>(null);
  
  useEffect(() => {
    fetchLLMSettings();
    fetchCommentSettings();
    
    // Auto-refresh every 10 seconds for multi-user sync
    const interval = setInterval(() => {
      fetchLLMSettings();
      fetchCommentSettings();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchLLMSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/llm-settings`);
      const data = await response.json();
      setLlmSettings(data);
    } catch (error) {
      console.error('Error fetching LLM settings:', error);
    } finally {
      setLlmLoading(false);
    }
  };
  
  const fetchCommentSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/llm-settings/comment-reply`);
      const data = await response.json();
      setCommentSettings(data);
    } catch (error) {
      console.error('Error fetching comment settings:', error);
    } finally {
      setCommentLoading(false);
    }
  };
  
  const toggleLLMPlatform = async (platform: keyof LLMSettings) => {
    setLlmToggling(platform);
    try {
      const response = await fetch(`${API_URL}/api/llm-settings/toggle/${platform}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setLlmSettings(prev => ({ ...prev, [platform]: data.enabled }));
      }
    } catch (error) {
      console.error('Error toggling LLM setting:', error);
    } finally {
      setLlmToggling(null);
    }
  };
  
  const toggleCommentSetting = async (setting: keyof CommentReplySettings) => {
    setCommentToggling(setting);
    try {
      const response = await fetch(`${API_URL}/api/llm-settings/comment-reply/toggle/${setting}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setCommentSettings(prev => ({ ...prev, [setting]: data.enabled }));
      }
    } catch (error) {
      console.error('Error toggling comment setting:', error);
    } finally {
      setCommentToggling(null);
    }
  };
  
  const isDark = themeMode === 'dark';
  const rtl = isRTL();
  const currentLang = i18n.language as LanguageCode;
  const currentLangInfo = LANGUAGES[currentLang] || LANGUAGES.en;

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
    success: '#1E8449',
    successSoft: isDark ? 'rgba(30, 132, 73, 0.15)' : 'rgba(30, 132, 73, 0.08)',
    warning: '#9A7B0A',
    warningSoft: isDark ? 'rgba(243, 156, 18, 0.15)' : 'rgba(243, 156, 18, 0.08)',
    accent: '#9B59B6',
    accentSoft: isDark ? 'rgba(155, 89, 182, 0.15)' : 'rgba(155, 89, 182, 0.08)',
    blue: '#3498DB',
    blueSoft: isDark ? 'rgba(52, 152, 219, 0.15)' : 'rgba(52, 152, 219, 0.08)',
  };

  const handleLanguageChange = async (lang: LanguageCode) => {
    try {
      await setLocale(lang);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Language change error:', error);
    }
  };

  const handleCurrencyChange = (curr: Currency) => {
    setCurrency(curr);
    setCurrencyModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={styles.profileContent}>
            <Image source={require('../../assets/logo.jpg')} style={styles.profileLogo} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Djellaba El Basma</Text>
              <View style={styles.profileLocationRow}>
                <Feather name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.profileLocation}>Maghnia, Algeria</Text>
              </View>
              <View style={styles.profileOwnerRow}>
                <Feather name="user" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.profileOwner}>{user?.name || 'Owner'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Theme Toggle */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.accentSoft }]}>
              <Feather name="sun" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.appearance')}</Text>
          </View>
          <View style={styles.themeToggle}>
            <TouchableOpacity
              style={[styles.themeOption, !isDark && styles.themeOptionActive, { backgroundColor: !isDark ? colors.primarySoft : colors.surfaceAlt }]}
              onPress={() => setThemeMode('light')}
            >
              <Feather name="sun" size={18} color={!isDark ? colors.primary : colors.textMuted} />
              <Text style={[styles.themeLabel, { color: !isDark ? colors.primary : colors.textMuted }]}>{t('settings.light')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, isDark && styles.themeOptionActive, { backgroundColor: isDark ? colors.primarySoft : colors.surfaceAlt }]}
              onPress={() => setThemeMode('dark')}
            >
              <Feather name="moon" size={18} color={isDark ? colors.primary : colors.textMuted} />
              <Text style={[styles.themeLabel, { color: isDark ? colors.primary : colors.textMuted }]}>{t('settings.dark')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setLanguageModalVisible(true)}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.cardIcon, { backgroundColor: colors.blueSoft }]}>
                <Feather name="globe" size={18} color={colors.blue} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.language')}</Text>
                <Text style={[styles.settingHint, { color: colors.textMuted }]}>{currentLangInfo.nativeName}</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{currentLang.toUpperCase()}</Text>
              </View>
              <Feather name={rtl ? 'chevron-left' : 'chevron-right'} size={20} color={colors.textMuted} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Currency */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setCurrencyModalVisible(true)}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.cardIcon, { backgroundColor: colors.successSoft }]}>
                <Feather name="dollar-sign" size={18} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.currency')}</Text>
                <Text style={[styles.settingHint, { color: colors.textMuted }]}>{CURRENCIES.find(c => c.value === currency)?.label}</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <View style={[styles.currencyBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.currencySymbol, { color: colors.primary }]}>{CURRENCIES.find(c => c.value === currency)?.symbol}</Text>
              </View>
              <Feather name={rtl ? 'chevron-left' : 'chevron-right'} size={20} color={colors.textMuted} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Notifications */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.warningSoft }]}>
              <Feather name="bell" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.notifications')}</Text>
          </View>
          
          <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.enableNotifications')}</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={notificationsEnabled ? colors.primary : colors.textMuted}
              />
            </View>
          </View>

          <View style={[styles.settingItem, { borderTopColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.stockThreshold')}</Text>
                <Text style={[styles.settingHint, { color: colors.textMuted }]}>{t('settings.stockThresholdHint')}</Text>
              </View>
              <View style={styles.counter}>
                <TouchableOpacity
                  style={[styles.counterBtn, { backgroundColor: colors.surfaceAlt }]}
                  onPress={() => setLowStockThreshold(Math.max(0, lowStockThreshold - 1))}
                >
                  <Feather name="minus" size={16} color={colors.text} />
                </TouchableOpacity>
                <View style={[styles.counterValue, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.counterValueText, { color: colors.text }]}>{lowStockThreshold}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.counterBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setLowStockThreshold(lowStockThreshold + 1)}
                >
                  <Feather name="plus" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* AI Auto-Reply */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.accentSoft }]}>
              <MaterialCommunityIcons name="robot" size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.llm.title')}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{t('settings.llm.description')}</Text>
            </View>
          </View>
          
          {llmLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t('common.loading')}</Text>
            </View>
          ) : (
            <>
              {[
                { key: 'global' as const, label: t('settings.llm.global'), icon: 'globe', isGlobal: true },
                { key: 'facebook' as const, label: 'Facebook Messenger', icon: 'facebook' },
                { key: 'instagram' as const, label: 'Instagram Direct', icon: 'instagram' },
                { key: 'whatsapp' as const, label: 'WhatsApp', icon: 'whatsapp' },
                { key: 'tiktok' as const, label: 'TikTok', icon: 'tiktok' },
              ].map((platform, index) => (
                <View 
                  key={platform.key} 
                  style={[
                    styles.settingItem, 
                    { borderTopColor: colors.border },
                    platform.isGlobal && { backgroundColor: colors.primarySoft, marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8 }
                  ]}
                >
                  <View style={styles.settingRow}>
                    <View style={[styles.settingLeft, !llmSettings.global && !platform.isGlobal && { opacity: 0.4 }]}>
                      {platform.icon === 'globe' && <Feather name="globe" size={18} color={colors.accent} style={styles.platformIcon} />}
                      {platform.icon === 'facebook' && <Ionicons name="logo-facebook" size={18} color="#1877F2" style={styles.platformIcon} />}
                      {platform.icon === 'instagram' && <Ionicons name="logo-instagram" size={18} color="#E4405F" style={styles.platformIcon} />}
                      {platform.icon === 'whatsapp' && <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={styles.platformIcon} />}
                      {platform.icon === 'tiktok' && <Ionicons name="logo-tiktok" size={18} color={isDark ? '#FFF' : '#000'} style={styles.platformIcon} />}
                      <Text style={[styles.settingLabel, { color: colors.text }]}>{platform.label}</Text>
                    </View>
                    <View style={styles.toggleRow}>
                      {llmToggling === platform.key && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
                      <Switch
                        value={platform.isGlobal ? llmSettings.global : (llmSettings.global && llmSettings[platform.key])}
                        onValueChange={() => toggleLLMPlatform(platform.key)}
                        trackColor={{ false: colors.border, true: colors.primarySoft }}
                        thumbColor={(platform.isGlobal ? llmSettings.global : (llmSettings.global && llmSettings[platform.key])) ? colors.primary : colors.textMuted}
                        disabled={llmToggling !== null || (!platform.isGlobal && !llmSettings.global)}
                      />
                    </View>
                  </View>
                </View>
              ))}
              {!llmSettings.global && (
                <View style={[styles.noteBox, { backgroundColor: colors.warningSoft }]}>
                  <Feather name="alert-circle" size={14} color={colors.warning} />
                  <Text style={[styles.noteText, { color: colors.warning }]}>{t('settings.llm.disabledNote')}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Comment Auto-Reply */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: colors.blueSoft }]}>
              <Feather name="message-circle" size={18} color={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.comment.title')}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{t('settings.comment.description')}</Text>
            </View>
          </View>
          
          {commentLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t('common.loading')}</Text>
            </View>
          ) : (
            <>
              {[
                { key: 'global' as const, label: t('settings.comment.enable'), icon: 'power', isGlobal: true },
                { key: 'facebook' as const, label: 'Facebook', icon: 'facebook' },
                { key: 'instagram' as const, label: 'Instagram', icon: 'instagram' },
                { key: 'sendDM' as const, label: t('settings.comment.sendDM'), icon: 'send' },
                { key: 'publicReply' as const, label: t('settings.comment.publicReply'), icon: 'message-square' },
              ].map((setting) => (
                <View 
                  key={setting.key} 
                  style={[
                    styles.settingItem, 
                    { borderTopColor: colors.border },
                    setting.isGlobal && { backgroundColor: colors.primarySoft, marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8 }
                  ]}
                >
                  <View style={styles.settingRow}>
                    <View style={[styles.settingLeft, !commentSettings.global && !setting.isGlobal && { opacity: 0.4 }]}>
                      {setting.icon === 'power' && <Feather name="power" size={18} color={colors.blue} style={styles.platformIcon} />}
                      {setting.icon === 'facebook' && <Ionicons name="logo-facebook" size={18} color="#1877F2" style={styles.platformIcon} />}
                      {setting.icon === 'instagram' && <Ionicons name="logo-instagram" size={18} color="#E4405F" style={styles.platformIcon} />}
                      {setting.icon === 'send' && <Feather name="send" size={18} color={colors.success} style={styles.platformIcon} />}
                      {setting.icon === 'message-square' && <Feather name="message-square" size={18} color={colors.accent} style={styles.platformIcon} />}
                      <Text style={[styles.settingLabel, { color: colors.text }]}>{setting.label}</Text>
                    </View>
                    <View style={styles.toggleRow}>
                      {commentToggling === setting.key && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
                      <Switch
                        value={setting.isGlobal ? commentSettings.global : (commentSettings.global && commentSettings[setting.key])}
                        onValueChange={() => toggleCommentSetting(setting.key)}
                        trackColor={{ false: colors.border, true: colors.primarySoft }}
                        thumbColor={(setting.isGlobal ? commentSettings.global : (commentSettings.global && commentSettings[setting.key])) ? colors.primary : colors.textMuted}
                        disabled={commentToggling !== null || (!setting.isGlobal && !commentSettings.global)}
                      />
                    </View>
                  </View>
                </View>
              ))}
              {commentSettings.global && (
                <View style={[styles.noteBox, { backgroundColor: colors.successSoft }]}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                  <Text style={[styles.noteText, { color: colors.success }]}>{t('settings.comment.enabledNote')}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* About */}
        <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={require('../../assets/logo.jpg')} style={styles.aboutLogo} />
          <Text style={[styles.aboutTitle, { color: colors.text }]}>Djellaba El Basma</Text>
          <View style={styles.aboutLocationRow}>
            <Feather name="map-pin" size={14} color={colors.primary} />
            <Text style={[styles.aboutLocation, { color: colors.primary }]}>Maghnia, Algeria</Text>
          </View>
          <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>Version 1.0.0</Text>
          <View style={styles.aboutTaglineRow}>
            <Feather name="heart" size={14} color={colors.primary} />
            <Text style={[styles.aboutTagline, { color: colors.textSec }]}>Made in Maghnia</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Language Modal */}
      <Modal visible={languageModalVisible} transparent animationType="slide" onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Feather name="globe" size={22} color={colors.blue} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.language')}</Text>
            </View>

            {(Object.entries(LANGUAGES) as [LanguageCode, typeof LANGUAGES[LanguageCode]][]).map(([code, info]) => (
              <TouchableOpacity
                key={code}
                style={[styles.langOption, { backgroundColor: currentLang === code ? colors.primarySoft : colors.surfaceAlt, borderColor: currentLang === code ? colors.primary : 'transparent', borderWidth: currentLang === code ? 2 : 0 }]}
                onPress={() => handleLanguageChange(code)}
              >
                <View style={styles.langOptionLeft}>
                  <Text style={styles.langFlag}>{info.flag || '🏳️'}</Text>
                  <View>
                    <Text style={[styles.langNative, { color: currentLang === code ? colors.primary : colors.text }]}>{info.nativeName}</Text>
                    <Text style={[styles.langName, { color: colors.textMuted }]}>{info.name}</Text>
                  </View>
                </View>
                <View style={styles.langOptionRight}>
                  {info.isRTL && (
                    <View style={[styles.rtlTag, { backgroundColor: colors.border }]}>
                      <Text style={[styles.rtlTagText, { color: colors.textMuted }]}>RTL</Text>
                    </View>
                  )}
                  {currentLang === code && <Feather name="check" size={20} color={colors.primary} />}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => setLanguageModalVisible(false)}>
              <Text style={[styles.modalCloseBtnText, { color: colors.textSec }]}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal visible={currencyModalVisible} transparent animationType="slide" onRequestClose={() => setCurrencyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Feather name="dollar-sign" size={22} color={colors.success} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.currency')}</Text>
            </View>

            {CURRENCIES.map((curr) => (
              <TouchableOpacity
                key={curr.value}
                style={[styles.currencyOption, { backgroundColor: currency === curr.value ? colors.primarySoft : colors.surfaceAlt, borderColor: currency === curr.value ? colors.primary : 'transparent', borderWidth: currency === curr.value ? 2 : 0 }]}
                onPress={() => handleCurrencyChange(curr.value)}
              >
                <View style={styles.currencyOptionLeft}>
                  <View style={[styles.currencyIconBox, { backgroundColor: colors.primary }]}>
                    <Text style={styles.currencyIconText}>{curr.symbol}</Text>
                  </View>
                  <View>
                    <Text style={[styles.currencyCode, { color: currency === curr.value ? colors.primary : colors.text }]}>{curr.value}</Text>
                    <Text style={[styles.currencyName, { color: colors.textMuted }]}>{curr.label}</Text>
                  </View>
                </View>
                {currency === curr.value && <Feather name="check" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceAlt }]} onPress={() => setCurrencyModalVisible(false)}>
              <Text style={[styles.modalCloseBtnText, { color: colors.textSec }]}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8 },

  // Profile Card
  profileCard: { borderRadius: 18, padding: 20, marginBottom: 16 },
  profileContent: { flexDirection: 'row', alignItems: 'center' },
  profileLogo: { width: 56, height: 56, borderRadius: 14, marginRight: 14 },
  profileAvatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  profileLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileLocation: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  profileOwnerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  profileOwner: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  // Card
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardSubtitle: { fontSize: 12, marginTop: 2 },

  // Theme Toggle
  themeToggle: { flexDirection: 'row', gap: 10 },
  themeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 10, gap: 8 },
  themeOptionActive: {},
  themeLabel: { fontSize: 14, fontWeight: '600' },

  // Setting Row
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingHint: { fontSize: 12, marginTop: 2 },
  settingItem: { paddingVertical: 12, borderTopWidth: 1 },

  // Badge
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  currencyBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  currencySymbol: { fontSize: 16, fontWeight: '700' },

  // Counter
  counter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  counterValue: { minWidth: 40, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  counterValueText: { fontSize: 16, fontWeight: '700' },

  // Platform
  platformIcon: { marginRight: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  loadingText: { fontSize: 13 },
  noteBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginTop: 8, gap: 8 },
  noteText: { fontSize: 12, flex: 1 },

  // About
  aboutCard: { borderRadius: 14, padding: 24, marginBottom: 16, borderWidth: 1, alignItems: 'center' },
  aboutLogo: { width: 80, height: 80, borderRadius: 20, marginBottom: 12 },
  aboutAvatar: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  aboutTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  aboutLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  aboutLocation: { fontSize: 13 },
  aboutVersion: { fontSize: 13, marginBottom: 8 },
  aboutTaglineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aboutTagline: { fontSize: 13 },

  bottomSpacer: { height: 100 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },

  // Language Option
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginBottom: 8 },
  langOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langFlag: { fontSize: 26 },
  langNative: { fontSize: 15, fontWeight: '600' },
  langName: { fontSize: 12, marginTop: 2 },
  langOptionRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rtlTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rtlTagText: { fontSize: 10, fontWeight: '700' },

  // Currency Option
  currencyOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginBottom: 8 },
  currencyOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencyIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  currencyIconText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  currencyCode: { fontSize: 15, fontWeight: '600' },
  currencyName: { fontSize: 12, marginTop: 2 },

  modalCloseBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  modalCloseBtnText: { fontSize: 15, fontWeight: '600' },
});

export default SettingsScreen;
