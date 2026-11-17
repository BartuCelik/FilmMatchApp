import { CURATOR_SYSTEM, POOL_SCHEMA, pickSignals, parsePicks, toPoolItem, finalizePool } from './curation.js';

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

const json = (body, status = 200) => Response.json(body, { status });

async function searchTmdb(env, title, year) {
  const params = new URLSearchParams({ api_key: env.TMDB_API_KEY, query: title, language: 'tr-TR', include_adult: 'false' });
  if (year) params.set('year', String(year));
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`);
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  return (await res.json()).results?.[0] ?? null;
}

async function resolveOnTmdb(env, pick) {
  // Year from the model can be off by one; retry without it before giving up.
  const movie = (await searchTmdb(env, pick.originalTitle, pick.year)) ?? (await searchTmdb(env, pick.originalTitle, null));
  return movie ? toPoolItem(pick, movie) : null;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid JSON' }, 400);
    }
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    if (!isObj(body) || !isObj(body.userA) || !isObj(body.userB)) {
      return json({ error: 'userA and userB required' }, 400);
    }

    try {
      const { success } = await env.LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' });
      if (!success) return json({ error: 'rate_limited' }, 429);
      const signals = { userA: pickSignals(body.userA), userB: pickSignals(body.userB) };
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: CURATOR_SYSTEM },
          { role: 'user', content: JSON.stringify(signals) },
        ],
        response_format: { type: 'json_schema', json_schema: POOL_SCHEMA },
        max_tokens: 1500,
      });
      const text = typeof result.response === 'string' ? result.response : JSON.stringify(result.response);
      const picks = parsePicks(text);
      let tmdbError = null;
      const resolved = await Promise.all(
        picks.map((p) => resolveOnTmdb(env, p).catch((e) => { tmdbError ??= String(e?.message ?? e); return null; })),
      );
      const matched = resolved.filter(Boolean).length;
      if (matched < picks.length) {
        console.warn(`tmdb matched ${matched}/${picks.length}`, tmdbError ?? '', picks.map((p) => p.originalTitle).join(' | ').slice(0, 300));
      }
      if (picks.length === 0) console.warn('model returned no usable picks:', text.slice(0, 300));
      return json({ moviePool: finalizePool(resolved.filter(Boolean)) });
    } catch (error) {
      const message = String(error?.message ?? error);
      console.error('curate failed:', message.slice(0, 200));
      const quota = /4006|neuron|quota/i.test(message);
      return json({ error: quota ? 'quota' : 'curation failed' }, quota ? 429 : 502);
    }
  },
};
