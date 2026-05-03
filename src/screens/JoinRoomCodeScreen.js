import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { signInAnonymously } from 'firebase/auth';
import { AppButton } from '../components/common/AppButton';
import { AppText } from '../components/common/AppText';
import { PreferencesHeaderControls } from '../components/common/PreferencesHeaderControls';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useI18n } from '../hooks/useI18n';
import { auth } from '../services/firebaseConfig';
import { setSessionParams } from '../services/navigationService';
import { joinMatchSession } from '../services/sessionService';
import { getPalette } from '../theme/palettes';
import { createJoinCodeStyles } from './JoinRoomCodeScreen.styles';

async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  const { user } = await signInAnonymously(auth);
  return user;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['empty', '0', 'del'],
];

export default function JoinRoomCodeScreen({ navigation, route }) {
  const { theme } = useAppPreferences();
  const { t } = useI18n();
  const palette = useMemo(() => getPalette(theme), [theme]);
  const styles = useMemo(() => createJoinCodeStyles(palette), [palette]);

  const username = (route.params?.username ?? '').trim() || 'Misafir';
  const avatarId = route.params?.avatarId ?? null;

  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const appendDigit = (d) => {
    setError('');
    setCode((prev) => (prev.length >= 6 ? prev : `${prev}${d}`));
  };

  const backspace = () => {
    setError('');
    setCode((prev) => prev.slice(0, -1));
  };

  const handleKeyPress = (key) => {
    if (key === 'empty') return;
    if (key === 'del') {
      backspace();
      return;
    }
    appendDigit(key);
  };

  const handleConfirm = async () => {
    if (code.length !== 6 || avatarId == null || pending) return;
    setError('');
    setPending(true);
    Keyboard.dismiss();
    try {
      const user = await ensureAnonymousUser();
      const sessionId = await joinMatchSession(user.uid, code, avatarId);
      setSessionParams({
        username,
        sessionId,
        code,
        avatarId,
      });
      navigation.navigate('ModeSelection');
    } catch (e) {
      setError(e?.message || t('join_error'));
    } finally {
      setPending(false);
    }
  };

  const slots = Array.from({ length: 6 }, (_, i) => code[i] ?? null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.root}>
        <View style={styles.topBar}>
          <PreferencesHeaderControls palette={palette} />
        </View>

        <Text style={styles.title}>{t('join_title')}</Text>
        <Text style={styles.subtitle}>{t('join_subtitle')}</Text>

        <Pressable style={styles.slotsRow} onPress={() => inputRef.current?.focus()}>
          {slots.map((ch, i) => (
            <View key={i} style={styles.slot}>
              {ch != null ? (
                <Text style={styles.slotChar}>{ch}</Text>
              ) : (
                <Text style={styles.slotDash}>—</Text>
              )}
            </View>
          ))}
        </Pressable>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={(t) => {
            const next = t.replace(/\D/g, '').slice(0, 6);
            setCode(next);
            setError('');
          }}
          keyboardType="number-pad"
          maxLength={6}
          editable={!pending}
          importantForAutofill="no"
        />

        <AppButton
          title={t('join_confirm')}
          onPress={handleConfirm}
          loading={pending}
          disabled={code.length !== 6 || avatarId == null}
          style={styles.confirmBtn}
        />

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.linkText}>{t('join_try_other')}</Text>
        </TouchableOpacity>

        {error ? (
          <AppText variant="error" style={[styles.error, { color: palette.errorSoft }]}>
            {error}
          </AppText>
        ) : null}

        <View style={styles.keypad}>
          {ROWS.map((row, ri) => (
            <View key={ri} style={styles.keypadRow}>
              {row.map((key, ki) => {
                if (key === 'empty') {
                  return <View key={`spacer-${ri}-${ki}`} style={[styles.key, { opacity: 0 }]} />;
                }
                if (key === 'del') {
                  return (
                    <TouchableOpacity
                      key="del"
                      style={styles.key}
                      onPress={backspace}
                      activeOpacity={0.75}
                      disabled={pending}
                    >
                      <Text style={styles.keyText}>⌫</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.key}
                    onPress={() => handleKeyPress(key)}
                    activeOpacity={0.75}
                    disabled={pending}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
