import assert from 'node:assert/strict';
import { test } from 'node:test';
import { genreLabels, mediaItemsSchema, discoveryItemsSchema } from '../lib/media.ts';
import { tmdbResponseSchema } from '../lib/tmdb.ts';

test('library payload accepts nullable metadata and relations without expanded users', () => {
  const items = mediaItemsSchema.parse([{
    id: 'movie-1', title: 'Example', overview: null, posterPath: null,
    releaseDate: null, genres: '[28,35]', voteAverage: null,
    watchEntries: [{ userId: 'me' }], ratings: [{ value: 8, review: null, userId: 'me' }],
  }]);
  assert.equal(items[0].ratings[0].value, 8);
  assert.equal(items[0].watchEntries[0].user, undefined);
  assert.equal(genreLabels(items[0].genres), '28, 35');
  assert.equal(genreLabels('[{"name":"Drama"},"Comedy"]'), 'Drama, Comedy');
  assert.throws(() => mediaItemsSchema.parse({ error: 'Failed to fetch media' }));
});

test('TMDB search accepts movie, TV and person results without invented media types', () => {
  const response = tmdbResponseSchema.parse({
    page: 1, total_pages: 1, total_results: 3,
    results: [
      { id: 1, title: 'Movie', media_type: 'movie', genre_ids: [28] },
      { id: 2, name: 'Series', first_air_date: '2020-01-01' },
      { id: 3, name: 'Actor', media_type: 'person', profile_path: null },
    ],
  });
  assert.equal(response.results[0].media_type, 'movie');
  assert.equal(response.results[1].media_type, undefined);
  assert.equal(response.results[2].media_type, 'person');
  assert.equal(response.results[2].poster_path, null);
  assert.throws(() => tmdbResponseSchema.parse({ results: [{ id: 'invalid' }] }));
});

test('discovery payload validates the normalized response consumed by the watchlist', () => {
  const suggestion = { id: 1, tmdbId: 1, title: 'Example', overview: '',
    posterPath: null, backdropPath: null, mediaType: 'MOVIE', isSuggestion: true };
  assert.equal(discoveryItemsSchema.parse([suggestion])[0].tmdbId, 1);
  assert.throws(() => discoveryItemsSchema.parse([{ ...suggestion, mediaType: 'movie' }]));
  assert.throws(() => genreLabels('[{"other":"invalid"}]'));
});
