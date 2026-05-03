import { createNavigationContainerRef } from '@react-navigation/native';
import { useMemo, useSyncExternalStore } from 'react';

let sessionParams = {};
/** Monotonic counter so useSyncExternalStore getSnapshot stays stable between updates (must not return a new object each call). */
let sessionVersion = 0;
const sessionListeners = new Set();

function emitSession() {
  sessionVersion += 1;
  sessionListeners.forEach((fn) => fn());
}

export function setSessionParams(partial) {
  sessionParams = { ...sessionParams, ...partial };
  emitSession();
}

export function getSessionParams() {
  return { ...sessionParams };
}

export function clearSessionParams() {
  sessionParams = {};
  emitSession();
}

export function subscribeSessionParams(onChange) {
  sessionListeners.add(onChange);
  return () => sessionListeners.delete(onChange);
}

function getSessionStoreVersion() {
  return sessionVersion;
}

function getServerSessionStoreVersion() {
  return 0;
}

export function getScreenRouteParams(route) {
  return { ...getSessionParams(), ...(route?.params || {}) };
}

export function useSessionParams() {
  const version = useSyncExternalStore(
    subscribeSessionParams,
    getSessionStoreVersion,
    getServerSessionStoreVersion,
  );
  return useMemo(() => ({ ...sessionParams }), [version]);
}

export function useMergedRouteParams(route) {
  const session = useSessionParams();
  return useMemo(() => ({ ...session, ...(route?.params || {}) }), [session, route?.params]);
}

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
