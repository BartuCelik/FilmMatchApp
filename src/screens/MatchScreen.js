/*import React, { useEffect, useRef, useState } from 'react';
import MovieCard from '../components/MovieCard/MovieCard';
import DetailModal from '../components/DetailModal/DetailModal';
import ActionButtons from '../components/ActionButtons/ActionButtons';
import { matchScreenStyles as styles } from './MatchScreen.styles';
import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { fetchContent, fetchContentDetails } from '../services/api';

const dedupeByTmdbId = (items) =>
  items.filter((item, index, self) => self.findIndex((compareItem) => compareItem.tmdbId === item.tmdbId) === index);

export default function MatchScreen({ navigation, route }) {
  const mode = route?.params?.mode || 'movie';
  const category = route?.params?.category || 'popular';

  const swiperRef = useRef(null);
  const actionSourceRef = useRef(null);
  const toastTimerRef = useRef(null);
  const panelY = useRef(new Animated.Value(460)).current;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState('');
  const [failedImages, setFailedImages] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        if (mode === 'tv' && category === 'mixed') {
          const [popular, topRated] = await Promise.all([fetchContent('tv', 'popular'), fetchContent('tv', 'top_rated')]);
          setItems(dedupeByTmdbId([...popular, ...topRated]));
        } else {
          setItems(await fetchContent(mode, category));
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [mode, category]);

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(''), 1000);
  };

  const triggerHaptic = async (type) => {
    try {
      if (type === 'like') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {}
  };

  const getImageUri = (item) => {
    const failCount = failedImages[item.id] ?? 0;
    if (failCount === 0) return item.image;
    if (failCount === 1) return item.backupImage || item.fallbackImage || item.image;
    return item.fallbackImage || item.backupImage || item.image;
  };

  const openDetails = async (item) => {
    setSelectedItem(item);
    setDetails(null);
    setDetailLoading(true);
    setDetailVisible(true);
    Animated.timing(panelY, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    setDetails(await fetchContentDetails(item.type, item.tmdbId));
    setDetailLoading(false);
  };

  const closeDetails = () => {
    Animated.timing(panelY, { toValue: 460, duration: 220, useNativeDriver: true }).start(() => setDetailVisible(false));
  };

  const onSwipeRight = () => {
    const byButton = actionSourceRef.current === 'right';
    actionSourceRef.current = null;
    if (!byButton) triggerHaptic('like');
    showToast(mode === 'tv' ? 'Series liked!' : 'Movie liked!');
  };

  const onSwipeLeft = () => {
    const byButton = actionSourceRef.current === 'left';
    actionSourceRef.current = null;
    if (!byButton) triggerHaptic('dislike');
    showToast(mode === 'tv' ? 'Series disliked!' : 'Movie disliked!');
  };

  const onDislikeButton = async () => {
    actionSourceRef.current = 'left';
    await triggerHaptic('dislike');
    swiperRef.current?.swipeLeft();
  };

  const onLikeButton = async () => {
    actionSourceRef.current = 'right';
    await triggerHaptic('like');
    swiperRef.current?.swipeRight();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>{mode === 'tv' ? 'Pick a Series' : 'Pick a Movie'}</Text>

      <View style={styles.swiperWrap}>
        {loading ? (
          <ActivityIndicator size="large" color="#8B3DFF" />
        ) : loadError ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>Could not load content.</Text>
          </View>
        ) : (
          <Swiper
            ref={swiperRef}
            cards={items}
            renderCard={(item) =>
              item ? (
                <MovieCard
                  item={item}
                  imageUri={getImageUri(item)}
                  onPress={() => openDetails(item)}
                  onImageError={() =>
                    setFailedImages((prev) => ({
                      ...prev,
                      [item.id]: (prev[item.id] ?? 0) + 1,
                    }))
                  }
                />
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No more content</Text>
                </View>
              )
            }
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={16}
            disableTopSwipe
            disableBottomSwipe
            onSwipedRight={onSwipeRight}
            onSwipedLeft={onSwipeLeft}
            animateCardOpacity
            animateOverlayLabelsOpacity
            verticalSwipe={false}
          />
        )}
      </View>

      <ActionButtons onDislike={onDislikeButton} onLike={onLikeButton} />

      <TouchableOpacity style={styles.cancel} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <DetailModal
        visible={detailVisible}
        panelY={panelY}
        selectedItem={selectedItem}
        loading={detailLoading}
        details={details}
        onClose={closeDetails}
      />
    </View>
  );
}

dedupeByTmdbId = (items) => items.filter((item, i, self) => self.findIndex((x) => x.tmdbId === item.tmdbId) === i);
const getScoreColor = (score) => (score >= 7.5 ? '#3DDC84' : score >= 5 ? '#F4C542' : '#FF5C6A');

function ScoreRing({ score }) {
  const size = 52;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(10, Number(score) || 0));
  const offset = circumference * (1 - value / 10);

  return (
    <View style={styles.scoreRingWrap}>
      <Svg width={size} height={size}>
        <Circle stroke="rgba(255,255,255,0.2)" fill="transparent" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <Circle
          stroke={getScoreColor(value)}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.scoreRingCenter}>
        <Text style={styles.scoreRingText}>{value.toFixed(1)}</Text>
      </View>
    </View>
  );
}

function ActionButton({ icon, color, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = () =>
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.12, useNativeDriver: true, speed: 20 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18 }),
    ]).start();

  return (
    <Animated.View style={[styles.actionShadow, { transform: [{ scale }] }]}>
      <Pressable
        style={styles.actionButton}
        onPress={() => {
          animate();
          onPress();
        }}
      >
        <AntDesign name={icon} size={26} color={color} />
      </Pressable>
    </Animated.View>
  );
}

export default function MatchScreen({ navigation, route }) {
  const mode = route?.params?.mode || 'movie';
  const category = route?.params?.category || 'popular';
  const swiperRef = useRef(null);
  const actionSourceRef = useRef(null);
  const toastTimerRef = useRef(null);
  const panelY = useRef(new Animated.Value(460)).current;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState('');
  const [failedImages, setFailedImages] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        if (mode === 'tv' && category === 'mixed') {
          const [popular, topRated] = await Promise.all([fetchContent('tv', 'popular'), fetchContent('tv', 'top_rated')]);
          setItems(dedupeByTmdbId([...popular, ...topRated]));
        } else {
          setItems(await fetchContent(mode, category));
        }
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [mode, category]);

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(''), 1000);
  };

  const hapticLike = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const hapticDislike = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  const getImageUri = (item) => {
    const fail = failedImages[item.id] ?? 0;
    if (fail === 0) return item.image;
    if (fail === 1) return item.backupImage || item.fallbackImage || item.image;
    return item.fallbackImage || item.backupImage || item.image;
  };

  const openDetails = async (item) => {
    setSelectedItem(item);
    setDetails(null);
    setDetailLoading(true);
    setDetailVisible(true);

    Animated.timing(panelY, { toValue: 0, duration: 260, useNativeDriver: true }).start();

    const detailsData = await fetchContentDetails(item.type, item.tmdbId);
    setDetails(detailsData);
    setDetailLoading(false);
  };

  const closeDetails = () => {
    Animated.timing(panelY, { toValue: 460, duration: 220, useNativeDriver: true }).start(() => setDetailVisible(false));
  };

  const onRight = () => {
    const byButton = actionSourceRef.current === 'right';
    actionSourceRef.current = null;
    if (!byButton) hapticLike();
    showToast(mode === 'tv' ? 'Series liked!' : 'Movie liked!');
  };

  const onLeft = () => {
    const byButton = actionSourceRef.current === 'left';
    actionSourceRef.current = null;
    if (!byButton) hapticDislike();
    showToast(mode === 'tv' ? 'Series disliked!' : 'Movie disliked!');
  };

  const renderCard = (item) => {
    if (!item) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No more content</Text>
        </View>
      );
    }

    return (
      <Pressable style={styles.card} onPress={() => openDetails(item)}>
        <Image
          source={{ uri: getImageUri(item) }}
          style={styles.poster}
          resizeMode="cover"
          onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))}
        />

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.gradient}>
          <View style={styles.metaRow}>
            <View style={styles.metaTextWrap}>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.subtitle}>IMDb Score</Text>
            </View>
            <ScoreRing score={item.score} />
          </View>
        </LinearGradient>

        <Pressable style={styles.infoBtn} onPress={() => openDetails(item)}>
          <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>{mode === 'tv' ? 'Pick a Series' : 'Pick a Movie'}</Text>

      <View style={styles.swiperWrap}>
        {loading ? (
          <ActivityIndicator size="large" color="#8B3DFF" />
        ) : loadError ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>Could not load content.</Text>
          </View>
        ) : (
          <Swiper
            ref={swiperRef}
            cards={items}
            renderCard={renderCard}
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={16}
            disableTopSwipe
            disableBottomSwipe
            onSwipedRight={onRight}
            onSwipedLeft={onLeft}
            animateCardOpacity
            animateOverlayLabelsOpacity
            verticalSwipe={false}
          />
        )}
      </View>

      <View style={styles.actions}>
        <ActionButton
          icon="close"
          color="#FF4D67"
          onPress={async () => {
            actionSourceRef.current = 'left';
            await hapticDislike();
            swiperRef.current?.swipeLeft();
          }}
        />
        <ActionButton
          icon="heart"
          color="#FF5FA2"
          onPress={async () => {
            actionSourceRef.current = 'right';
            await hapticLike();
            swiperRef.current?.swipeRight();
          }}
        />
      </View>

      <TouchableOpacity style={styles.cancel} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <Modal transparent visible={detailVisible} animationType="none">
        <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={styles.backdrop} onPress={closeDetails} />

        <Animated.View style={[styles.panel, { transform: [{ translateY: panelY }] }]}>
          <View style={styles.handle} />

          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle} numberOfLines={1}>
              {selectedItem?.title}
            </Text>
            <Pressable onPress={closeDetails} style={styles.close}>
              <AntDesign name="close" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {detailLoading ? (
            <ActivityIndicator size="small" color="#8B3DFF" />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.blockTitle}>Overview</Text>
              <Text style={styles.blockText}>{details?.overview || 'No overview available for this content.'}</Text>

              <Text style={[styles.blockTitle, styles.blockMargin]}>Cast</Text>
              {details?.cast?.length ? (
                details.cast.map((castMember) => (
                  <View key={castMember.id} style={styles.castRow}>
                    <View style={styles.avatar}>
                      {castMember.profileImage ? (
                        <Image source={{ uri: castMember.profileImage }} style={styles.avatarImg} />
                      ) : (
                        <Ionicons name="person-outline" size={18} color="#BFBFBF" />
                      )}
                    </View>
                    <Text style={styles.blockText}>{castMember.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.blockText}>Cast information is not available.</Text>
              )}

              <Text style={[styles.blockTitle, styles.blockMargin]}>Watch Providers</Text>
              <View style={styles.providers}>
                {details?.providers?.length ? (
                  details.providers.map((provider) => <Image key={provider.id} source={{ uri: provider.logo }} style={styles.provider} />)
                ) : (
                  <View style={styles.banner}>
                    <Ionicons name="information-circle-outline" size={16} color="#FFC978" />
                    <Text style={styles.bannerText}>Su an dijital platformlarda mevcut degil</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  pageTitle: { color: '#FFF', fontSize: 28, fontWeight: '700', marginTop: 6 },
  swiperWrap: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  card: { width: 320, height: 470, borderRadius: 20, backgroundColor: '#1D1D1D', overflow: 'hidden' },
  poster: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 46, paddingBottom: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  metaTextWrap: { flex: 1, marginRight: 10 },
  titleText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#ECECEC', fontSize: 15, marginTop: 4, fontWeight: '600' },
  scoreRingWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  scoreRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  scoreRingText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  infoBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', alignItems: 'center' },
  emptyCard: { width: 320, height: 470, borderRadius: 20, backgroundColor: '#1D1D1D', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#FFF', fontSize: 20, fontWeight: '600' },
  status: { width: '100%', maxWidth: 320, backgroundColor: '#1D1D1D', borderRadius: 16, padding: 22, alignItems: 'center' },
  statusText: { color: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  actions: { width: 180, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  actionShadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 },
  actionButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  cancel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#2A2A2A' },
  cancelText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  toast: { position: 'absolute', bottom: 22, alignSelf: 'center', backgroundColor: '#1F1F1F', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2E2E2E' },
  toastText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', backgroundColor: '#1A1A1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 22 },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 99, backgroundColor: '#4A4A4A', marginBottom: 14 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  panelTitle: { flex: 1, color: '#FFF', fontSize: 20, fontWeight: '700', marginRight: 10 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2B2B2B', justifyContent: 'center', alignItems: 'center' },
  blockTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 7 },
  blockText: { color: '#CFCFCF', fontSize: 14, lineHeight: 21 },
  blockMargin: { marginTop: 16 },
  castRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2D2D2D', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  providers: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  provider: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#262626' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#3A3A3A', borderRadius: 10, backgroundColor: '#232323', paddingHorizontal: 10, paddingVertical: 8 },
  bannerText: { color: '#E4E4E4', fontSize: 13, fontWeight: '500' },
});
*/
import React, { useEffect, useRef, useState } from 'react';
import { 
  ActivityIndicator, 
  Animated, 
  Image, 
  Modal, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// Local Imports
import MovieCard from '../components/MovieCard/MovieCard';
import DetailModal from '../components/DetailModal/DetailModal';
import ActionButtons from '../components/ActionButtons/ActionButtons';
import { fetchContent, fetchContentDetails } from '../services/api';

/** 
 * Yardımcı Fonksiyonlar 
 */

// Tekrarlanan verileri hem 'id' hem 'tmdbId' kontrolü ile temizler
const dedupeByTmdbId = (items) => {
  if (!items || !Array.isArray(items)) return [];
  return items.filter((item, index, self) => 
    self.findIndex((compareItem) => 
      (compareItem.id || compareItem.tmdbId) === (item.id || item.tmdbId)
    ) === index
  );
};

const getScoreColor = (score) => (score >= 7.5 ? '#3DDC84' : score >= 5 ? '#F4C542' : '#FF5C6A');

/** 
 * Alt Bileşenler 
 */

function ScoreRing({ score }) {
  const size = 52;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(10, Number(score) || 0));
  const offset = circumference * (1 - value / 10);

  return (
    <View style={localStyles.scoreRingWrap}>
      <Svg width={size} height={size}>
        <Circle stroke="rgba(255,255,255,0.2)" fill="transparent" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <Circle
          stroke={getScoreColor(value)}
          fill="transparent"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={localStyles.scoreRingCenter}>
        <Text style={localStyles.scoreRingText}>{value.toFixed(1)}</Text>
      </View>
    </View>
  );
}

