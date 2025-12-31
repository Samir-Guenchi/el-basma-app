import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TranslatedText, Locale } from '@/types';

/**
 * Hook to get translated text from a TranslatedText object
 * Falls back through: current locale -> fr -> en
 */
export const useTranslatedText = () => {
  const { i18n } = useTranslation();

  const getText = useMemo(() => {
    return (translatedText: TranslatedText | undefined | null): string => {
      if (!translatedText) return '';

      const currentLocale = i18n.language as Locale;

      // Try current locale first
      if (translatedText[currentLocale]) {
        return translatedText[currentLocale];
      }

      // Fallback to French
      if (translatedText.fr) {
        return translatedText.fr;
      }

      // Fallback to English
      if (translatedText.en) {
        return translatedText.en;
      }

      // Return first available translation
      const firstAvailable = Object.values(translatedText).find((v) => v);
      return firstAvailable || '';
    };
  }, [i18n.language]);

  return { getText, currentLocale: i18n.language as Locale };
};

/**
 * Hook to create/update TranslatedText objects
 */
export const useTranslatedTextEditor = () => {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language as Locale;

  const createTranslatedText = (text: string): TranslatedText => ({
    en: currentLocale === 'en' ? text : '',
    fr: currentLocale === 'fr' ? text : '',
    ar: currentLocale === 'ar' ? text : '',
    dz: currentLocale === 'dz' ? text : '',
  });

  const updateTranslatedText = (
    existing: TranslatedText,
    locale: Locale,
    text: string
  ): TranslatedText => ({
    ...existing,
    [locale]: text,
  });

  return { createTranslatedText, updateTranslatedText, currentLocale };
};
