import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components/common/AppText';
import { Colors } from '../constants/Colors';
import { getSessionParams, setSessionParams, useMergedRouteParams } from '../services/navigationService';
import { setSessionSelectedMode, subscribeToSession } from '../services/sessionService';

const MODE_OPTIONS = [
  {
    key: 'ai',
    title: 'AI Kürasyon',
    subtitle: 'Kişiselleştirilmiş öneriler',
  },
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
  const merged = useMergedRouteParams(route);
  const { username = '', sessionId, code } = merged;
  const lastNavigatedModeRef = useRef(null);

  const [isPartnerReady, setIsPartnerReady] = useState(() => !sessionId);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    const latest = { ...getSessionParams(), ...(route?.params || {}) };
    if (!latest.sessionId) {
      setIsPartnerReady(true);
      return undefined;
    }

    lastNavigatedModeRef.current = null;

    const unsubscribe = subscribeToSession(latest.sessionId, (data) => {
      if (!data) {
        setIsPartnerReady(false);
        return;
      }

      const participants = data.participants;
      setIsPartnerReady(Array.isArray(participants) && participants.length === 2);

      const selectedMode = data.selectedMode;
      if (!selectedMode || lastNavigatedModeRef.current === selectedMode) return;
      lastNavigatedModeRef.current = selectedMode;

      const p = getSessionParams();
      const baseParams = {
        username: p.username ?? '',
        sessionId: p.sessionId,
        code: p.code,
      };

      if (selectedMode === 'ai') {
        setSessionParams(baseParams);
        navigation.replace('AiCurationQuestions');
        return;
      }

      const category = selectedMode === 'tv' ? 'mixed' : 'popular';
      setSessionParams({
        ...baseParams,
        mode: selectedMode,
        category,
      });
      navigation.replace('Match');
    });

    return unsubscribe;
  }, [sessionId, navigation, route?.params]);

  const handleModeSelect = async (modeKey) => {
    setSyncError('');
    if (!sessionId) {
      if (modeKey === 'ai') {
        setSessionParams({ username });
        navigation.navigate('AiCurationQuestions');
        return;
      }
      const category = modeKey === 'tv' ? 'mixed' : 'popular';
      setSessionParams({ username, mode: modeKey, category });
      navigation.navigate('Match');
      return;
    }

    if (!isPartnerReady) return;

    try {
      await setSessionSelectedMode(sessionId, modeKey);
    } catch (e) {
      setSyncError(e?.message || 'Mod seçimi kaydedilemedi.');
    }
  };

  const waitingForPartner = Boolean(sessionId) && !isPartnerReady;
  const modeButtonsEnabled = !sessionId || isPartnerReady;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="title" style={styles.title}>
            Choose Mode
          </AppText>
          <AppText variant="body" style={styles.description}>
            Select a content mode for your room
          </AppText>

          {waitingForPartner ? (
            <AppText variant="bodyStrong" style={styles.waitingText}>
              Partnerin bekleniyor... Kod: {code ?? '------'}
            </AppText>
          ) : null}

          {syncError ? <AppText variant="error" style={styles.errorText}>{syncError}</AppText> : null}

          <View style={styles.options}>
            {MODE_OPTIONS.map((modeOption) => (
              <TouchableOpacity
                key={modeOption.key}
                style={[styles.modeCard, !modeButtonsEnabled && styles.modeCardDisabled]}
                onPress={() => handleModeSelect(modeOption.key)}
                disabled={!modeButtonsEnabled}
                activeOpacity={0.9}
              >
                <AppText variant="section" style={styles.modeTitle}>
                  {modeOption.title}
                </AppText>
                <AppText variant="body" style={styles.modeSubtitle}>
                  {modeOption.subtitle}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    color: Colors.textPrimary,
  },
  description: {
    marginTop: 8,
    color: Colors.textSecondary,
  },
  waitingText: {
    marginTop: 20,
    color: Colors.textOnAccent,
  },
  errorText: {
    marginTop: 12,
  },
  options: {
    marginTop: 36,
    gap: 14,
  },
  modeCard: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modeCardDisabled: {
    opacity: 0.4,
  },
  modeTitle: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  modeSubtitle: {
    marginTop: 8,
    color: Colors.textSecondary,
  },
});
