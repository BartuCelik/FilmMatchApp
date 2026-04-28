import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/p/w500';
const ALT_IMAGE_BASE_URL = 'https://www.themoviedb.org/t/p/w500';
const FALLBACK_POSTER =
  'https://picsum.photos/400/600';

const getImageVariants = (posterPath, backdropPath) => {
  if (posterPath) {
    return {
      image: `${IMAGE_BASE_URL}${posterPath}`,
      backupImage: `${ALT_IMAGE_BASE_URL}${posterPath}`,
    };
  }
  if (backdropPath) {
    return {
      image: `${IMAGE_BASE_URL}${backdropPath}`,
      backupImage: `${ALT_IMAGE_BASE_URL}${backdropPath}`,
    };
  }
  return {
    image: FALLBACK_POSTER,
    backupImage: FALLBACK_POSTER,
  };
};

export const fetchMovies = async () => {
  if (!API_KEY) {
    console.error('TMDB API key eksik. .env dosyasina EXPO_PUBLIC_TMDB_API_KEY ekleyin.');
    return [];
  }

  try {
    const response = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: API_KEY,
        language: 'tr-TR', // Filmler Türkçe gelsin
        page: 1,
      },
    });

    return response.data.results.map((movie) => {
      const imageVariants = getImageVariants(movie.poster_path, movie.backdrop_path);
      return {
        id: movie.id,
        title: movie.title,
        image: imageVariants.image,
        backupImage: imageVariants.backupImage,
        fallbackImage: FALLBACK_POSTER,
        score: movie.vote_average,
        overview: movie.overview,
      };
    });
  } catch (error) {
    console.error("Film çekilirken hata oluştu:", error);
    return [];
  }
};