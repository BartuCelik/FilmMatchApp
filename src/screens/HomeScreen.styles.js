import { StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export function createHomeStyles() {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    keyboard: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: Colors.surface,
    },
    topBar: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      zIndex: 20,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    mainScroll: {
      flex: 1,
    },
    scrollInner: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: 56,
      paddingBottom: 32,
      alignItems: 'center',
    },
    profileColumn: {
      width: '100%',
      maxWidth: 360,
      alignItems: 'stretch',
    },
    logoBlock: {
      alignItems: 'center',
      marginBottom: 8,
    },
    input: {
      width: '100%',
      backgroundColor: Colors.surface2,
      color: Colors.textPrimary,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      fontSize: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      textAlign: 'center',
    },
    avatarSectionLabel: {
      marginTop: 20,
      marginBottom: 12,
      color: Colors.textSecondary,
      textAlign: 'center',
      alignSelf: 'center',
    },
    avatarScroll: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      gap: 12,
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
      justifyContent: 'center',
    },
    avatarBubble: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: Colors.surfaceElevated,
      borderWidth: 2,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 6,
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarBubbleSelected: {
      borderColor: Colors.accent,
      backgroundColor: Colors.accentDeep,
      shadowColor: Colors.gold,
      shadowOpacity: 0.85,
      shadowRadius: 14,
      elevation: 8,
    },
    avatarEmoji: {
      fontSize: 28,
      color: Colors.textPrimary,
    },
    continueBtn: {
      marginTop: 32,
      alignSelf: 'stretch',
    },
    actionsBlock: {
      width: '100%',
      maxWidth: 360,
      gap: 14,
      alignSelf: 'center',
    },
    backLink: {
      marginTop: 16,
      alignSelf: 'center',
      paddingVertical: 8,
    },
    backLinkText: {
      fontSize: 15,
      color: Colors.accent,
      fontWeight: '600',
    },
    sectionSpacing: {
      marginTop: 8,
    },
    errorText: {
      marginTop: 14,
      textAlign: 'center',
    },
  });
}
