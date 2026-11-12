const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { Anthropic } = require('@anthropic-ai/sdk');
const {
  CURATOR_SYSTEM,
  POOL_SCHEMA,
  isReadyForCuration,
  planClaim,
  failureStatus,
  buildSignals,
  parsePicks,
  toPoolItem,
  finalizePool,
} = require('./curation');

initializeApp();
const db = getFirestore();

// Set with: firebase functions:secrets:set ANTHROPIC_API_KEY  (and TMDB_API_KEY)
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const TMDB_API_KEY = defineSecret('TMDB_API_KEY');

async function askClaude(signals) {
  // One SDK retry (on 429/5xx/network) instead of the default two, so one attempt is at most two HTTP requests.
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value(), maxRetries: 1, timeout: 60_000 });
  const response = await client.messages.create({
    // Picking 8 films from short signals is light work: Haiku is ~40x cheaper per session than Opus.
    model: 'claude-haiku-5-5',
    // ~8 short JSON entries plus a little thinking; caps the worst-case output cost of a single call.
    max_tokens: 4000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: POOL_SCHEMA } },
    system: CURATOR_SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify(signals) }],
  });
  if (response.stop_reason === 'refusal') {
    throw new Error(`Claude refused: ${response.stop_details?.category ?? 'unknown'}`);
  }
  const text = response.content.find((block) => block.type === 'text')?.text;
  if (!text) throw new Error(`Claude returned no text (stop_reason: ${response.stop_reason})`);
  return parsePicks(text);
}

async function searchTmdb(title, year) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY.value(),
    query: title,
    language: 'tr-TR',
    include_adult: 'false',
  });
  if (year) params.set('year', String(year));
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`);
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  const body = await res.json();
  return body.results?.[0] ?? null;
}

async function resolveOnTmdb(pick) {
  // Year from the model can be off by one; retry without it before giving up.
  const movie = (await searchTmdb(pick.originalTitle, pick.year)) ?? (await searchTmdb(pick.originalTitle, null));
  return movie ? toPoolItem(pick, movie) : null;
}

exports.curateMoviePool = onDocumentUpdated(
  { document: 'sessions/{sessionId}', secrets: [ANTHROPIC_API_KEY, TMDB_API_KEY], timeoutSeconds: 120 },
  async (event) => {
    if (!isReadyForCuration(event.data?.after?.data())) return;
    const ref = event.data.after.ref;

    // Claim the job in a transaction so duplicate trigger deliveries never call Claude twice,
    // and count the call against the global daily cap in the same write.
    const usageRef = db.doc('meta/aiUsage');
    const today = new Date().toISOString().slice(0, 10);
    const claim = await db.runTransaction(async (tx) => {
      const [snap, usageSnap] = await Promise.all([tx.get(ref), tx.get(usageRef)]);
      const plan = planClaim(snap.data(), usageSnap.data(), today);
      if (!plan) return null;
      tx.update(ref, plan.sessionUpdate);
      if (plan.usageUpdate) tx.set(usageRef, plan.usageUpdate);
      return { ...plan, session: snap.data() };
    });
    if (!claim?.run) {
      if (claim) logger.warn('AI daily limit reached', { sessionId: event.params.sessionId });
      return;
    }
    const { session } = claim;

    try {
      const picks = await askClaude(buildSignals(session));
      const resolved = await Promise.all(picks.map(resolveOnTmdb));
      const moviePool = finalizePool(resolved.filter(Boolean));
      await ref.update({
        moviePool,
        aiStatus: 'ready',
        aiMoviePoolGeneratedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error('AI curation failed', { sessionId: event.params.sessionId, error: error?.message });
      await ref.update({ aiStatus: failureStatus(claim.sessionUpdate.aiAttempts) });
    }
  },
);
