import { StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export function createJoinCodeStyles() {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    root: {
      flex: 1,
      backgroundColor: Colors.background,
      paddingHorizontal: 22,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingBottom: 8,
    },
    title: {
      marginTop: 12,
      color: Colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '500',
      color: Colors.textMuted,
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
      borderBottomColor: Colors.accent,
      alignItems: 'center',
    },
    slotChar: {
      fontSize: 24,
      fontWeight: '700',
      color: Colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    slotDash: {
      fontSize: 22,
      fontWeight: '400',
      color: Colors.textSubtle,
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
      backgroundColor: Colors.surface2,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyText: {
      fontSize: 22,
      fontWeight: '600',
      color: Colors.textPrimary,
    },
    confirmBtn: {
      marginTop: 20,
    },
    error: {
      marginTop: 12,
      textAlign: 'center',
    },
  });
}
