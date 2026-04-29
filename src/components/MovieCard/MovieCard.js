import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { movieCardStyles as styles } from './MovieCard.styles';

const getScoreColor = (score) => {
  if (score >= 7.5) return '#3DDC84';
  if (score >= 5) return '#F4C542';
  return '#FF5C6A';
};

function ScoreRing({ score }) {
  const size = 52;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(10, Number(score) || 0));
  const offset = circumference * (1 - value / 10);

  return (
    <View style={styles.scoreWrap}>
      <Svg width={size} height={size}>
        <Circle stroke="rgba(255,255,255,0.2)" fill="transparent" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <Circle
          stroke={getScoreColor(value)}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.scoreCenter}>
        <Text style={styles.scoreText}>{value.toFixed(1)}</Text>
      </View>
    </View>
  );
}

export default function MovieCard({ item, imageUri, onPress, onImageError }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: imageUri }} style={styles.poster} resizeMode="cover" onError={onImageError} />

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.gradient}>
        <View style={styles.metaRow}>
          <View style={styles.metaTextWrap}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>IMDb Score</Text>
          </View>
          <ScoreRing score={item.score} />
        </View>
      </LinearGradient>

      <Pressable style={styles.infoButton} onPress={onPress}>
        <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
      </Pressable>
    </Pressable>
  );
}
