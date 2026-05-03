import { StyleSheet } from 'react-native';

/**
 * @param {Record<string, string>} c — getPalette(theme)
 */
export function createHomeStyles(c) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
    },
    keyboard: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: c.surface,
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
      backgroundColor: c.surfaceMuted,
      color: c.textPrimary,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      fontSize: 16,
      borderWidth: 1,
      borderColor: c.borderLight,
      textAlign: 'center',
    },
    avatarSectionLabel: {
      marginTop: 20,
      marginBottom: 12,
      color: c.textSecondary,
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
      backgroundColor: c.surfaceElevated,
      borderWidth: 2,
      borderColor: c.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 6,
      shadowColor: c.glowIndigo,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    avatarBubbleSelected: {
      borderColor: c.indigoLight,
      backgroundColor: c.indigoTrack,
      shadowColor: c.indigoGlow,
      shadowOpacity: 0.85,
      shadowRadius: 14,
      elevation: 8,
    },
    avatarEmoji: {
      fontSize: 28,
      color: c.textPrimary,
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
      color: c.indigoLight,
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
