import React, { useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { actionButtonStyles as styles } from './ActionButtons.styles';

function CircleButton({ icon, color, onPress, haptic }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = () =>
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.12, useNativeDriver: true, speed: 20 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18 }),
    ]).start();

  const handlePress = async () => {
    animate();
    try {
      if (haptic === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {}
    onPress();
  };

  return (
    <Animated.View style={[styles.actionShadow, { transform: [{ scale }] }]}>
      <Pressable style={styles.actionButton} onPress={handlePress}>
        <AntDesign name={icon} size={26} color={color} />
      </Pressable>
    </Animated.View>
  );
}

export default function ActionButtons({ onDislike, onLike }) {
  return (
    <View style={styles.actions}>
      <CircleButton icon="close" color="#FF4D67" onPress={onDislike} haptic="impact" />
      <CircleButton icon="heart" color="#FF5FA2" onPress={onLike} haptic="success" />
    </View>
  );
}
