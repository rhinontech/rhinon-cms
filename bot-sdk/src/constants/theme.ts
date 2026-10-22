// Theme constants and CSS variables

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderColor: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
}

export const LIGHT_THEME: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fa',
  bgTertiary: '#e9ecef',
  textPrimary: '#212529',
  textSecondary: '#6c757d',
  textTertiary: '#adb5bd',
  borderColor: '#dee2e6',
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.1)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 20px rgba(0, 0, 0, 0.1)',
};

export const DARK_THEME: ThemeColors = {
  bgPrimary: '#1a1a2e',
  bgSecondary: '#16213e',
  bgTertiary: '#0f1419',
  textPrimary: '#e0e0e0',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  borderColor: '#2a2a3e',
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.4)',
  shadowLg: '0 10px 20px rgba(0, 0, 0, 0.5)',
};

export const getTheme = (theme: 'light' | 'dark'): ThemeColors => {
  return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
};

// Detect system preference
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Get effective theme based on config
export const getEffectiveTheme = (configTheme?: 'light' | 'dark' | 'system'): 'light' | 'dark' => {
  if (configTheme === 'system' || !configTheme) {
    return getSystemTheme();
  }
  return configTheme;
};

// Legacy theme vars export for backward compatibility
export const themeVars = {
  '--chatbot-primary': '#1e1a6cff',
} as React.CSSProperties;
