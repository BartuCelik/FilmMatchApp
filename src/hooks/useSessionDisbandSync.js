import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { clearSessionParams } from '../services/navigationService';
import { subscribeToSession } from '../services/sessionService';

const ALERT_TITLE = 'Oturum sona erdi';
const ALERT_BODY = 'Partnerin oturumdan ayrıldı.';

export function isSessionDisbanded(data) {
  if (!data) return false;
  return data.isDisbanded === true || data.status === "closed";
}

function resetToHome(navigation) {
  clearSessionParams();
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: "Home" }],
    }),
  );
}

/**
 * Firestore oturumu dağıtıldığında tek seferlik uyarı + Home reset.
 * @param {import('@react-navigation/native').NavigationProp} navigation
 * @param {{ current: boolean }} dedupeRef — aynı bileşende birden fazla callback için ortak ref
 */
export function requestDisbandNavigation(navigation, dedupeRef) {
  if (dedupeRef.current) return;
  dedupeRef.current = true;
  Alert.alert(
    ALERT_TITLE,
    ALERT_BODY,
    [
      {
        text: "Tamam",
        onPress: () => resetToHome(navigation),
      },
    ],
    { cancelable: false },
  );
}

/**
 * Match gibi tek subscribe kullanmayan ekranlar için: sessionId varsa isDisbanded dinler.
 */
export function useSessionDisbandSync(navigation, sessionId) {
  const dedupeRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return undefined;
    dedupeRef.current = false;
    return subscribeToSession(sessionId, (data) => {
      if (isSessionDisbanded(data)) {
        requestDisbandNavigation(navigation, dedupeRef);
      }
    });
  }, [navigation, sessionId]);
}
