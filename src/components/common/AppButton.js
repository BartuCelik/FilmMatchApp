import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
      {variant === 'primary' && (
        <LinearGradient
          colors={[Colors.accent, Colors.accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? Colors.onAccent : Colors.textPrimary} />
        ) : (
          <AppText
            variant={textVariant}
            style={variant === 'primary' ? styles.primaryText : styles.secondaryText}
          >
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
  secondary: {
    backgroundColor: Colors.surface,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryText: {
    color: Colors.onAccent,
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
