import { I18nManager, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { getCurrentLanguage, isRTL as checkRTL } from '@/i18n';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Check if current layout is RTL
 */
export const isRTL = (): boolean => {
  return I18nManager.isRTL;
};

/**
 * Get text alignment based on RTL
 */
export const getTextAlign = (): 'left' | 'right' => {
  return isRTL() ? 'right' : 'left';
};

/**
 * Get flex direction based on RTL
 */
export const getFlexDirection = (): 'row' | 'row-reverse' => {
  return isRTL() ? 'row-reverse' : 'row';
};

/**
 * Get icon flip transform for RTL
 */
export const getIconTransform = (): { transform: { scaleX: number }[] } | {} => {
  return isRTL() ? { transform: [{ scaleX: -1 }] } : {};
};

/**
 * Flip horizontal margin/padding for RTL
 */
export const flipHorizontal = (
  start: number,
  end: number
): { marginStart: number; marginEnd: number } => {
  return {
    marginStart: start,
    marginEnd: end,
  };
};

/**
 * Create RTL-aware styles
 * Automatically flips left/right properties for RTL layouts
 */
export const createRTLStyles = <T extends NamedStyles<T>>(
  styles: T | NamedStyles<T>
): T => {
  if (!isRTL()) {
    return StyleSheet.create(styles) as T;
  }

  const flippedStyles: Record<string, ViewStyle | TextStyle | ImageStyle> = {};

  for (const key in styles) {
    const style = styles[key] as ViewStyle & TextStyle;
    const flippedStyle: ViewStyle & TextStyle = { ...style };

    // Flip margin
    if ('marginLeft' in style || 'marginRight' in style) {
      flippedStyle.marginLeft = style.marginRight;
      flippedStyle.marginRight = style.marginLeft;
    }

    // Flip padding
    if ('paddingLeft' in style || 'paddingRight' in style) {
      flippedStyle.paddingLeft = style.paddingRight;
      flippedStyle.paddingRight = style.paddingLeft;
    }

    // Flip position
    if ('left' in style || 'right' in style) {
      flippedStyle.left = style.right;
      flippedStyle.right = style.left;
    }

    // Flip border radius
    if ('borderTopLeftRadius' in style || 'borderTopRightRadius' in style) {
      flippedStyle.borderTopLeftRadius = style.borderTopRightRadius;
      flippedStyle.borderTopRightRadius = style.borderTopLeftRadius;
    }
    if ('borderBottomLeftRadius' in style || 'borderBottomRightRadius' in style) {
      flippedStyle.borderBottomLeftRadius = style.borderBottomRightRadius;
      flippedStyle.borderBottomRightRadius = style.borderBottomLeftRadius;
    }

    // Flip text align
    if (style.textAlign === 'left') {
      flippedStyle.textAlign = 'right';
    } else if (style.textAlign === 'right') {
      flippedStyle.textAlign = 'left';
    }

    // Flip flex direction
    if (style.flexDirection === 'row') {
      flippedStyle.flexDirection = 'row-reverse';
    } else if (style.flexDirection === 'row-reverse') {
      flippedStyle.flexDirection = 'row';
    }

    flippedStyles[key] = flippedStyle;
  }

  return StyleSheet.create(flippedStyles as T) as T;
};

/**
 * RTL-aware style hook
 */
export const useRTLStyles = <T extends NamedStyles<T>>(
  stylesFn: (isRTL: boolean) => T | NamedStyles<T>
): T => {
  const rtl = isRTL();
  return StyleSheet.create(stylesFn(rtl)) as T;
};

/**
 * Get writing direction for Text component
 */
export const getWritingDirection = (): 'ltr' | 'rtl' => {
  const lang = getCurrentLanguage();
  return checkRTL(lang) ? 'rtl' : 'ltr';
};

/**
 * RTL-aware absolute positioning
 */
export const absolutePosition = (
  position: 'start' | 'end',
  value: number
): ViewStyle => {
  const isStart = position === 'start';
  if (isRTL()) {
    return isStart ? { right: value } : { left: value };
  }
  return isStart ? { left: value } : { right: value };
};
