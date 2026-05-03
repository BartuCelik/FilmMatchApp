import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';
import { AppText } from './AppText';

export function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textVariant = 'button',
}) {
  const busy = loading || disabled;

  const handlePress = () => {
    if (busy) return;
    (async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        /* haptics unavailable */
      }
      onPress?.();
    })();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        busy && styles.disabled,
        pressed && !busy && styles.pressed,
        style,
      ]}
      onPress={handlePress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: busy, busy: loading }}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={Colors.textPrimary} />
        ) : (
          <AppText variant={textVariant} style={variant === 'secondary' && styles.secondaryText}>
            {title}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    marginTop: 14,
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.indigo,
    shadowColor: Colors.glowIndigoStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  secondary: {
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.92,
  },
});
