import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

/**
 * FilmMatch mark + wordmark — vektör ikon, tema renkleriyle uyumlu.
 */
export function FilmMatchLogo({
  accentColor = '#6366F1',
  accentSoft = '#818CF8',
  textColor = '#FFFFFF',
  taglineColor = '#9A9A9A',
  tagline,
}) {
  const gradIdRef = useRef(`fmgrad-${Math.random().toString(36).slice(2, 10)}`);
  const gradId = gradIdRef.current;

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Svg width={216} height={76} viewBox="0 0 216 76" accessibilityLabel="Film Match">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={accentColor} />
            <Stop offset="1" stopColor={accentSoft} />
          </LinearGradient>
        </Defs>

        {[20, 32, 44].map((cy) => (
          <Circle key={`L-${cy}`} cx={14} cy={cy} r={3} fill={taglineColor} opacity={0.45} />
        ))}
        {[20, 32, 44].map((cy) => (
          <Circle key={`R-${cy}`} cx={202} cy={cy} r={3} fill={taglineColor} opacity={0.45} />
        ))}

        <Rect x={26} y={10} width={164} height={52} rx={14} fill={`url(#${gradId})`} opacity={0.95} />
        <Rect x={26} y={10} width={164} height={52} rx={14} fill="none" stroke={accentSoft} strokeWidth={1} opacity={0.35} />

        <Polygon points="94,26 94,46 118,36" fill="#FFFFFF" opacity={0.95} />

        <Rect x={38} y={58} width={140} height={3} rx={1.5} fill={accentColor} opacity={0.35} />
      </Svg>

      <View style={styles.wordmark}>
        <Text style={[styles.film, { color: textColor }]}>FILM</Text>
        <Text style={[styles.match, { color: accentSoft }]}> MATCH</Text>
      </View>
      {tagline ? <Text style={[styles.tagline, { color: taglineColor }]}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 4,
  },
  film: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  match: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
