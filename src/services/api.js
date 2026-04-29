import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const ALT_IMAGE_BASE_URL = 'https://www.themoviedb.org/t/p/w500';
const FALLBACK_IMAGE = 'https://picsum.photos/400/600';
const SUPPORTED_TYPES = ['movie', 'tv'];
const SUPPORTED_CATEGORIES = ['popular', 'top_rated'];

// Convert movie and TV objects into one shared app model.
const normalizeContentItem = (item, type) => {
  const imagePath = item.poster_path || item.backdrop_path;

  return {
    id: `${type}-${item.id}`,
    tmdbId: item.id,
    type,
    title: type === 'tv' ? item.name : item.title,
    score: item.vote_average,
    overview: item.overview,
    image: imagePath ? `${IMAGE_BASE_URL}${imagePath}` : FALLBACK_IMAGE,
    backupImage: imagePath ? `${ALT_IMAGE_BASE_URL}${imagePath}` : FALLBACK_IMAGE,
    fallbackImage: FALLBACK_IMAGE,
  };
};

const isValidType = (type) => SUPPORTED_TYPES.includes(type);
const isValidCategory = (category) => SUPPORTED_CATEGORIES.includes(category);

export const fetchContent = async (type, category = 'popular') => {
  // Validate function input early to avoid silent API issues.
  if (!isValidType(type)) {
    throw new Error("type must be either 'movie' or 'tv'");
  }
  if (!isValidCategory(category)) {
    throw new Error("category must be either 'popular' or 'top_rated'");
  }
  if (!API_KEY) {
    console.error('TMDB API key missing. Add EXPO_PUBLIC_TMDB_API_KEY to your environment.');
    return [];
  }

  try {
    const response = await axios.get(`${BASE_URL}/${type}/${category}`, {
      params: {
        api_key: API_KEY,
        language: 'tr-TR',
        page: 1,
      },
      timeout: 10000,
    });

    return response.data.results.map((item) => normalizeContentItem(item, type));
  } catch (error) {
    console.error(`Failed to fetch ${type}/${category} content:`, error?.message || error);
    return [];
  }
};
