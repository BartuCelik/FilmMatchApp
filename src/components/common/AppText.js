import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Colors, Fonts } from '../../constants/Colors';

const VARIANTS = StyleSheet.create({
  hero: {
    color: Colors.textPrimary,
    fontSize: 34,
    fontFamily: Fonts.display,
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontFamily: Fonts.display,
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontFamily: Fonts.display,
    lineHeight: 32,
  },
  section: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontFamily: Fonts.display,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  bodyStrong: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  caption: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  kicker: {
    color: Colors.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  button: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  numeric: {
    color: Colors.textPrimary,
    fontSize: 44,
    fontWeight: '800',
    textAlign: 'center',
  },
  success: {
    color: Colors.matchBright,
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: Colors.errorSoft,
    fontSize: 14,
    fontWeight: '500',
  },
});

/**
 * @param {'hero'|'title'|'screenTitle'|'section'|'body'|'bodyStrong'|'caption'|'kicker'|'button'|'numeric'|'success'|'error'} variant
 */
export function AppText({ variant = 'body', style, children, ...rest }) {
  return (
    <Text style={[VARIANTS[variant], style]} {...rest}>
      {children}
    </Text>
  );
}
