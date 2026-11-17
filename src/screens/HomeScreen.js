import React, { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInAnonymously } from 'firebase/auth';
import { AppButton } from '../components/common/AppButton';
import { AppText } from '../components/common/AppText';
import { IconSquare } from '../components/common/IconSquare';
import { SurfaceCard } from '../components/common/SurfaceCard';
import { WedgeBackground } from '../components/common/WedgeBackground';
import { Ionicons } from '@expo/vector-icons';
import { PreferencesHeaderControls } from '../components/common/PreferencesHeaderControls';
import { FilmMatchLogo } from '../components/branding/FilmMatchLogo';
import { AVATAR_CHOICES } from '../constants/avatars';
import { useI18n } from '../hooks/useI18n';
import { auth } from '../services/firebaseConfig';
import { setSessionParams } from '../services/navigationService';
import { Colors } from '../constants/Colors';
import { createMatchSession } from '../services/sessionService';
import { createHomeStyles } from './HomeScreen.styles';

async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const styles = useMemo(() => createHomeStyles(), []);

  const [username, setUsername] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  const [step, setStep] = useState('profile');
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState('');

  const trimmedName = username.trim();
  const isBusy = pendingAction !== null;
  const profileComplete = trimmedName.length > 0 && selectedAvatarId != null;
  const createDisabled = !profileComplete || isBusy;

  const handleContinue = () => {
    if (!profileComplete) return;
    setError('');
    setStep('actions');
  };

  const handleCreateSession = async () => {
    if (!profileComplete || pendingAction) return;
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
      setError(e?.message || t('home_create_error'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleJoinNavigate = () => {
    if (!profileComplete) return;
    setError('');
    navigation.navigate('JoinRoomCode', {
      username: trimmedName,
      avatarId: selectedAvatarId,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.container}>
          <WedgeBackground shape="list" />
          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
            <PreferencesHeaderControls />
          </View>

          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.scrollInner}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 'profile' ? (
              <View style={styles.profileColumn}>
                <View style={styles.logoBlock}>
                  <FilmMatchLogo
                    tagline={t('home_logo_tagline')}
                  />
                </View>

                <SurfaceCard style={styles.profileCard}>
                <TextInput
                  style={styles.input}
                  placeholder={t('home_name_placeholder')}
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  editable={!isBusy}
                />

                <AppText variant="caption" style={[styles.avatarSectionLabel, { color: Colors.textSecondary }]}>
                  {t('home_avatar_label')}
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
                        <AppText variant="body" style={[styles.avatarEmoji, { color: Colors.textPrimary }]}>
                          {a.emoji}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                </SurfaceCard>

                <AppButton
                  title={t('home_continue')}
                  onPress={handleContinue}
                  disabled={!profileComplete}
                  style={styles.continueBtn}
                />
              </View>
            ) : (
              <View style={styles.actionsBlock}>
                <AppButton
                  title={t('home_create_room')}
                  onPress={handleCreateSession}
                  loading={pendingAction === 'create'}
                  disabled={createDisabled}
                />
                <AppButton
                  title={t('home_join_room')}
                  onPress={handleJoinNavigate}
                  variant="secondary"
                  disabled={!profileComplete || isBusy}
                  style={styles.sectionSpacing}
                />
                <IconSquare
                  variant="accent"
                  onPress={() => setStep('profile')}
                  accessibilityLabel={t('home_back')}
                  style={styles.backLink}
                >
                  <Ionicons name="chevron-back" size={20} color={Colors.onAccent} />
                </IconSquare>
              </View>
            )}

            {error ? (
              <AppText variant="error" style={[styles.errorText, { color: Colors.errorSoft }]}>
                {error}
              </AppText>
            ) : null}
          </ScrollView>

          <StatusBar style="light" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
