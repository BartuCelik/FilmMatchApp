import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { fetchMovies } from '../services/movieApi';

export default function MatchScreen({ navigation }) {
  const swiperRef = useRef(null);
  const toastTimerRef = useRef(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [failedImages, setFailedImages] = useState({});

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      const fetchedMovies = await fetchMovies();
      setMovies(fetchedMovies);
      setLoading(false);
    };

    loadMovies();

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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

  const getMovieImageUri = (movie) => {
    const failCount = failedImages[movie.id] ?? 0;
    if (failCount === 0) {
      return movie.image;
    }
    if (failCount === 1) {
      return movie.backupImage || movie.fallbackImage || movie.image;
    }
    return movie.fallbackImage || movie.backupImage || movie.image;
  };

  const renderCard = (movie) => {
    if (!movie) {
      return (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Film kalmadi</Text>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Image
          source={{ uri: getMovieImageUri(movie) }}
          style={styles.poster}
          resizeMode="cover"
          onError={() => {
            const failCount = failedImages[movie.id] ?? 0;
            setFailedImages((prev) => ({ ...prev, [movie.id]: failCount + 1 }));
            console.log('Poster yüklenemedi:', movie.title, getMovieImageUri(movie));
          }}
        />
        <View style={styles.cardFooter}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <Text style={styles.movieRating}>TMDB: {Number(movie.score).toFixed(1)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Film Sec</Text>

      <View style={styles.swiperContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#8B3DFF" />
        ) : (
          <Swiper
            ref={swiperRef}
            cards={movies}
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
              console.log('Beğenildi');
              showToast('Film Beğenildi!');
            }}
            onSwipedLeft={() => {
              console.log('Beğenilmedi');
              showToast('Film Beğenilmedi!');
            }}
            animateCardOpacity
            animateOverlayLabelsOpacity
            verticalSwipe={false}
          />
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => swiperRef.current?.swipeLeft()}>
          <Text style={styles.actionText}>Beğenmedim (X)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => swiperRef.current?.swipeRight()}
        >
          <Text style={styles.actionText}>Beğendim (Kalp)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.cancelButtonText}>Vazgeç</Text>
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
