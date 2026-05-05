import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppPreferences } from '../../context/AppPreferencesContext';

const LANGUAGE_OPTIONS = ['tr', 'en', 'de', 'es', 'fr', 'it', 'ru'];

export function PreferencesHeaderControls({ palette }) {
  const { theme, toggleTheme, setLocale, locale } = useAppPreferences();
  const [isLanguageMenuOpen, setLanguageMenuOpen] = useState(false);

  const s = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          zIndex: 20,
        },
        languageMenuWrap: {
          position: 'relative',
          zIndex: 25,
        },
        langChip: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: palette.borderLight,
          backgroundColor: palette.surfaceMuted,
        },
        langChipActive: {
          borderColor: palette.indigo,
          backgroundColor: palette.indigoTrack,
        },
        langChipText: {
          fontSize: 12,
          fontWeight: '700',
          color: palette.textSecondary,
        },
        langChipTextActive: {
          color: palette.textPrimary,
        },
        chevron: {
          marginLeft: 6,
        },
        langMenu: {
          position: 'absolute',
          top: 40,
          right: 0,
          minWidth: 60,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: palette.borderLight,
          backgroundColor: palette.surface,
          padding: 6,
          gap: 6,
        },
        langMenuItem: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: palette.borderLight,
          backgroundColor: palette.surfaceMuted,
          alignItems: 'center',
        },
        themeBtn: {
          width: 40,
          height: 36,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: palette.borderLight,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.surfaceMuted,
        },
      }),
    [palette],
  );

  return (
    <View style={s.row}>
      <View style={s.languageMenuWrap}>
        <TouchableOpacity
          style={[s.langChip, s.langChipActive]}
          onPress={() => setLanguageMenuOpen((prev) => !prev)}
          activeOpacity={0.85}
        >
          <Text style={[s.langChipText, s.langChipTextActive]}>{locale.toUpperCase()}</Text>
          <Ionicons
            name={isLanguageMenuOpen ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={palette.textPrimary}
            style={s.chevron}
          />
        </TouchableOpacity>
        {isLanguageMenuOpen && (
          <View style={s.langMenu}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[s.langMenuItem, locale === lang && s.langChipActive]}
                onPress={() => {
                  setLocale(lang);
                  setLanguageMenuOpen(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={[s.langChipText, locale === lang && s.langChipTextActive]}>
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity style={s.themeBtn} onPress={toggleTheme} activeOpacity={0.85}>
        <Ionicons
          name={theme === 'dark' ? 'sunny-outline' : 'moon'}
          size={20}
          color={palette.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );
}
