import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { fetchContent } from '../services/api';

// Remove duplicate items when we combine multiple lists.
const dedupeByTmdbId = (items) =>
  items.filter(
    (item, index, self) => self.findIndex((compareItem) => compareItem.tmdbId === item.tmdbId) === index
  );

export default function MatchScreen({ navigation, route }) {
  const mode = route?.params?.mode || 'movie';
  const category = route?.params?.category || 'popular';
  const swiperRef = useRef(null);
  const toastTimerRef = useRef(null);
  const [contentItems, setContentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [failedImages, setFailedImages] = useState({});

  // Load content based on selected mode and category.
  const loadContent = async () => {
    setLoading(true);
    setHasLoadError(false);
    try {
      if (mode === 'tv' && category === 'mixed') {
        const [popularSeries, topRatedSeries] = await Promise.all([
          fetchContent('tv', 'popular'),
          fetchContent('tv', 'top_rated'),
        ]);
        setContentItems(dedupeByTmdbId([...popularSeries, ...topRatedSeries]));
      } else {
        const fetchedContent = await fetchContent(mode, category);
        setContentItems(fetchedContent);
      }
    } catch (error) {
      console.error('Failed to load content list:', error);
      setHasLoadError(true);
      setContentItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [mode, category]);

  const showToast = (message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 1000);
  };

  const renderOverlay = (label, color) => (
    <View style={[styles.overlayBadge, { borderColor: color }]}>
      <Text style={[styles.overlayText, { color }]}>{label}</Text>
    </View>
  );

  const getCardImageUri = (item) => {
    const failCount = failedImages[item.id] ?? 0;
    if (failCount === 0) {
      return item.image;
    }
    if (failCount === 1) {
      return item.backupImage || item.fallbackImage || item.image;
    }
    return item.fallbackImage || item.backupImage || item.image;
  };

  const renderCard = (item) => {
    if (!item) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{mode === 'tv' ? 'No more series' : 'No more movies'}</Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: getCardImageUri(item) }}
          style={styles.poster}
          resizeMode="cover"
          onError={() => {
            const failCount = failedImages[item.id] ?? 0;
            setFailedImages((prev) => ({ ...prev, [item.id]: failCount + 1 }));
            console.log('Poster failed to load:', item.title, getCardImageUri(item));
          }}
        />
        <View style={styles.cardFooter}>
          <Text style={styles.movieTitle}>{item.title}</Text>
          <Text style={styles.movieRating}>TMDB: {Number(item.score).toFixed(1)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'tv' ? 'Pick a Series' : 'Pick a Movie'}</Text>

      <View style={styles.swiperContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#8B3DFF" />
        ) : hasLoadError ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>Could not load content.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadContent}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : contentItems.length === 0 ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>No content found to display.</Text>
          </View>
        ) : (
          <Swiper
            ref={swiperRef}
            cards={contentItems}
            renderCard={renderCard}
            cardIndex={0}
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={16}
            disableTopSwipe
            disableBottomSwipe
            overlayLabels={{
              left: {
                element: renderOverlay('NOPE', '#FF4D67'),
                style: {
                  wrapper: styles.leftOverlayWrapper,
                },
              },
              right: {
                element: renderOverlay('LIKE', '#30E07A'),
                style: {
                  wrapper: styles.rightOverlayWrapper,
                },
              },
            }}
            onSwipedRight={() => {
              console.log('Liked');
              showToast(mode === 'tv' ? 'Series liked!' : 'Movie liked!');
            }}
            onSwipedLeft={() => {
              console.log('Disliked');
              showToast(mode === 'tv' ? 'Series disliked!' : 'Movie disliked!');
            }}
            animateCardOpacity
            animateOverlayLabelsOpacity
            verticalSwipe={false}
          />
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => swiperRef.current?.swipeLeft()}>
          <Text style={styles.actionText}>Dislike (X)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => swiperRef.current?.swipeRight()}
        >
          <Text style={styles.actionText}>Like (Heart)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  swiperContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 320,
    height: 470,
    borderRadius: 20,
    backgroundColor: '#1D1D1D',
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: 390,
  },
  cardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  movieRating: {
    color: '#B8B8B8',
    fontSize: 14,
    marginTop: 4,
  },
  emptyCard: {
    width: 320,
    height: 470,
    borderRadius: 20,
    backgroundColor: '#1D1D1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  likeButton: {
    backgroundColor: '#8B3DFF',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1D1D1D',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#8B3DFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  overlayBadge: {
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(18, 18, 18, 0.35)',
    transform: [{ rotate: '-15deg' }],
  },
  overlayText: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
  },
  leftOverlayWrapper: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: 36,
    marginLeft: -36,
  },
  rightOverlayWrapper: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginTop: 36,
    marginLeft: 36,
  },
  toast: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
