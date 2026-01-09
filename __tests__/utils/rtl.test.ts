import { I18nManager } from 'react-native';
import {
  isRTL,
  getTextAlign,
  getFlexDirection,
  getIconTransform,
  flipHorizontal,
  absolutePosition,
  getWritingDirection,
} from '@/utils/rtl';

// Mock I18nManager
jest.mock('react-native', () => ({
  I18nManager: {
    isRTL: false,
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

// Mock i18n
jest.mock('@/i18n', () => ({
  getCurrentLanguage: () => 'en',
  isRTL: (lang: string) => ['ar', 'dz'].includes(lang),
}));

describe('RTL utilities', () => {
  describe('isRTL', () => {
    it('should return false for LTR layout', () => {
      (I18nManager as any).isRTL = false;
      expect(isRTL()).toBe(false);
    });

    it('should return true for RTL layout', () => {
      (I18nManager as any).isRTL = true;
      expect(isRTL()).toBe(true);
    });
  });

  describe('getTextAlign', () => {
    it('should return left for LTR', () => {
      (I18nManager as any).isRTL = false;
      expect(getTextAlign()).toBe('left');
    });

    it('should return right for RTL', () => {
      (I18nManager as any).isRTL = true;
      expect(getTextAlign()).toBe('right');
    });
  });

  describe('getFlexDirection', () => {
    it('should return row for LTR', () => {
      (I18nManager as any).isRTL = false;
      expect(getFlexDirection()).toBe('row');
    });

    it('should return row-reverse for RTL', () => {
      (I18nManager as any).isRTL = true;
      expect(getFlexDirection()).toBe('row-reverse');
    });
  });

  describe('getIconTransform', () => {
    it('should return empty object for LTR', () => {
      (I18nManager as any).isRTL = false;
      expect(getIconTransform()).toEqual({});
    });

    it('should return scaleX transform for RTL', () => {
      (I18nManager as any).isRTL = true;
      expect(getIconTransform()).toEqual({ transform: [{ scaleX: -1 }] });
    });
  });

  describe('flipHorizontal', () => {
    it('should return margin start and end', () => {
      const result = flipHorizontal(10, 20);
      expect(result).toEqual({ marginStart: 10, marginEnd: 20 });
    });
  });

  describe('absolutePosition', () => {
    it('should return left for start in LTR', () => {
      (I18nManager as any).isRTL = false;
      expect(absolutePosition('start', 10)).toEqual({ left: 10 });
    });

    it('should return right for end in LTR', () => {
      (I18nManager as any).isRTL = false;
      expect(absolutePosition('end', 10)).toEqual({ right: 10 });
    });

    it('should return right for start in RTL', () => {
      (I18nManager as any).isRTL = true;
      expect(absolutePosition('start', 10)).toEqual({ right: 10 });
    });

    it('should return left for end in RTL', () => {
      (I18nManager as any).isRTL = true;
      expect(absolutePosition('end', 10)).toEqual({ left: 10 });
    });
  });

  describe('getWritingDirection', () => {
    it('should return ltr for English', () => {
      expect(getWritingDirection()).toBe('ltr');
    });
  });
});
