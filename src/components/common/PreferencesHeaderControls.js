import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAppPreferences } from '../../context/AppPreferencesContext';

const LANGUAGE_OPTIONS = ['tr', 'en', 'de', 'es', 'fr', 'it', 'ru'];

export function PreferencesHeaderControls() {
  const { setLocale, locale } = useAppPreferences();
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
          borderColor: Colors.border,
          backgroundColor: Colors.surface2,
        },
        langChipActive: {
          borderColor: Colors.accent,
          backgroundColor: Colors.accentDeep,
        },
        langChipText: {
          fontSize: 12,
          fontWeight: '700',
          color: Colors.textSecondary,
        },
        langChipTextActive: {
          color: Colors.textPrimary,
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
          borderColor: Colors.border,
          backgroundColor: Colors.surface,
          padding: 6,
          gap: 6,
        },
        langMenuItem: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.surface2,
          alignItems: 'center',
        },
      }),
    [],
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
            color={Colors.textPrimary}
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
    </View>
  );
}
