import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInAnonymously } from 'firebase/auth';
import { AppButton } from '../components/common/AppButton';
import { AppText } from '../components/common/AppText';
import { Colors } from '../constants/Colors';
import { auth } from '../services/firebaseConfig';
import { setSessionParams } from '../services/navigationService';
import { createMatchSession, joinMatchSession } from '../services/sessionService';

async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

export default function HomeScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');

  const trimmedName = username.trim();
  const isBusy = pendingAction !== null;
  const createDisabled = trimmedName.length === 0 || isBusy;
  const joinDisabled = joinCode.length !== 6 || isBusy;

  const handleCreateSession = async () => {
    if (trimmedName.length === 0 || pendingAction) return;
    setError('');
    setPendingAction('create');
    try {
      const user = await ensureAnonymousUser();
      const { sessionId, sessionCode } = await createMatchSession(user.uid);
      setSessionParams({
        username: trimmedName,
        sessionId,
        code: sessionCode,
      });
      navigation.navigate('ModeSelection');
    } catch (e) {
      setError(e?.message || 'Oda oluşturulamadı. Bağlantınızı kontrol edin.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleJoinSession = async () => {
    if (joinCode.length !== 6 || pendingAction) return;
    setError('');
    setPendingAction('join');
    try {
      const user = await ensureAnonymousUser();
      const sessionId = await joinMatchSession(user.uid, joinCode);
      setSessionParams({
        username: trimmedName || 'Misafir',
        sessionId,
        code: joinCode,
      });
      navigation.navigate('ModeSelection');
    } catch (e) {
      setError(e?.message || 'Odaya katılınamadı.');
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.container}>
          <AppText variant="hero" style={styles.title}>
            FILM MATCH
          </AppText>

          <View style={styles.content}>
            <TextInput
              style={styles.input}
              placeholder="Adınızı girin..."
              placeholderTextColor={Colors.textMuted}
              value={username}
              onChangeText={setUsername}
              editable={!isBusy}
            />

            <AppButton
              title="Oda Kur"
              onPress={handleCreateSession}
              loading={pendingAction === 'create'}
              disabled={createDisabled}
            />

            <AppText variant="caption" style={styles.sectionLabel}>
              Odaya katıl
            </AppText>
            <TextInput
              style={styles.input}
              placeholder="6 haneli kod"
              placeholderTextColor={Colors.textMuted}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isBusy}
            />

            <AppButton
              title="Odaya Katıl"
              onPress={handleJoinSession}
              loading={pendingAction === 'join'}
              disabled={joinDisabled}
            />

            {error ? <AppText variant="error" style={styles.errorText}>{error}</AppText> : null}
          </View>

          <StatusBar style="light" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 360,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.surfaceMuted,
    color: Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 16,
  },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 8,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: 14,
    textAlign: 'center',
  },
});
