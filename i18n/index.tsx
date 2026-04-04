import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import en from './en';
import es from './es';

export type Locale = 'en' | 'es';

type Translations = typeof en;

const translations: Record<Locale, Translations> = { en, es };

const STORAGE_KEY = '@hourly/locale';

/** Detect if device locale starts with 'es' */
const getDeviceLocale = (): Locale => {
  const locales = Localization.getLocales();
  if (locales.length > 0 && locales[0].languageCode === 'es') {
    return 'es';
  }
  return 'en';
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getDeviceLocale());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'en' || stored === 'es') {
        setLocaleState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useMemo(() => translations[locale], [locale]);

  if (!loaded) return null;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

export default I18nProvider;
