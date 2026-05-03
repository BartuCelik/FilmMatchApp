import React, { useCallback, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  welcomeScreenColors,
  welcomeScreenStyles as styles,
} from './WelcomeScreen.styles';

const AVATARS = ['🎬', '🍿', '🚀', '💎', '🔥', '😎', '🎨', '🎭'];

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🎬');
  const [step, setStep] = useState('profile');

  const handleCreateRoom = useCallback(() => {}, []);
  const handleJoinRoom = useCallback(() => {}, []);

  const nameOk = name.trim().length > 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>
        {step === 'profile' ? (
          <>
            <Text style={styles.header}>Kim izliyor?</Text>

            <View style={styles.grid}>
              {AVATARS.map((emoji) => {
                const on = selectedAvatar === emoji;
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => setSelectedAvatar(emoji)}
                    style={[styles.avatarCell, on && styles.avatarCellOn]}
                  >
                    <Text style={styles.avatarEmoji}>{emoji}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>İsim</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="En az 3 karakter"
              placeholderTextColor={welcomeScreenColors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
            />

            {nameOk ? (
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={() => setStep('action')}
              >
                <Text style={styles.primaryBtnText}>Devam</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}

        {step === 'action' && nameOk ? (
          <View style={styles.actionBlock}>
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
              onPress={handleCreateRoom}
            >
              <Text style={styles.primaryBtnText}>Oda Kur</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed]}
              onPress={handleJoinRoom}
            >
              <Text style={styles.outlineBtnText}>Odaya Katıl</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
