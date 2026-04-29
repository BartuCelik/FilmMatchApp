import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({ navigation }) {
  // Keep the username in local state before room setup.
  const [username, setUsername] = useState('');
  const isCreateRoomDisabled = useMemo(() => username.trim().length === 0, [username]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FILM MATCH</Text>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name..."
          placeholderTextColor="#9A9A9A"
          value={username}
          onChangeText={setUsername}
        />

        {/* User must enter a name before moving to the next step. */}
        <TouchableOpacity
          style={[styles.button, isCreateRoomDisabled && styles.buttonDisabled]}
          onPress={() => navigation.navigate('ModeSelection', { username: username.trim() })}
          disabled={isCreateRoomDisabled}
        >
          <Text style={styles.buttonText}>Create Room</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    position: 'absolute',
    top: 72,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  content: {
    width: '100%',
    maxWidth: 360,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 16,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#8B3DFF',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
