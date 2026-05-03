import { Colors } from '../constants/Colors';

/** Mevcut uygulama paleti = koyu tema tabanı */
export const darkPalette = { ...Colors };

export const lightPalette = {
  ...Colors,
  background: '#ECECF2',
  surface: '#FFFFFF',
  surfaceElevated: '#F7F7FA',
  surfaceMuted: '#E8E8EF',
  surfaceCard: '#F0F0F8',

  border: '#D8D8E0',
  borderLight: '#CCCCD6',
  borderAccent: '#D4D0E8',

  textPrimary: '#121218',
  textSecondary: '#4A4A55',
  textMuted: '#6B6B78',
  textSubtle: '#8A8A96',
  textOnAccent: '#1E1B2E',

  indigo: '#4F46E5',
  indigoDark: '#4338CA',
  indigoLight: '#6366F1',
  indigoMuted: '#C7D2FE',
  indigoGlow: '#818CF8',
  indigoTrack: '#E0E7FF',

  overlay: 'rgba(0, 0, 0, 0.35)',
  trackUnderlay: '#E2E2EA',
  sliderMaxTrack: 'rgba(255, 255, 255, 0.72)',

  glowIndigo: 'rgba(79, 70, 229, 0.35)',
  glowIndigoStrong: 'rgba(99, 102, 241, 0.55)',
};

/**
 * @param {'dark' | 'light'} theme
 */
export function getPalette(theme) {
  return theme === 'light' ? lightPalette : darkPalette;
}
