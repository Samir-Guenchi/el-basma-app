// Theme configuration with light and dark modes
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Background
  background: string;
  surface: string;
  surfaceElevated: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  
  // Borders & Dividers
  border: string;
  divider: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Special
  overlay: string;
  shadow: string;
  cardGradientStart: string;
  cardGradientEnd: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: string };
    h2: { fontSize: number; fontWeight: string };
    h3: { fontSize: number; fontWeight: string };
    body: { fontSize: number; fontWeight: string };
    caption: { fontSize: number; fontWeight: string };
  };
}

const lightColors: ThemeColors = {
  primary: '#E91E63',
  primaryLight: '#F8BBD9',
  primaryDark: '#C2185B',
  
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  text: '#1A1A2E',
  textSecondary: '#4A4A68',
  textMuted: '#9E9E9E',
  textOnPrimary: '#FFFFFF',
  
  border: '#E8E8EF',
  divider: '#F0F0F5',
  
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.08)',
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F8F9FF',
};

const darkColors: ThemeColors = {
  primary: '#F48FB1',
  primaryLight: '#F8BBD9',
  primaryDark: '#EC407A',
  
  background: '#0D0D1A',
  surface: '#1A1A2E',
  surfaceElevated: '#252542',
  
  text: '#F5F5F7',
  textSecondary: '#B8B8C7',
  textMuted: '#6B6B80',
  textOnPrimary: '#0D0D1A',
  
  border: '#2D2D45',
  divider: '#252542',
  
  success: '#66BB6A',
  warning: '#FFB74D',
  error: '#EF5350',
  info: '#42A5F5',
  
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  cardGradientStart: '#1A1A2E',
  cardGradientEnd: '#252542',
};

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const },
    h2: { fontSize: 22, fontWeight: '600' as const },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const },
    caption: { fontSize: 14, fontWeight: '400' as const },
  },
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  ...baseTheme,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  ...baseTheme,
};

export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
