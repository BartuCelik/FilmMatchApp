import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppPreferences } from '../../context/AppPreferencesContext';

export function PreferencesHeaderControls({ palette }) {
  const { theme, toggleTheme, setLocale, locale } = useAppPreferences();

  const s = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
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
      <TouchableOpacity
        style={[s.langChip, locale === 'tr' && s.langChipActive]}
        onPress={() => setLocale('tr')}
        activeOpacity={0.85}
      >
        <Text style={[s.langChipText, locale === 'tr' && s.langChipTextActive]}>TR</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.langChip, locale === 'en' && s.langChipActive]}
        onPress={() => setLocale('en')}
        activeOpacity={0.85}
      >
        <Text style={[s.langChipText, locale === 'en' && s.langChipTextActive]}>EN</Text>
      </TouchableOpacity>
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
