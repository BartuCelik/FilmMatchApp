import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

export function IconSquare({
  children,
  onPress,
  variant = 'surface',
  size = 38,
  style,
  accessibilityLabel,
}) {
  const box = { width: size, height: size, borderRadius: size * 0.3 };
  const accent = variant === 'accent';
  const content = accent ? (
    <>
      <LinearGradient
        colors={[Colors.accent, Colors.accentDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </>
  ) : (
    children
  );
  const baseStyle = [styles.base, box, !accent && styles.surface, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        style={({ pressed }) => [...baseStyle, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View style={baseStyle} accessibilityLabel={accessibilityLabel}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  surface: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  pressed: { opacity: 0.85 },
});
