import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_THEME = '@filmmatch/theme';
const STORAGE_LOCALE = '@filmmatch/locale';
const SUPPORTED_LOCALES = ['tr', 'en', 'de', 'es', 'fr', 'it', 'ru'];

const AppPreferencesContext = createContext(null);

export function AppPreferencesProvider({ children }) {
  const [theme, setThemeState] = useState('dark');
  const [locale, setLocaleState] = useState('tr');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [t, l] = await Promise.all([
          AsyncStorage.getItem(STORAGE_THEME),
          AsyncStorage.getItem(STORAGE_LOCALE),
        ]);
        if (cancelled) return;
        if (t === 'light' || t === 'dark') setThemeState(t);
        if (SUPPORTED_LOCALES.includes(l)) setLocaleState(l);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next) => {
    if (next !== 'dark' && next !== 'light') return;
    setThemeState(next);
    AsyncStorage.setItem(STORAGE_THEME, next).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_THEME, next).catch(() => {});
      return next;
    });
  }, []);

  const setLocale = useCallback((next) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_LOCALE, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      theme,
      locale,
      setTheme,
      toggleTheme,
      setLocale,
    }),
    [theme, locale, setTheme, toggleTheme, setLocale],
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
