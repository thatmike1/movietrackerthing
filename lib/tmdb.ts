const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export type TMDBResult = {
  id: number;
  title?: string;
  name?: string; // For TV series
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string; // For TV series
  media_type: 'movie' | 'tv';
  genre_ids: number[];
  vote_average: number;
};

export type TMDBResponse = {
  page: number;
  results: TMDBResult[];
  total_pages: number;
  total_results: number;
};

export const searchMulti = async (query: string): Promise<TMDBResponse> => {
  if (!query) return { page: 1, results: [], total_pages: 0, total_results: 0 };
  
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
  if (!res.ok) throw new Error('Failed to fetch from TMDB');
  return res.json();
};

export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
  if (!path) return '/placeholder.png'; // You might want to add a placeholder image
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
