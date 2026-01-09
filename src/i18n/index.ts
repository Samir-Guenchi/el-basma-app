import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import dz from './locales/dz.json';

export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', isRTL: false, flag: '🇬🇧' },
  fr: { name: 'French', nativeName: 'Français', isRTL: false, flag: '🇫🇷' },
  ar: { name: 'Arabic', nativeName: 'العربية', isRTL: true, flag: '🇸🇦' },
  dz: { name: 'Algerian Darija', nativeName: 'الدارجة', isRTL: true, flag: '🇩🇿' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

const LANGUAGE_STORAGE_KEY = '@boutique_language';

// RTL languages
const RTL_LANGUAGES: LanguageCode[] = ['ar', 'dz'];

export const isRTL = (lang: LanguageCode): boolean => {
  return RTL_LANGUAGES.includes(lang);
};

// Get stored language or detect from device
const getInitialLanguage = async (): Promise<LanguageCode> => {
  try {
    const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang && storedLang in LANGUAGES) {
      return storedLang as LanguageCode;
    }
  } catch (error) {
    console.warn('Failed to get stored language:', error);
  }

  // Detect device language
  const deviceLang = Localization.locale.split('-')[0];
  
  // Check if device language is supported
  if (deviceLang in LANGUAGES) {
    return deviceLang as LanguageCode;
  }

  // Fallback chain: fr -> en
  return 'fr';
};

// Configure RTL layout
export const configureRTL = (lang: LanguageCode): void => {
  const shouldBeRTL = isRTL(lang);
  
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    // Note: App needs to restart for RTL changes to take effect
  }
};

// Change language and persist
export const changeLanguage = async (lang: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    configureRTL(lang);
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
};

// Get current language
export const getCurrentLanguage = (): LanguageCode => {
  return i18n.language as LanguageCode;
};

// Initialize i18n
export const initI18n = async (): Promise<void> => {
  const initialLang = await getInitialLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        fr: { translation: fr },
        ar: { translation: ar },
        dz: { translation: dz },
      },
      lng: initialLang,
      fallbackLng: ['fr', 'en'], // Fallback: French first, then English
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      compatibilityJSON: 'v3',
    });

  configureRTL(initialLang);
};

export default i18n;
