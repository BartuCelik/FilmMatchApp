import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_LOCALE = '@filmmatch/locale';
const SUPPORTED_LOCALES = ['tr', 'en', 'de', 'es', 'fr', 'it', 'ru'];

const AppPreferencesContext = createContext(null);

export function AppPreferencesProvider({ children }) {
  const [locale, setLocaleState] = useState('tr');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const l = await AsyncStorage.getItem(STORAGE_LOCALE);
        if (cancelled) return;
        if (SUPPORTED_LOCALES.includes(l)) setLocaleState(l);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_LOCALE, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  }
  return ctx;
}
