import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export function SurfaceCard({ children, selected = false, style }) {
  return <View style={[styles.card, selected && styles.selected, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  selected: { borderWidth: 1.5, borderColor: Colors.accent },
});
