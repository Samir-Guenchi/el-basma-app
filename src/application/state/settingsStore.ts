/**
 * Settings Store
 * Single Responsibility: App settings state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, Locale, Currency, CustomCategory, DEFAULT_CATEGORIES, ThemeMode } from '@/domain/entities';
import { changeLanguage } from '@/i18n';
import { settingsApi, categoryApi } from '@/services/api';

interface SettingsState extends AppSettings {
  isLoading: boolean;
  themeMode: ThemeMode;
  customCategories: CustomCategory[];
  isOnline: boolean;
}

interface SettingsActions {
  fetchSettings: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
  setCurrency: (currency: Currency) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setLowStockThreshold: (threshold: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  addCategory: (category: CustomCategory) => Promise<void>;
  removeCategory: (value: string) => void;
  getAllCategories: () => { value: string; labelKey: string; emoji: string }[];
  resetSettings: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultSettings: AppSettings & { themeMode: ThemeMode; customCategories: CustomCategory[] } = {
  locale: 'fr',
  currency: 'DZD',
  notificationsEnabled: true,
  lowStockThreshold: 5,
  themeMode: 'light',
  customCategories: [],
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      isLoading: false,
      isOnline: true,

      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const settings = await settingsApi.getSettings();
          const { locale: currentLocale, themeMode: currentTheme } = get();
          
          set({
            locale: currentLocale,
            themeMode: currentTheme,
            currency: settings.currency || 'DZD',
            lowStockThreshold: settings.lowStockThreshold || 5,
            notificationsEnabled: settings.notificationsEnabled ?? true,
            isLoading: false,
            isOnline: true,
          });
        } catch (error) {
          set({ isLoading: false, isOnline: false });
        }
      },

      fetchCategories: async () => {
        try {
          const categories = await categoryApi.getCategories();
          const customCats = categories.filter((c: any) => !c.isDefault);
          set({ customCategories: customCats, isOnline: true });
        } catch (error) {
          set({ isOnline: false });
        }
      },

      setLocale: async (locale: Locale) => {
        set({ isLoading: true });
        try {
          await changeLanguage(locale);
          set({ locale, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      setCurrency: (currency: Currency) => {
        set({ currency });
        if (get().isOnline) {
          settingsApi.updateSettings({ currency }).catch(console.error);
        }
      },

      setNotificationsEnabled: (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
        if (get().isOnline) {
          settingsApi.updateSettings({ notificationsEnabled: enabled }).catch(console.error);
        }
      },

      setLowStockThreshold: (threshold: number) => {
        const value = Math.max(0, threshold);
        set({ lowStockThreshold: value });
        if (get().isOnline) {
          settingsApi.updateSettings({ lowStockThreshold: value }).catch(console.error);
        }
      },

      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode });
      },

      addCategory: async (category: CustomCategory) => {
        const { customCategories, isOnline } = get();
        const exists = customCategories.some(c => c.value.toLowerCase() === category.value.toLowerCase());
        const existsInDefault = DEFAULT_CATEGORIES.some(c => c.value.toLowerCase() === category.value.toLowerCase());
        
        if (!exists && !existsInDefault) {
          if (isOnline) {
            try {
              const newCategory = await categoryApi.createCategory(category);
              set({ customCategories: [...customCategories, newCategory] });
            } catch (error) {
              set({ customCategories: [...customCategories, category], isOnline: false });
            }
          } else {
            set({ customCategories: [...customCategories, category] });
          }
        }
      },

      removeCategory: (value: string) => {
        const { customCategories } = get();
        set({ customCategories: customCategories.filter(c => c.value !== value) });
      },

      getAllCategories: () => {
        const { customCategories } = get();
        const customCats = customCategories.map(c => ({
          value: c.value,
          labelKey: c.value,
          emoji: c.emoji,
        }));
        return [...DEFAULT_CATEGORIES, ...customCats];
      },

      resetSettings: () => {
        set({ ...defaultSettings });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        locale: state.locale,
        themeMode: state.themeMode,
      }),
    }
  )
);

// Selectors
export const selectLocale = (state: SettingsStore) => state.locale;
export const selectCurrency = (state: SettingsStore) => state.currency;
export const selectNotificationsEnabled = (state: SettingsStore) => state.notificationsEnabled;
export const selectLowStockThreshold = (state: SettingsStore) => state.lowStockThreshold;
export const selectThemeMode = (state: SettingsStore) => state.themeMode;
