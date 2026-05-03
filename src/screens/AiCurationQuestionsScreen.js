import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../components/common/AppButton';
import { AppText } from '../components/common/AppText';
import { GradientEnergySlider } from '../components/common/GradientEnergySlider';
import { Colors } from '../constants/Colors';
import { auth } from '../services/firebaseConfig';
import { prepareCurationAiTrigger } from '../services/aiService';
import { useMergedRouteParams } from '../services/navigationService';
import { subscribeToSession, updateCurationResponses } from '../services/sessionService';

const STEPS = 3;
const MOOD_PRESETS = [
  { key: 'mutlu', emoji: '😀', label: 'Neşeli' },
  { key: 'sakin', emoji: '😌', label: 'Sakin' },
  { key: 'nostaljik', emoji: '🎞️', label: 'Nostaljik' },
  { key: 'gergin', emoji: '😬', label: 'Gergin' },
  { key: 'romantik', emoji: '💜', label: 'Romantik' },
];

const RED_LINE_CHIPS = ['Korku', 'Şiddet', 'Eski', 'Uzun'];

function allParticipantsHaveResponses(participants, responses) {
  if (!Array.isArray(participants) || participants.length < 2) return false;
  const r = responses || {};
  return participants.every((uid) => r[uid] != null);
}

export default function AiCurationQuestionsScreen({ route }) {
  const merged = useMergedRouteParams(route);
  const { username = '', sessionId } = merged;
  const userId = auth.currentUser?.uid ?? null;

  const [sessionSnap, setSessionSnap] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [moodPreset, setMoodPreset] = useState(null);
  const [moodText, setMoodText] = useState('');
  const [energy, setEnergy] = useState(50);
  const [redLineSet, setRedLineSet] = useState(() => new Set());
  const [redLinesText, setRedLinesText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [wizardDone, setWizardDone] = useState(false);
  const [hostPipelineStarted, setHostPipelineStarted] = useState(false);
  const aiTriggerRef = useRef(false);
  const scrollViewRef = useRef(null);
  const moodInputRef = useRef(null);
  const redLinesInputRef = useRef(null);
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const activeFieldRef = useRef(null);
  const scrollScheduleRef = useRef(null);
  const insets = useSafeAreaInsets();

  const runScrollFieldIntoView = useCallback(() => {
    const inputRef = activeFieldRef.current;
    if (!inputRef?.current || !scrollViewRef.current) return;

    const kh = keyboardHeightRef.current > 0 ? keyboardHeightRef.current : 300;
    const screenH = Dimensions.get('window').height;
    const visibleBottom = screenH - kh - 8;
    const marginAboveKeyboard = 12;

    inputRef.current.measureInWindow((ix, iy, iw, ih) => {
      const inputBottom = iy + ih;
      const overflow = inputBottom - (visibleBottom - marginAboveKeyboard);
      if (overflow <= 2) return;

      const nextY = scrollYRef.current + overflow;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, nextY), animated: true });
    });
  }, []);

  const scheduleScrollFieldIntoView = useCallback(() => {
    if (scrollScheduleRef.current) clearTimeout(scrollScheduleRef.current);
    scrollScheduleRef.current = setTimeout(() => {
      scrollScheduleRef.current = null;
      runScrollFieldIntoView();
    }, Platform.OS === 'ios' ? 90 : 160);
  }, [runScrollFieldIntoView]);

  useEffect(() => {
    if (!sessionId) return undefined;
    return subscribeToSession(sessionId, setSessionSnap);
  }, [sessionId]);

  useEffect(() => {
    const showEv = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEv = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEv, (e) => {
      keyboardHeightRef.current = e.endCoordinates.height;
      if (currentStep === 0 || currentStep === 2) scheduleScrollFieldIntoView();
    });
    const hideSub = Keyboard.addListener(hideEv, () => {
      keyboardHeightRef.current = 0;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
      if (scrollScheduleRef.current) clearTimeout(scrollScheduleRef.current);
    };
  }, [currentStep, scheduleScrollFieldIntoView]);

  const hostId = sessionSnap?.hostId ?? null;
  const participants = sessionSnap?.participants;
  const curationResponses = sessionSnap?.curationResponses;

  const isHost = useMemo(
    () => Boolean(userId && hostId && userId === hostId),
    [userId, hostId],
  );

  useEffect(() => {
    if (!wizardDone || !sessionId || !isHost || aiTriggerRef.current) return;
    if (!allParticipantsHaveResponses(participants, curationResponses)) return;

    aiTriggerRef.current = true;
    (async () => {
      try {
        await prepareCurationAiTrigger(sessionId);
        setHostPipelineStarted(true);
      } catch {
        aiTriggerRef.current = false;
      }
    })();
  }, [wizardDone, sessionId, isHost, participants, curationResponses]);

  const progress = (currentStep + 1) / STEPS;

  const toggleRedLine = (label) => {
    setRedLineSet((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const buildPayload = () => ({
    moodPreset,
    moodText: moodText.trim(),
    energy: Math.round(energy),
    redLines: Array.from(redLineSet),
    redLinesText: redLinesText.trim(),
  });

  const goNext = () => {
    if (currentStep < STEPS - 1) setCurrentStep((s) => s + 1);
  };

  const handlePrimaryPress = async () => {
    if (currentStep < STEPS - 1) {
      goNext();
      return;
    }

    if (!sessionId || !userId) {
      setSubmitError('Oturum veya kullanıcı bilgisi eksik.');
      return;
    }

    setSubmitError('');
    setSubmitting(true);
    try {
      await updateCurationResponses(sessionId, userId, buildPayload());
      setWizardDone(true);
    } catch (e) {
      setSubmitError(e?.message || 'Kayıt başarısız.');
    } finally {
      setSubmitting(false);
    }
  };

  const canGoNextFromStep0 = moodPreset != null || moodText.trim().length > 0;
  const canFinishStep2 = redLineSet.size > 0 || redLinesText.trim().length > 0;

  const primaryDisabled =
    submitting ||
    (currentStep === 0 && !canGoNextFromStep0) ||
    (currentStep === 2 && !canFinishStep2);

  const partnerWaiting =
    wizardDone &&
    isHost &&
    !allParticipantsHaveResponses(participants, curationResponses);

  const guestDoneMessage =
    wizardDone && !isHost ? 'Cevapların kaydedildi. Ev sahibi eşleştirmeyi tamamlıyor.' : null;

  const scrollPaddingBottom = insets.bottom + 120;
  const progressWidthPercent = progress * 100;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[styles.scroll, { paddingBottom: scrollPaddingBottom }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              scrollYRef.current = e.nativeEvent.contentOffset.y;
            }}
          >
            <AppText variant="kicker" style={styles.kickerTint}>
              AI Kürasyon
            </AppText>
            <AppText variant="screenTitle" style={styles.titleSpacing}>
              {username ? `${username}, ` : ''}Tercihlerini keşfedelim
            </AppText>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressWidthPercent}%` }]} />
            </View>
            <AppText variant="caption" style={styles.stepMeta}>
              Adım {currentStep + 1} / {STEPS}
            </AppText>

            {currentStep === 0 ? (
              <View style={styles.card}>
                <AppText variant="section">Bugün nasıl bir ruh halindesin?</AppText>
                <View style={styles.moodRow}>
                  {MOOD_PRESETS.map((m) => {
                    const active = moodPreset === m.key;
                    return (
                      <TouchableOpacity
                        key={m.key}
                        style={[styles.moodChip, active && styles.moodChipActive]}
                        onPress={() => setMoodPreset(m.key)}
                        activeOpacity={0.85}
                      >
                        <AppText variant="body" style={styles.moodEmoji}>
                          {m.emoji}
                        </AppText>
                        <AppText
                          variant="caption"
                          style={[styles.moodLabel, active && styles.moodLabelActive]}
                        >
                          {m.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <AppText variant="caption" style={styles.fieldLabel}>
                  İstersen kısaca yaz
                </AppText>
                <TextInput
                  ref={moodInputRef}
                  style={styles.textArea}
                  placeholder="Örn: Yumuşak, sıcak, komedi ağırlıklı..."
                  placeholderTextColor={Colors.textSubtle}
                  value={moodText}
                  onChangeText={setMoodText}
                  onFocus={() => {
                    activeFieldRef.current = moodInputRef;
                    scheduleScrollFieldIntoView();
                  }}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ) : null}

            {currentStep === 1 ? (
              <View style={styles.card}>
                <AppText variant="section">Enerji seviyesi</AppText>
                <AppText variant="numeric" style={styles.energyValue}>
                  {Math.round(energy)}
                </AppText>
                <GradientEnergySlider value={energy} onValueChange={setEnergy} style={styles.sliderWrap} />
                <AppText variant="caption" style={styles.hint}>
                  0: çok sakin — 100: çok hareketli
                </AppText>
              </View>
            ) : null}

            {currentStep === 2 ? (
              <View style={styles.card}>
                <AppText variant="section">Kırmızı çizgiler</AppText>
                <AppText variant="body" style={styles.cardSubtitle}>
                  İstemeyeceğin temalar (çoklu seçim)
                </AppText>
                <View style={styles.chipWrap}>
                  {RED_LINE_CHIPS.map((label) => {
                    const on = redLineSet.has(label);
                    return (
                      <TouchableOpacity
                        key={label}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => toggleRedLine(label)}
                        activeOpacity={0.85}
                      >
                        <AppText variant="bodyStrong" style={[styles.chipText, on && styles.chipTextOn]}>
                          {label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <AppText variant="caption" style={styles.fieldLabel}>
                  Ek not (isteğe bağlı)
                </AppText>
                <TextInput
                  ref={redLinesInputRef}
                  style={styles.textArea}
                  placeholder="Örn: jump scare istemiyorum..."
                  placeholderTextColor={Colors.textSubtle}
                  value={redLinesText}
                  onChangeText={setRedLinesText}
                  onFocus={() => {
                    activeFieldRef.current = redLinesInputRef;
                    scheduleScrollFieldIntoView();
                  }}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ) : null}

            {submitError ? <AppText variant="error" style={styles.error}>{submitError}</AppText> : null}

            {partnerWaiting ? (
              <View style={styles.banner}>
                <ActivityIndicator color={Colors.indigoGlow} />
                <AppText variant="bodyStrong" style={styles.bannerText}>
                  Partnerinin cevapları bekleniyor...
                </AppText>
              </View>
            ) : null}

            {guestDoneMessage ? (
              <AppText variant="success" style={styles.success}>
                {guestDoneMessage}
              </AppText>
            ) : null}

            {wizardDone && isHost && hostPipelineStarted ? (
              <AppText variant="success" style={styles.success}>
                Her iki cevap alındı. AI pipeline tetiklendi.
              </AppText>
            ) : null}

            <AppButton
              title={currentStep === STEPS - 1 ? 'Tamamla' : 'İleri'}
              onPress={handlePrimaryPress}
              loading={submitting}
              disabled={primaryDisabled}
              style={styles.primaryBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  kickerTint: {
    color: Colors.indigoLight,
  },
  titleSpacing: {
    marginTop: 8,
  },
  progressTrack: {
    marginTop: 22,
    height: 6,
    borderRadius: 4,
    backgroundColor: Colors.trackUnderlay,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.indigo,
  },
  stepMeta: {
    marginTop: 8,
    color: Colors.textMuted,
  },
  card: {
    marginTop: 22,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSubtitle: {
    marginTop: 6,
    color: Colors.textMuted,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  moodChip: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  moodChipActive: {
    borderColor: Colors.indigo,
    backgroundColor: Colors.indigoTrack,
  },
  moodEmoji: {
    fontSize: 26,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  moodLabel: {
    marginTop: 4,
    color: Colors.textSecondary,
  },
  moodLabelActive: {
    color: Colors.textPrimary,
  },
  fieldLabel: {
    marginTop: 16,
    color: Colors.textSecondary,
  },
  textArea: {
    marginTop: 8,
    minHeight: 88,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    textAlignVertical: 'top',
  },
  energyValue: {
    marginTop: 12,
  },
  sliderWrap: {
    marginTop: 4,
  },
  hint: {
    marginTop: 8,
    color: Colors.textSubtle,
    textAlign: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipOn: {
    backgroundColor: Colors.indigoTrack,
    borderColor: Colors.indigo,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  chipTextOn: {
    color: Colors.textPrimary,
  },
  error: {
    marginTop: 14,
  },
  banner: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceCard,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  bannerText: {
    flex: 1,
    color: Colors.textOnAccent,
  },
  success: {
    marginTop: 14,
  },
  primaryBtn: {
    marginTop: 22,
  },
});
