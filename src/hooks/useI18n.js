import { useCallback } from 'react';
import { STRINGS } from '../i18n/strings';
import { useAppPreferences } from '../context/AppPreferencesContext';

export function useI18n() {
  const { locale } = useAppPreferences();

  const t = useCallback(
    (key) => STRINGS[locale]?.[key] ?? STRINGS.tr[key] ?? key,
    [locale],
  );

  return { t, locale };
}
