import test from 'node:test';
import assert from 'node:assert/strict';
import { pickSignals, parsePicks, toPoolItem, finalizePool } from '../src/curation.js';

test('pickSignals clamps input and fills defaults', () => {
  assert.deepEqual(
    pickSignals({ energy: 250, moodText: '  gerilim  ', redLines: ['Korku', 3] }),
    { moodPreset: null, moodText: 'gerilim', energy: 100, redLines: ['Korku'], redLinesText: '' },
  );
  assert.equal(pickSignals(null).energy, 50);
});

test('parsePicks drops invalid and duplicate entries', () => {
  const picks = parsePicks(
    JSON.stringify({
      movies: [
        { originalTitle: 'Inception', year: 2010, source: 'common', reason: 'r' },
        { originalTitle: 'inception', year: 2010, source: 'userA', reason: 'dup' },
        { originalTitle: '', year: 2000, source: 'common', reason: 'x' },
        { originalTitle: 'Heat', year: 1995, source: 'nobody', reason: 'x' },
      ],
    }),
  );
  assert.deepEqual(picks, [{ originalTitle: 'Inception', year: 2010, source: 'common', reason: 'r' }]);
  assert.throws(() => parsePicks('{"nope":1}'));
});

test('parsePicks extracts JSON from fenced text', () => {
  const text = 'Here you go:\n```json\n{"movies":[{"originalTitle":"Heat","year":1995,"source":"common","reason":"x"}]}\n```';
  assert.equal(parsePicks(text)[0].originalTitle, 'Heat');
});

test('toPoolItem builds client-compatible item', () => {
  const item = toPoolItem(
    { originalTitle: 'Inception', source: 'common', reason: 'r' },
    { id: 27205, title: 'Başlangıç', overview: 'o', poster_path: '/p.jpg', vote_average: 8.4 },
  );
  assert.equal(item.id, 'movie-27205');
  assert.equal(item.image, 'https://image.tmdb.org/t/p/w500/p.jpg');
  assert.equal(item.title, 'Başlangıç');
});

test('parsePicks throws clear error when no JSON', () => {
  assert.throws(() => parsePicks('sorry'), /contains no JSON/);
});

test('finalizePool dedupes, caps at 8 and rejects tiny pools', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ tmdbId: i % 9 }));
  const pool = finalizePool(items);
  assert.equal(pool.length, 8);
  assert.equal(new Set(pool.map((p) => p.tmdbId)).size, 8);
  assert.throws(() => finalizePool([{ tmdbId: 1 }, { tmdbId: 2 }]));
});
