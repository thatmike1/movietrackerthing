import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint'); // 'search' or 'discover'
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'movie'; // 'movie' or 'tv'
  const genre = searchParams.get('genre');
  
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB API Key missing' }, { status: 500 });
  }

  try {
    let url = '';

    if (endpoint === 'search') {
      if (!query) return NextResponse.json({ results: [] });
      url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false`;
    } else if (endpoint === 'discover') {
      url = `${BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1`;
      if (genre && genre !== 'all') {
        url += `&with_genres=${genre}`;
      }
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch from TMDB');
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 500 });
  }
}
