import { z } from 'zod';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbResultSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
  poster_path: z.string().nullable().default(null),
  backdrop_path: z.string().nullable().default(null),
  overview: z.string().default(''),
  release_date: z.string().optional(),
  first_air_date: z.string().optional(),
  media_type: z.enum(['movie', 'tv', 'person']).optional(),
  genre_ids: z.array(z.number()).default([]),
  vote_average: z.number().default(0),
});
export type TMDBResult = z.infer<typeof tmdbResultSchema>;
export const tmdbResponseSchema = z.object({
  page: z.number(),
  results: z.array(tmdbResultSchema),
  total_pages: z.number(),
  total_results: z.number(),
});
export type TMDBResponse = z.infer<typeof tmdbResponseSchema>;

export const searchMulti = async (query: string): Promise<TMDBResponse> => {
  if (!query) return { page: 1, results: [], total_pages: 0, total_results: 0 };

  const res = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`);
  if (!res.ok) throw new Error('Failed to fetch from TMDB');
  return tmdbResponseSchema.parse(await res.json());
};

export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
  if (!path) return '/placeholder.png'; // You might want to add a placeholder image
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
