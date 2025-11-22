import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mediaItemId, userMode, value, review } = body;

    // Resolve User
    const user = await prisma.user.findFirst({ where: { name: userMode } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rating = await prisma.rating.upsert({
      where: {
        userId_mediaItemId: {
          userId: user.id,
          mediaItemId,
        },
      },
      update: {
        value,
        review,
      },
      create: {
        userId: user.id,
        mediaItemId,
        value,
        review,
      },
    });

    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error('Error saving rating:', error);
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
  }
}
