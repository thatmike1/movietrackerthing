import { NextResponse } from 'next/server';
import { z } from 'zod';
import { tmdbResponseSchema } from '@/lib/tmdb';
import { prisma } from '@/lib/prisma';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie'; // movie or tv
  const userMode = searchParams.get('userMode');

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  try {
    // 1. Get User's top genres based on high ratings (>= 8)
    // If no ratings, use default popular genres or just popular items

    // We need to find the user first
    const user = await prisma.user.findFirst({ where: { name: userMode || 'ME' } });

    let genreIds: string = '';

    if (user) {
      const topRatings = await prisma.rating.findMany({
        where: { userId: user.id, value: { gte: 8 } },
        include: { mediaItem: true },
        take: 10,
      });

      if (topRatings.length > 0) {
        // Extract genres from top rated items
        const genreCounts: Record<number, number> = {};
        topRatings.forEach((r) => {
           try {
             const gIds = z.array(z.number()).parse(JSON.parse(r.mediaItem.genres));
             if (Array.isArray(gIds)) {
               gIds.forEach((id: number) => {
                 genreCounts[id] = (genreCounts[id] || 0) + 1;
               });
             }
           } catch {
             // ignore parsing error
           }
        });

        // Get top 3 genres
        const sortedGenres = Object.entries(genreCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([id]) => id);

        genreIds = sortedGenres.join(',');
      }
    }

    // 2. Fetch from TMDB Discover
    // If we have genres, filter by them. If not, just get popular.
    let url = `${BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1`;

    if (genreIds) {
      url += `&with_genres=${genreIds}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from TMDB');
    const data = tmdbResponseSchema.parse(await res.json());

    // 3. Filter out items already in DB
    const existingItems = await prisma.mediaItem.findMany({
      select: { tmdbId: true },
    });
    const existingIds = new Set(existingItems.map((i) => i.tmdbId));

    const recommendations = data.results
      .filter((item) => !existingIds.has(item.id))
      .map((item) => ({
        id: item.id, // TMDB ID
        tmdbId: item.id,
        title: item.title || item.name,
        overview: item.overview,
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        releaseDate: item.release_date || item.first_air_date,
        mediaType: type === 'movie' ? 'MOVIE' : 'SERIES',
        // Add a flag to indicate this is an external suggestion
        isSuggestion: true
      }))
      .slice(0, 10); // Limit to 10

    return NextResponse.json(recommendations);

  } catch (error) {
    console.error('Error fetching discovery:', error);
    return NextResponse.json({ error: 'Failed to fetch discovery' }, { status: 500 });
  }
}
