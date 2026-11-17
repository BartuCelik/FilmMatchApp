import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

const POINTS = {
  deck: '58,0 100,0 100,70 22,100 0,100 0,62',
  list: '70,0 100,0 100,40 0,78 0,55',
};

export function WedgeBackground({ shape = 'deck' }) {
  const id = useRef(`fmwedge-${Math.random().toString(36).slice(2, 10)}`).current;
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={Colors.accent} />
          <Stop offset="1" stopColor={Colors.accentDeep} />
        </LinearGradient>
      </Defs>
      <Polygon points={POINTS[shape] ?? POINTS.deck} fill={`url(#${id})`} opacity={0.95} />
    </Svg>
  );
}
