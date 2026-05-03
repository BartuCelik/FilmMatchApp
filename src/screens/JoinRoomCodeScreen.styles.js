import { StyleSheet } from 'react-native';

/**
 * @param {Record<string, string>} c
 */
export function createJoinCodeStyles(c) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    root: {
      flex: 1,
      backgroundColor: c.surface,
      paddingHorizontal: 22,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingTop: 8,
      paddingBottom: 8,
    },
    title: {
      marginTop: 12,
      fontSize: 22,
      fontWeight: '800',
      color: c.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '500',
      color: c.textMuted,
      textAlign: 'center',
    },
    slotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      marginTop: 36,
      marginBottom: 8,
    },
    slot: {
      minWidth: 36,
      paddingBottom: 8,
      borderBottomWidth: 3,
      borderBottomColor: c.indigo,
      alignItems: 'center',
    },
    slotChar: {
      fontSize: 24,
      fontWeight: '700',
      color: c.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    slotDash: {
      fontSize: 22,
      fontWeight: '400',
      color: c.textSubtle,
    },
    hiddenInput: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
    },
    keypad: {
      flex: 1,
      justifyContent: 'flex-end',
      marginBottom: 8,
      paddingTop: 16,
      gap: 10,
    },
    keypadRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 14,
    },
    key: {
      width: 72,
      height: 52,
      borderRadius: 12,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyText: {
      fontSize: 22,
      fontWeight: '600',
      color: c.textPrimary,
    },
    confirmBtn: {
      marginTop: 20,
    },
    linkBtn: {
      marginTop: 16,
      alignSelf: 'center',
      paddingVertical: 10,
    },
    linkText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.indigoLight,
    },
    error: {
      marginTop: 12,
      textAlign: 'center',
    },
  });
}
