import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';

type AppThemeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
  colors: Record<string, string>;
};

import { tabDarkTheme, tabLightTheme } from './theme';

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');

  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const colors = useMemo(() => (mode === 'dark' ? tabDarkTheme : tabLightTheme), [mode]);

  return (
    <AppThemeContext.Provider value={{ mode, toggleMode, colors }}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
