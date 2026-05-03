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
import { PreferencesHeaderControls } from '../components/common/PreferencesHeaderControls';
import { FilmMatchLogo } from '../components/branding/FilmMatchLogo';
import { AVATAR_CHOICES } from '../constants/avatars';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../hooks/useI18n';
import { auth } from '../services/firebaseConfig';
import { setSessionParams } from '../services/navigationService';
import { createMatchSession } from '../services/sessionService';
import { getPalette } from '../theme/palettes';
import { createHomeStyles } from './HomeScreen.styles';

async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppPreferences();
  const { t } = useI18n();
  const palette = useMemo(() => getPalette(theme), [theme]);
  const styles = useMemo(() => createHomeStyles(palette), [palette]);

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
          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
            <PreferencesHeaderControls palette={palette} />
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
                    accentColor={palette.indigo}
                    accentSoft={palette.indigoLight}
                    textColor={palette.textPrimary}
                    taglineColor={palette.textMuted}
                    tagline={t('home_logo_tagline')}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder={t('home_name_placeholder')}
                  placeholderTextColor={palette.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  editable={!isBusy}
                />

                <AppText variant="caption" style={[styles.avatarSectionLabel, { color: palette.textSecondary }]}>
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
                        <AppText variant="body" style={[styles.avatarEmoji, { color: palette.textPrimary }]}>
                          {a.emoji}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

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
                <TouchableOpacity style={styles.backLink} onPress={() => setStep('profile')} activeOpacity={0.8}>
                  <AppText variant="bodyStrong" style={[styles.backLinkText, { color: palette.indigoLight }]}>
                    {t('home_back')}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {error ? (
              <AppText variant="error" style={[styles.errorText, { color: palette.errorSoft }]}>
                {error}
              </AppText>
            ) : null}
          </ScrollView>

          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
