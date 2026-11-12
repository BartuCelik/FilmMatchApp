const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_ATTEMPTS,
  DAILY_CALL_LIMIT,
  isReadyForCuration,
  planClaim,
  failureStatus,
  buildSignals,
  parsePicks,
  toPoolItem,
  finalizePool,
} = require('./curation');

const readySession = {
  selectedMode: 'ai',
  participants: ['a', 'b'],
  curationResponses: { a: { energy: 70 }, b: { energy: 20 } },
};

test('isReadyForCuration only when both answered in idle AI mode', () => {
  assert.equal(isReadyForCuration(readySession), true);
  assert.equal(isReadyForCuration({ ...readySession, aiStatus: 'generating' }), false);
  assert.equal(isReadyForCuration({ ...readySession, aiStatus: 'error' }), false);
  assert.equal(isReadyForCuration({ ...readySession, selectedMode: 'movie' }), false);
  assert.equal(isReadyForCuration({ ...readySession, curationResponses: { a: {} } }), false);
  assert.equal(isReadyForCuration({ ...readySession, moviePool: [{ id: 'x' }] }), false);
  assert.equal(isReadyForCuration({ ...readySession, isDisbanded: true }), false);
  assert.equal(isReadyForCuration({ ...readySession, aiAttempts: MAX_ATTEMPTS }), false);
});

test('planClaim counts attempts and enforces the daily cap', () => {
  const today = '2026-11-12';
  const plan = planClaim(readySession, { day: today, count: 5 }, today);
  assert.equal(plan.run, true);
  assert.deepEqual(plan.sessionUpdate, { aiStatus: 'generating', aiAttempts: 1 });
  assert.deepEqual(plan.usageUpdate, { day: today, count: 6 });

  // yesterday's counter resets
  assert.deepEqual(planClaim(readySession, { day: '2026-11-11', count: DAILY_CALL_LIMIT }, today).usageUpdate, { day: today, count: 1 });

  const blocked = planClaim(readySession, { day: today, count: DAILY_CALL_LIMIT }, today);
  assert.equal(blocked.run, false);
  assert.deepEqual(blocked.sessionUpdate, { aiStatus: 'limit' });

  assert.equal(planClaim({ ...readySession, aiStatus: 'generating' }, undefined, today), null);
});

test('failureStatus becomes terminal after the last attempt', () => {
  assert.equal(failureStatus(1), 'error');
  assert.equal(failureStatus(MAX_ATTEMPTS), 'failed');
});

test('buildSignals maps participants to A/B and clamps input', () => {
  const s = buildSignals({
    participants: ['a', 'b'],
    curationResponses: { a: { energy: 250, moodText: '  gerilim  ', redLines: ['Korku', 3] }, b: null },
  });
  assert.deepEqual(s.userA, { moodPreset: null, moodText: 'gerilim', energy: 100, redLines: ['Korku'], redLinesText: '' });
  assert.equal(s.userB.energy, 50);
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

test('toPoolItem builds client-compatible item', () => {
  const item = toPoolItem(
    { originalTitle: 'Inception', source: 'common', reason: 'r' },
    { id: 27205, title: 'Başlangıç', overview: 'o', poster_path: '/p.jpg', vote_average: 8.4 },
  );
  assert.equal(item.id, 'movie-27205');
  assert.equal(item.image, 'https://image.tmdb.org/t/p/w500/p.jpg');
  assert.equal(item.title, 'Başlangıç');
});

test('finalizePool dedupes, caps at 8 and rejects tiny pools', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ tmdbId: i % 9 }));
  const pool = finalizePool(items);
  assert.equal(pool.length, 8);
  assert.equal(new Set(pool.map((p) => p.tmdbId)).size, 8);
  assert.throws(() => finalizePool([{ tmdbId: 1 }, { tmdbId: 2 }]));
});
