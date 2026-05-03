import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/Colors';

const VARIANTS = StyleSheet.create({
  hero: {
    color: Colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  section: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
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
    color: Colors.indigoLight,
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
