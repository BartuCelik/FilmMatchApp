import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import { getScreenRouteParams } from '../services/navigationService';
import { Colors } from '../constants/Colors';
import { useSessionDisbandSync } from '../hooks/useSessionDisbandSync';
import { fetchContentDetails } from '../services/api';

const SWIPE_THRESHOLD = 110;
const OFFSCREEN_X = 460;
const CARD_HEIGHT = 560;
const IMAGE_BASE_URL =
  process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/w500';

function normalizeMovieTags(movie) {
  if (Array.isArray(movie?.genres)) return movie.genres.slice(0, 3);
  if (Array.isArray(movie?.tags)) return movie.tags.slice(0, 3);
  if (typeof movie?.genres === 'string') {
    return movie.genres
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  return movie?.source ? [String(movie.source)] : ['FilmMatch Pick'];
}

function posterUri(posterPath) {
  if (!posterPath || typeof posterPath !== 'string') return '';
  if (/^https?:\/\//i.test(posterPath)) return posterPath;
  return `${IMAGE_BASE_URL}${posterPath}`;
}

export default function SwipeScreen({ navigation, route }) {
  const merged = getScreenRouteParams(route);
  const sessionId = merged.sessionId;
  const userId = auth.currentUser?.uid ?? null;

  useSessionDisbandSync(navigation, sessionId);

  const [sessionData, setSessionData] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [matchIds, setMatchIds] = useState([]);
  const [providersByMovieId, setProvidersByMovieId] = useState({});
  const [providersModalOpen, setProvidersModalOpen] = useState(false);
  const [providersModalMovieId, setProvidersModalMovieId] = useState(null);
  const [matchToastText, setMatchToastText] = useState('');
  const [statusToastText, setStatusToastText] = useState('');
  const previousMatchIdsRef = useRef([]);
  const matchToastTimerRef = useRef(null);
  const statusToastTimerRef = useRef(null);

  const translateX = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const movies = useMemo(() => {
    const pool = sessionData?.moviePool;
    return Array.isArray(pool) ? pool : [];
  }, [sessionData]);

  const currentMovie = movies[currentIndex] || null;
  const nextMovie = movies[currentIndex + 1] || null;
  const thirdMovie = movies[currentIndex + 2] || null;
  const movieTitleMap = useMemo(
    () =>
      movies.reduce((acc, movie) => {
        acc[String(movie.id)] = movie.title || 'New Match';
        return acc;
      }, {}),
    [movies],
  );
  const activeProviders = providersModalMovieId
    ? providersByMovieId[providersModalMovieId] || []
    : [];
  const totalMovies = Math.max(movies.length, 1);
  const progressValue = Math.min((currentIndex + 1) / totalMovies, 1);

  useEffect(() => {
    let cancelled = false;
    const toPrefetch = [currentMovie, nextMovie].filter(Boolean);
    const missing = toPrefetch.filter((movie) => providersByMovieId[String(movie.id)] === undefined);
    if (missing.length === 0) return undefined;

    (async () => {
      for (const movie of missing) {
        const tmdbIdRaw = String(movie.id || '').replace(/^movie-/, '');
        if (!tmdbIdRaw) continue;
        const details = await fetchContentDetails('movie', tmdbIdRaw);
        if (cancelled) return;
        setProvidersByMovieId((prev) => ({
          ...prev,
          [String(movie.id)]: Array.isArray(details?.providers) ? details.providers : [],
        }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentMovie, nextMovie, providersByMovieId]);

  useEffect(() => {
    if (!sessionId) return undefined;
    const unsub = onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      setSessionData(snap.exists() ? snap.data() : null);
      setLoadingSession(false);
    });
    return unsub;
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !userId) return undefined;
    const votesRef = collection(db, 'sessions', sessionId, 'votes');
    return onSnapshot(votesRef, (snap) => {
      const votesByUser = {};
      snap.forEach((d) => {
        votesByUser[d.id] = d.data()?.votes || {};
      });
      const participants = Array.isArray(sessionData?.participants)
        ? sessionData.participants
        : [];
      const partnerId = participants.find((uid) => uid && uid !== userId);
      if (!partnerId) return;
      const ownVotes = votesByUser[userId] || {};
      const partnerVotes = votesByUser[partnerId] || {};
      const ownLikes = Object.keys(ownVotes).filter((movieId) => ownVotes[movieId] === 'like');
      const intersection = ownLikes.filter((movieId) => partnerVotes[movieId] === 'like');
      setMatchIds(intersection);
      const previous = previousMatchIdsRef.current;
      const newMatches = intersection.filter((id) => !previous.includes(id));
      if (newMatches.length > 0) {
        const lastNewMatchId = newMatches[newMatches.length - 1];
        const title = movieTitleMap[lastNewMatchId] || 'A movie';
        setMatchToastText(`Matched! ${title}`);
        if (matchToastTimerRef.current) clearTimeout(matchToastTimerRef.current);
        matchToastTimerRef.current = setTimeout(() => {
          setMatchToastText('');
          matchToastTimerRef.current = null;
        }, 1800);
      }
      previousMatchIdsRef.current = intersection;
    });
  }, [movieTitleMap, sessionId, userId, sessionData?.participants]);

  useEffect(
    () => () => {
      if (matchToastTimerRef.current) clearTimeout(matchToastTimerRef.current);
      if (statusToastTimerRef.current) clearTimeout(statusToastTimerRef.current);
    },
    [],
  );

  const persistVote = useCallback(
    async (movieId, vote) => {
      if (!sessionId || !userId || !movieId) return;
      const isSessionActive = sessionData?.sessionStatus === 'active';
      const isAiReady = sessionData?.aiStatus === 'ready';
      if (!isSessionActive || !isAiReady) {
        setStatusToastText('Oylama icin oturum aktif ve AI hazir olmali.');
        if (statusToastTimerRef.current) clearTimeout(statusToastTimerRef.current);
        statusToastTimerRef.current = setTimeout(() => {
          setStatusToastText('');
          statusToastTimerRef.current = null;
        }, 1500);
        return;
      }
      const voteRef = doc(db, 'sessions', sessionId, 'votes', userId);
      await setDoc(
        voteRef,
        {
          votes: { [movieId]: vote },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    [sessionData?.aiStatus, sessionData?.sessionStatus, sessionId, userId],
  );

  const finalizeSwipe = useCallback(
    async (direction) => {
      const movie = movies[currentIndex];
      if (!movie) return;
      const vote = direction === 'right' ? 'like' : 'dislike';
      await persistVote(String(movie.id), vote);
      setCurrentIndex((prev) => prev + 1);
      translateX.value = 0;
      isAnimating.value = false;
    },
    [currentIndex, isAnimating, movies, persistVote, translateX],
  );

  const triggerSwipe = useCallback(
    (direction) => {
      if (!currentMovie || isAnimating.value) return;
      isAnimating.value = true;
      const toX = direction === 'right' ? OFFSCREEN_X : -OFFSCREEN_X;
      translateX.value = withTiming(toX, { duration: 220 }, (finished) => {
        if (finished) runOnJS(finalizeSwipe)(direction);
      });
    },
    [currentMovie, finalizeSwipe, isAnimating, translateX],
  );

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      if (isAnimating.value) return;
      translateX.value = event.translationX;
    },
    onEnd: () => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        isAnimating.value = true;
        translateX.value = withTiming(direction === 'right' ? OFFSCREEN_X : -OFFSCREEN_X, { duration: 210 }, (finished) => {
          if (finished) runOnJS(finalizeSwipe)(direction);
        });
        return;
      }
      translateX.value = withSpring(0);
    },
  });

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-240, 0, 240], [-12, 0, 12]);
    return {
      transform: [{ translateX: translateX.value }, { rotateZ: `${rotate}deg` }],
    };
  });

  const likeOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, 80, 180], [0, 0.2, 0.45]),
  }));

  const dislikeOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-180, -80, 0], [0.45, 0.2, 0]),
  }));

  if (loadingSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.indigoLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#0C0D12', '#0E0C16', '#1A0F24']} style={styles.bg}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Let&apos;s pick 🍿</Text>
          <View style={styles.progressWrap}>
            <Text style={styles.counter}>
              {Math.min(currentIndex + 1, totalMovies)}/{totalMovies}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressValue * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.stackWrap}>
          {thirdMovie ? (
            <View style={[styles.card, styles.backCard2]}>
              <Image source={{ uri: posterUri(thirdMovie.posterPath) }} style={styles.poster} />
            </View>
          ) : null}
          {nextMovie ? (
            <View style={[styles.card, styles.backCard1]}>
              <Image source={{ uri: posterUri(nextMovie.posterPath) }} style={styles.poster} />
            </View>
          ) : null}

          {currentMovie ? (
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.card, topCardStyle]}>
                <Image source={{ uri: posterUri(currentMovie.posterPath) }} style={styles.poster} />
                <Animated.View style={[styles.swipeOverlay, styles.likeGlow, likeOverlay]} />
                <Animated.View style={[styles.swipeOverlay, styles.dislikeGlow, dislikeOverlay]} />

                <LinearGradient
                  colors={['transparent', 'rgba(7,7,10,0.95)']}
                  style={styles.metaWrap}
                >
                  <Text style={styles.movieTitle} numberOfLines={1}>
                    {currentMovie.title}
                  </Text>
                  <Text style={styles.movieDesc} numberOfLines={2}>
                    {currentMovie.overview || 'A curated pick just for your session.'}
                  </Text>
                  <View style={styles.tagRow}>
                    {normalizeMovieTags(currentMovie).map((tag) => (
                      <View key={`${currentMovie.id}-${tag}`} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.providersRow}>
                    {(providersByMovieId[String(currentMovie.id)] || []).slice(0, 2).map((provider) => (
                      <View key={`${currentMovie.id}-p-${provider.id}`} style={styles.providerLogoBubble}>
                        <Image
                          source={{ uri: provider.logo }}
                          style={styles.providerLogo}
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                    {(providersByMovieId[String(currentMovie.id)] || []).length > 2 ? (
                      <TouchableOpacity
                        style={styles.providerPlus}
                        activeOpacity={0.85}
                        onPress={() => {
                          setProvidersModalMovieId(String(currentMovie.id));
                          setProvidersModalOpen(true);
                        }}
                      >
                        <Text style={styles.providerPlusText}>
                          +
                          {(providersByMovieId[String(currentMovie.id)] || []).length - 2}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </LinearGradient>
              </Animated.View>
            </PanGestureHandler>
          ) : (
            <View style={[styles.card, styles.doneCard]}>
              <Text style={styles.doneTitle}>Tum filmleri oyladin</Text>
              <Text style={styles.doneSub}>Match sayisi: {matchIds.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <LinearGradient colors={['#2B2D33', '#1D1E22']} style={styles.actionBtn}>
            <TouchableOpacity onPress={() => triggerSwipe('left')} style={styles.actionTouch}>
              <Ionicons name="close" size={34} color={Colors.textPrimary} />
            </TouchableOpacity>
          </LinearGradient>
          <LinearGradient colors={['#2A2A30', '#1C1C22']} style={styles.actionBtn}>
            <TouchableOpacity onPress={() => setDetailOpen(true)} style={styles.actionTouch}>
              <Ionicons name="eye-outline" size={26} color={Colors.textPrimary} />
            </TouchableOpacity>
          </LinearGradient>
          <LinearGradient colors={['#F97316', '#EF4444']} style={styles.actionBtn}>
            <TouchableOpacity onPress={() => triggerSwipe('right')} style={styles.actionTouch}>
              <Ionicons name="heart" size={28} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {matchToastText ? (
          <View style={styles.matchToast}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            <Text style={styles.matchToastText}>{matchToastText}</Text>
          </View>
        ) : null}
        {statusToastText ? (
          <View style={styles.statusToast}>
            <Text style={styles.statusToastText}>{statusToastText}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <Modal visible={detailOpen} transparent animationType="fade" onRequestClose={() => setDetailOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{currentMovie?.title || 'Film'}</Text>
            <Text style={styles.modalBody}>
              {currentMovie?.overview || 'Bu film icin aciklama bilgisi bulunamadi.'}
            </Text>
            <TouchableOpacity onPress={() => setDetailOpen(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={providersModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProvidersModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setProvidersModalOpen(false)}>
          <Pressable style={styles.providersModalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Watch Providers</Text>
            <View style={styles.providersGrid}>
              {activeProviders.map((provider) => (
                <View key={`provider-all-${provider.id}`} style={styles.providersGridItem}>
                  <View style={styles.providerLogoBubbleLarge}>
                    <Image source={{ uri: provider.logo }} style={styles.providerLogoLarge} />
                  </View>
                  <Text style={styles.providerName} numberOfLines={1}>
                    {provider.name}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B10' },
  bg: { flex: 1, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  progressWrap: { minWidth: 72, alignItems: 'flex-end' },
  counter: { color: '#E9E9E9', fontSize: 16, fontWeight: '700' },
  progressTrack: {
    marginTop: 5,
    width: 72,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  stackWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    height: CARD_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  backCard1: {
    position: 'absolute',
    transform: [{ scale: 0.97 }, { translateY: 10 }],
    opacity: 0.8,
  },
  backCard2: {
    position: 'absolute',
    transform: [{ scale: 0.94 }, { translateY: 20 }],
    opacity: 0.55,
  },
  poster: { width: '100%', height: '72%' },
  swipeOverlay: { ...StyleSheet.absoluteFillObject },
  likeGlow: { backgroundColor: 'rgba(22, 163, 74, 0.35)' },
  dislikeGlow: { backgroundColor: 'rgba(220, 38, 38, 0.35)' },
  metaWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  movieTitle: { color: '#FFF', fontSize: 34, fontWeight: '800' },
  movieDesc: { color: '#D2D2D2', fontSize: 15, lineHeight: 20, marginTop: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tagText: { color: '#EFEFEF', fontSize: 12, fontWeight: '600' },
  providersRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerLogoBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  providerPlus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerPlusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: -1,
  },
  doneCard: { alignItems: 'center', justifyContent: 'center' },
  doneTitle: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  doneSub: { marginTop: 8, color: '#C8C8C8', fontSize: 15 },
  actionsRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  actionBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 10,
  },
  actionTouch: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  matchToast: {
    position: 'absolute',
    top: 86,
    left: 18,
    right: 18,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },
  matchToastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#18181D',
    borderWidth: 1,
    borderColor: '#2A2A34',
    padding: 18,
  },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  modalBody: { color: '#CDCDCD', fontSize: 15, marginTop: 10, lineHeight: 22 },
  modalCloseBtn: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#2A2A34',
  },
  modalCloseText: { color: '#FFF', fontWeight: '600' },
  providersModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: 'rgba(20,20,26,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 18,
  },
  providersGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  providersGridItem: {
    width: 72,
    alignItems: 'center',
  },
  providerLogoBubbleLarge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  providerLogoLarge: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  providerName: {
    marginTop: 6,
    color: '#D8D8D8',
    fontSize: 11,
    textAlign: 'center',
  },
  statusToast: {
    position: 'absolute',
    bottom: 112,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  statusToastText: {
    color: '#F3F3F3',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(12,12,18,0.86)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
  },
});
