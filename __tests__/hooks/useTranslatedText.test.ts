import { renderHook } from '@testing-library/react-native';
import { useTranslatedText, useTranslatedTextEditor } from '@/hooks/useTranslatedText';
import { TranslatedText } from '@/types';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
    },
  }),
}));

describe('useTranslatedText', () => {
  const mockTranslatedText: TranslatedText = {
    en: 'English text',
    fr: 'Texte français',
    ar: 'نص عربي',
    dz: 'نص دارجة',
  };

  it('should return text for current locale', () => {
    const { result } = renderHook(() => useTranslatedText());
    const text = result.current.getText(mockTranslatedText);
    expect(text).toBe('English text');
  });

  it('should return empty string for null input', () => {
    const { result } = renderHook(() => useTranslatedText());
    const text = result.current.getText(null);
    expect(text).toBe('');
  });

  it('should return empty string for undefined input', () => {
    const { result } = renderHook(() => useTranslatedText());
    const text = result.current.getText(undefined);
    expect(text).toBe('');
  });

  it('should fallback to French when current locale is empty', () => {
    const textWithEmptyEn: TranslatedText = {
      en: '',
      fr: 'Texte français',
      ar: '',
      dz: '',
    };

    const { result } = renderHook(() => useTranslatedText());
    const text = result.current.getText(textWithEmptyEn);
    expect(text).toBe('Texte français');
  });

  it('should fallback to English when French is also empty', () => {
    // Change mock to return 'ar' as current language
    jest.doMock('react-i18next', () => ({
      useTranslation: () => ({
        i18n: {
          language: 'ar',
        },
      }),
    }));

    const textWithEmptyArFr: TranslatedText = {
      en: 'English fallback',
      fr: '',
      ar: '',
      dz: '',
    };

    const { result } = renderHook(() => useTranslatedText());
    // Since ar is empty, should fallback to fr, then en
    const text = result.current.getText(textWithEmptyArFr);
    expect(text).toBe('English fallback');
  });

  it('should return current locale', () => {
    const { result } = renderHook(() => useTranslatedText());
    expect(result.current.currentLocale).toBe('en');
  });
});

describe('useTranslatedTextEditor', () => {
  it('should create translated text with current locale filled', () => {
    const { result } = renderHook(() => useTranslatedTextEditor());
    const created = result.current.createTranslatedText('Test text');

    expect(created.en).toBe('Test text');
    expect(created.fr).toBe('');
    expect(created.ar).toBe('');
    expect(created.dz).toBe('');
  });

  it('should update specific locale in translated text', () => {
    const { result } = renderHook(() => useTranslatedTextEditor());
    const original: TranslatedText = {
      en: 'English',
      fr: 'Français',
      ar: 'عربي',
      dz: 'دارجة',
    };

    const updated = result.current.updateTranslatedText(original, 'fr', 'Nouveau texte');

    expect(updated.en).toBe('English');
    expect(updated.fr).toBe('Nouveau texte');
    expect(updated.ar).toBe('عربي');
    expect(updated.dz).toBe('دارجة');
  });

  it('should return current locale', () => {
    const { result } = renderHook(() => useTranslatedTextEditor());
    expect(result.current.currentLocale).toBe('en');
  });
});
