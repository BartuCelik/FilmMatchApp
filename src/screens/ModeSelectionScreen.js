import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MODE_OPTIONS = [
  {
    key: 'movie',
    title: 'Movie Mode',
    subtitle: 'Match with popular movies',
  },
  {
    key: 'tv',
    title: 'TV Series Mode',
    subtitle: 'Discover popular and top rated series',
  },
];

export default function ModeSelectionScreen({ navigation, route }) {
  const username = route?.params?.username || '';

  // We pass selected mode to the match screen.
  const handleModeSelect = (mode) => {
    const category = mode === 'tv' ? 'mixed' : 'popular';
    navigation.navigate('Match', { mode, category, username });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Mode</Text>
      <Text style={styles.description}>Select a content mode for your room</Text>

      <View style={styles.options}>
        {MODE_OPTIONS.map((modeOption) => (
          <TouchableOpacity
            key={modeOption.key}
            style={styles.modeCard}
            onPress={() => handleModeSelect(modeOption.key)}
            activeOpacity={0.9}
          >
            <Text style={styles.modeTitle}>{modeOption.title}</Text>
            <Text style={styles.modeSubtitle}>{modeOption.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 90,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
  },
  description: {
    marginTop: 8,
    color: '#B8B8B8',
    fontSize: 15,
  },
  options: {
    marginTop: 36,
    gap: 14,
  },
  modeCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modeTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  modeSubtitle: {
    marginTop: 8,
    color: '#B8B8B8',
    fontSize: 14,
  },
});
