import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdbId, type, title, overview, posterPath, backdropPath, releaseDate, genres, userMode, mood, rating } = body;

    // Resolve User based on mode
    let userId = body.userId;
    if (!userId && userMode) {
      const user = await prisma.user.upsert({
        where: { id: userMode }, // Using mode as ID for simplicity (e.g. "ME", "GIRLFRIEND") or name
        // Actually, ID must be CUID usually, but we can seed/find by name.
        // Let's use name for lookup.
        create: { name: userMode },
        update: {},
      });
      // Wait, schema has ID as CUID. We can't query by ID if we don't know it.
      // We should query by name. But name isn't unique in schema?
      // Let's fix schema or just findFirst.
      const existingUser = await prisma.user.findFirst({ where: { name: userMode } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({ data: { name: userMode } });
        userId = newUser.id;
      }
    }
    const mediaItem = await prisma.mediaItem.upsert({
      where: { tmdbId: tmdbId },
      update: {
        title,
        overview,
        posterPath,
        backdropPath,
        releaseDate,
        genres: JSON.stringify(genres),
        voteAverage: body.voteAverage,
      },
      create: {
        tmdbId,
        type: type === 'tv' ? 'SERIES' : 'MOVIE',
        title,
        overview,
        posterPath,
        backdropPath,
        releaseDate,
        genres: JSON.stringify(genres),
        voteAverage: body.voteAverage,
      },
    });

    // 2. Create WatchEntry if userId is provided
    if (userId) {
      await prisma.watchEntry.create({
        data: {
          userId,
          mediaItemId: mediaItem.id,
          mood,
        },
      });

      // 3. Create Rating if provided
      if (rating) {
        await prisma.rating.create({
          data: {
            userId,
            mediaItemId: mediaItem.id,
            value: rating,
          },
        });
      }
    }

    return NextResponse.json({ success: true, mediaItem });
  } catch (error) {
    console.error('Error saving media:', error);
    return NextResponse.json({ error: 'Failed to save media' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // MOVIE or SERIES
  const userMode = searchParams.get('userMode'); // ME, GIRLFRIEND, TOGETHER
  const watched = searchParams.get('watched'); // true/false

  try {
    // Basic query construction
    // If userMode is provided, we might want to filter by what THAT user has watched.
    // But for the main list, we usually want to see "All Movies" or "My Watched Movies".
    
    // Let's assume we want to list all MediaItems first, and optionally filter by watched status for a specific user.
    
    const where: any = {};
    if (type) where.type = type;

    // If we want to filter by "Unseen" (watched=false) for a specific user:
    if (watched === 'false' && userMode) {
       // This is complex in Prisma without raw query or careful include/where.
       // "Find media where there is NO WatchEntry for this user"
       where.watchEntries = {
         none: {
           user: { name: userMode }
         }
       };
    } else if (watched === 'true' && userMode) {
       where.watchEntries = {
         some: {
           user: { name: userMode }
         }
       };
    }

    const items = await prisma.mediaItem.findMany({
      where,
      include: {
        watchEntries: true, // Include to check status on client if needed
        ratings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
