import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInAnonymously } from 'firebase/auth';
import { AppButton } from '../components/common/AppButton';
import { AppText } from '../components/common/AppText';
import { AVATAR_CHOICES } from '../constants/avatars';
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
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');

  const trimmedName = username.trim();
  const isBusy = pendingAction !== null;
  const createDisabled = trimmedName.length === 0 || selectedAvatarId == null || isBusy;
  const joinDisabled = joinCode.length !== 6 || selectedAvatarId == null || isBusy;

  const handleCreateSession = async () => {
    if (trimmedName.length === 0 || selectedAvatarId == null || pendingAction) return;
    setError('');
    setPendingAction('create');
    try {
      const user = await ensureAnonymousUser();
      const { sessionId, sessionCode } = await createMatchSession(user.uid, selectedAvatarId);
      setSessionParams({
        username: trimmedName,
        sessionId,
        code: sessionCode,
        avatarId: selectedAvatarId,
      });
      navigation.navigate('ModeSelection');
    } catch (e) {
      setError(e?.message || 'Oda oluşturulamadı. Bağlantınızı kontrol edin.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleJoinSession = async () => {
    if (joinCode.length !== 6 || selectedAvatarId == null || pendingAction) return;
    setError('');
    setPendingAction('join');
    try {
      const user = await ensureAnonymousUser();
      const sessionId = await joinMatchSession(user.uid, joinCode, selectedAvatarId);
      setSessionParams({
        username: trimmedName || 'Misafir',
        sessionId,
        code: joinCode,
        avatarId: selectedAvatarId,
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

            <AppText variant="caption" style={styles.avatarSectionLabel}>
              Avatarını seç
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarScroll}
            >
              {AVATAR_CHOICES.map((a) => {
                const selected = selectedAvatarId === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.avatarBubble, selected && styles.avatarBubbleSelected]}
                    onPress={() => setSelectedAvatarId(a.id)}
                    activeOpacity={0.85}
                    disabled={isBusy}
                  >
                    <AppText variant="body" style={styles.avatarEmoji}>
                      {a.emoji}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
  avatarSectionLabel: {
    marginTop: 18,
    marginBottom: 10,
    color: Colors.textSecondary,
  },
  avatarScroll: {
    paddingVertical: 4,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: Colors.glowIndigo,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarBubbleSelected: {
    borderColor: Colors.indigoLight,
    backgroundColor: Colors.indigoTrack,
    shadowColor: Colors.indigoGlow,
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarEmoji: {
    fontSize: 28,
    color: Colors.textPrimary,
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
