// Theme hook - handles theme detection and changes
import { useEffect, useState, useCallback } from 'react';
import type { Theme } from '@/types';
import { getEffectiveTheme, getSystemTheme } from '@/constants/theme';

export const useTheme = (configTheme?: Theme) => {
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => 
    getEffectiveTheme(configTheme)
  );

  useEffect(() => {
    setEffectiveTheme(getEffectiveTheme(configTheme));

    // Listen for system theme changes if theme is 'system'
    if (configTheme === 'system' || !configTheme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleThemeChange = (e: MediaQueryListEvent) => {
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
  }, [configTheme]);

  const toggleTheme = useCallback(() => {
    setEffectiveTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return {
    theme: effectiveTheme,
    isDark: effectiveTheme === 'dark',
    isLight: effectiveTheme === 'light',
    toggleTheme,
    systemTheme: getSystemTheme(),
  };
};

export default useTheme;