/** 
 * Ana Ekran: MatchScreen 
 */

export default function MatchScreen({ navigation, route }) {
  const mode = route?.params?.mode || 'movie';
  const category = route?.params?.category || 'popular';

  const swiperRef = useRef(null);
  const actionSourceRef = useRef(null);
  const toastTimerRef = useRef(null);
  const panelY = useRef(new Animated.Value(460)).current;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState('');
  const [failedImages, setFailedImages] = useState({});
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        if (mode === 'tv' && category === 'mixed') {
          const [popular, topRated] = await Promise.all([
            fetchContent('tv', 'popular'), 
            fetchContent('tv', 'top_rated')
          ]);
          setItems(dedupeByTmdbId([...popular, ...topRated]));
        } else {
          const content = await fetchContent(mode, category);
          setItems(dedupeByTmdbId(content));
        }
      } catch (err) {
        console.error("Content loading error:", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [mode, category]);

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(''), 1000);
  };

  const triggerHaptic = async (type) => {
    try {
      if (type === 'like') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {}
  };

  const getImageUri = (item) => {
    const failCount = failedImages[item.id] ?? 0;
    if (failCount === 0) return item.image;
    if (failCount === 1) return item.backupImage || item.fallbackImage || item.image;
    return item.fallbackImage || item.backupImage || item.image;
  };

  const openDetails = async (item) => {
    setSelectedItem(item);
    setDetails(null);
    setDetailLoading(true);
    setDetailVisible(true);

    Animated.timing(panelY, { toValue: 0, duration: 260, useNativeDriver: true }).start();

    try {
      const data = await fetchContentDetails(item.type, item.tmdbId || item.id);
      setDetails(data);
    } catch (err) {
      console.error("Detail loading error:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    Animated.timing(panelY, { toValue: 460, duration: 220, useNativeDriver: true }).start(() => {
      setDetailVisible(false);
    });
  };

  const onSwipedRight = () => {
    const byButton = actionSourceRef.current === 'right';
    actionSourceRef.current = null;
    if (!byButton) triggerHaptic('like');
    showToast(mode === 'tv' ? 'Series liked!' : 'Movie liked!');
  };

  const onSwipedLeft = () => {
    const byButton = actionSourceRef.current === 'left';
    actionSourceRef.current = null;
    if (!byButton) triggerHaptic('dislike');
    showToast(mode === 'tv' ? 'Series disliked!' : 'Movie disliked!');
  };

  return (
    <View style={localStyles.container}>
      <Text style={localStyles.pageTitle}>{mode === 'tv' ? 'Pick a Series' : 'Pick a Movie'}</Text>

      <View style={localStyles.swiperWrap}>
        {loading ? (
          <ActivityIndicator size="large" color="#8B3DFF" />
        ) : loadError ? (
          <View style={localStyles.status}>
            <Text style={localStyles.statusText}>Could not load content.</Text>
          </View>
        ) : (
          <Swiper
            ref={swiperRef}
            cards={items}
            renderCard={(item) =>
              item ? (
                <MovieCard
                  item={item}
                  imageUri={getImageUri(item)}
                  onPress={() => openDetails(item)}
                  onImageError={() =>
                    setFailedImages((prev) => ({
                      ...prev,
                      [item.id]: (prev[item.id] ?? 0) + 1,
                    }))
                  }
                  ScoreRingComponent={<ScoreRing score={item.score} />}
                />
              ) : (
                <View style={localStyles.emptyCard}>
                  <Text style={localStyles.emptyText}>No more content</Text>
                </View>
              )
            }
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={16}
            disableTopSwipe
            disableBottomSwipe
            onSwipedRight={onSwipedRight}
            onSwipedLeft={onSwipedLeft}
            animateCardOpacity
            animateOverlayLabelsOpacity
            verticalSwipe={false}
          />
        )}
      </View>

      <ActionButtons 
        onDislike={async () => {
          actionSourceRef.current = 'left';
          await triggerHaptic('dislike');
          swiperRef.current?.swipeLeft();
        }} 
        onLike={async () => {
          actionSourceRef.current = 'right';
          await triggerHaptic('like');
          swiperRef.current?.swipeRight();
        }} 
      />

      <TouchableOpacity style={localStyles.cancel} onPress={() => navigation.navigate('Home')}>
        <Text style={localStyles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      {toast ? (
        <View style={localStyles.toast}>
          <Text style={localStyles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <DetailModal
        visible={detailVisible}
        panelY={panelY}
        selectedItem={selectedItem}
        loading={detailLoading}
        details={details}
        onClose={closeDetails}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  pageTitle: { color: '#FFF', fontSize: 28, fontWeight: '700', marginTop: 6 },
  swiperWrap: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  emptyCard: { width: 320, height: 470, borderRadius: 20, backgroundColor: '#1D1D1D', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#FFF', fontSize: 20, fontWeight: '600' },
  status: { width: '100%', maxWidth: 320, backgroundColor: '#1D1D1D', borderRadius: 16, padding: 22, alignItems: 'center' },
  statusText: { color: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  cancel: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#2A2A2A' },
  cancelText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  toast: { position: 'absolute', bottom: 22, alignSelf: 'center', backgroundColor: '#1F1F1F', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#2E2E2E' },
  toastText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  scoreRingWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  scoreRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  scoreRingText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});