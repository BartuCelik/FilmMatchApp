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
import { IconSquare } from '../components/common/IconSquare';
import { SurfaceCard } from '../components/common/SurfaceCard';
import { WedgeBackground } from '../components/common/WedgeBackground';
import { getAvatarEmoji } from '../constants/avatars';
import { Colors } from '../constants/Colors';
import { useI18n } from '../hooks/useI18n';
import { isSessionDisbanded, requestDisbandNavigation } from '../hooks/useSessionDisbandSync';
import { getSessionParams, setSessionParams, useMergedRouteParams } from '../services/navigationService';
import { setSessionSelectedMode, subscribeToSession } from '../services/sessionService';

const MODE_OPTIONS = [
  { key: 'ai', icon: '🍿', titleKey: 'mode_ai_title', subtitleKey: 'mode_ai_subtitle' },
  { key: 'movie', icon: '🎬', titleKey: 'mode_movie_title', subtitleKey: 'mode_movie_subtitle' },
  { key: 'tv', icon: '📺', titleKey: 'mode_tv_title', subtitleKey: 'mode_tv_subtitle' },
];

export default function ModeSelectionScreen({ navigation, route }) {
  const { t } = useI18n();
  const merged = useMergedRouteParams(route);
  const { username = '', sessionId, code } = merged;
  const [selectedKey, setSelectedKey] = useState(null);
  const lastNavigatedModeRef = useRef(null);
  const disbandRef = useRef(false);

  const [isPartnerReady, setIsPartnerReady] = useState(() => !sessionId);
  const [syncError, setSyncError] = useState('');
  const [sessionSocial, setSessionSocial] = useState({ participants: [], avatars: {} });

  useEffect(() => {
    const latest = { ...getSessionParams(), ...(route?.params || {}) };
    if (!latest.sessionId) {
      setIsPartnerReady(true);
      return undefined;
    }

    lastNavigatedModeRef.current = null;
    disbandRef.current = false;

    const unsubscribe = subscribeToSession(latest.sessionId, (data) => {
      if (!data) {
        setIsPartnerReady(false);
        return;
      }

      if (isSessionDisbanded(data)) {
        requestDisbandNavigation(navigation, disbandRef);
        return;
      }

      setSessionSocial({
        participants: Array.isArray(data.participants) ? data.participants : [],
        avatars: data.avatars && typeof data.avatars === 'object' ? data.avatars : {},
      });

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
        avatarId: p.avatarId,
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
    setSelectedKey(modeKey);
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
      <WedgeBackground shape="list" />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {sessionId ? (
            <View style={styles.partnerStrip}>
              {sessionSocial.participants.map((uid) => (
                <View key={uid} style={styles.partnerAvatarWrap}>
                  <View style={styles.partnerAvatarRing}>
                    <AppText variant="body" style={styles.partnerAvatarEmoji}>
                      {getAvatarEmoji(sessionSocial.avatars[uid])}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {sessionId ? (
            <View style={styles.tipCard}>
              <AppText variant="bodyStrong" style={styles.tipText}>
                İkinizden birinin seçim yapması yeterlidir
              </AppText>
            </View>
          ) : null}

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
                onPress={() => handleModeSelect(modeOption.key)}
                disabled={!modeButtonsEnabled}
                activeOpacity={0.9}
                style={!modeButtonsEnabled && styles.modeCardDisabled}
              >
                <SurfaceCard selected={selectedKey === modeOption.key} style={styles.modeCard}>
                  <IconSquare variant={selectedKey === modeOption.key ? 'accent' : 'surface'} size={48}>
                    <AppText variant="body" style={styles.modeIcon}>{modeOption.icon}</AppText>
                  </IconSquare>
                  <View style={styles.modeText}>
                    <AppText variant="section" style={styles.modeTitle}>
                      {t(modeOption.titleKey)}
                    </AppText>
                    <AppText variant="body" style={styles.modeSubtitle}>
                      {t(modeOption.subtitleKey)}
                    </AppText>
                  </View>
                </SurfaceCard>
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
    backgroundColor: Colors.background,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  partnerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  partnerAvatarWrap: {
    alignItems: 'center',
  },
  partnerAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  partnerAvatarEmoji: {
    fontSize: 30,
    color: Colors.textPrimary,
  },
  tipCard: {
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipText: {
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
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
    color: Colors.textPrimary,
  },
  errorText: {
    marginTop: 12,
  },
  options: {
    marginTop: 36,
    gap: 14,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  modeIcon: {
    fontSize: 24,
  },
  modeText: {
    flex: 1,
  },
  modeCardDisabled: {
    opacity: 0.4,
  },
  modeTitle: {
    color: Colors.textPrimary,
  },
  modeSubtitle: {
    marginTop: 4,
    color: Colors.textSecondary,
  },
});
