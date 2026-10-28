import { z } from 'zod';

const userSchema = z.object({ name: z.string() }).nullish();
export const mediaItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  overview: z.string().nullable(),
  posterPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  genres: z.string(),
  voteAverage: z.number().nullable(),
  watchEntries: z.array(z.object({ user: userSchema })),
  ratings: z.array(z.object({ value: z.number(), review: z.string().nullable(), user: userSchema })),
});
export const mediaItemsSchema = z.array(mediaItemSchema);
export type MediaItem = z.infer<typeof mediaItemSchema>;

export const discoveryItemsSchema = z.array(z.object({
  id: z.number(),
  tmdbId: z.number(),
  title: z.string(),
  overview: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().optional(),
  mediaType: z.enum(['MOVIE', 'SERIES']),
  isSuggestion: z.boolean(),
}));
export type DiscoveryItem = z.infer<typeof discoveryItemsSchema>[number];

/** reads stored genre labels and ids without trusting arbitrary JSON */
export function genreLabels(genres: string): string {
  const values: unknown = JSON.parse(genres || '[]');
  return z.array(z.union([z.string(), z.number(), z.object({ name: z.string() })]))
    .parse(values).map((genre) => typeof genre === 'object' ? genre.name : genre).join(', ');
}
