import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

/**
 * Slider with gradient track (transparent min track reveals gradient underneath).
 */
export function GradientEnergySlider({ value, onValueChange, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[Colors.indigoDark, Colors.indigo, Colors.indigoLight]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      />
      <View style={styles.sliderInset}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={value}
          onValueChange={onValueChange}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor={Colors.sliderMaxTrack}
          thumbTintColor={Colors.indigoGlow}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 44,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  sliderInset: {
    marginHorizontal: Platform.OS === 'ios' ? 0 : 4,
  },
  slider: {
    width: '100%',
    height: 44,
  },
});
