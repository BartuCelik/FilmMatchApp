import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const picks = (n) => ({
  movies: Array.from({ length: n }, (_, i) => ({ originalTitle: `Film ${i}`, year: 2000 + i, source: 'common', reason: 'r' })),
});
const stubTmdb = (resolve) => {
  globalThis.fetch = async (url) => {
    const q = new URL(url).searchParams.get('query');
    const movie = resolve(q);
    return Response.json({ results: movie ? [movie] : [] });
  };
};
const okTmdb = () => stubTmdb((q) => ({ id: Number(q.split(' ')[1]) + 1, title: q, poster_path: '/p.jpg' }));
const env = (over = {}) => ({
  AI: { run: async () => ({ response: JSON.stringify(picks(8)) }) },
  LIMITER: { limit: async () => ({ success: true }) },
  TMDB_API_KEY: 'k',
  ...over,
});
const post = (body) =>
  new Request('https://x/curate', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
const valid = { userA: { moodText: 'a' }, userB: { energy: 80 } };

test('200 returns moviePool of 4..8 items', async () => {
  okTmdb();
  const res = await worker.fetch(post(valid), env());
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /application\/json/);
  const { moviePool } = await res.json();
  assert.ok(moviePool.length >= 4 && moviePool.length <= 8);
});

test('200 when AI returns an object instead of a string', async () => {
  okTmdb();
  const res = await worker.fetch(post(valid), env({ AI: { run: async () => ({ response: picks(6) }) } }));
  assert.equal(res.status, 200);
});

test('400 on missing userB', async () => {
  assert.equal((await worker.fetch(post({ userA: {} }), env())).status, 400);
});

test('400 on non-JSON body', async () => {
  assert.equal((await worker.fetch(post('nope'), env())).status, 400);
});

test('429 when limiter rejects', async () => {
  const res = await worker.fetch(post(valid), env({ LIMITER: { limit: async () => ({ success: false }) } }));
  assert.equal(res.status, 429);
});

test('429 when AI throws quota error', async () => {
  const AI = { run: async () => { throw new Error('4006: you have used up your daily free allocation of 10,000 neurons'); } };
  assert.equal((await worker.fetch(post(valid), env({ AI }))).status, 429);
});

test('502 when AI throws other error', async () => {
  const AI = { run: async () => { throw new Error('boom'); } };
  assert.equal((await worker.fetch(post(valid), env({ AI }))).status, 502);
});

test('502 when fewer than 4 films resolve', async () => {
  stubTmdb((q) => (q === 'Film 0' || q === 'Film 1' ? { id: 1 + Number(q.split(' ')[1]), title: q } : null));
  assert.equal((await worker.fetch(post(valid), env())).status, 502);
});

test('405 on GET', async () => {
  assert.equal((await worker.fetch(new Request('https://x/curate'), env())).status, 405);
});
