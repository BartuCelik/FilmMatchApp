// Pure helpers for the AI curation pipeline (no Firebase / network) so they can be unit-tested.

const POOL_SIZE = 8;
const MIN_POOL_SIZE = 4;
// Claude calls per session: first run + "Tekrar dene" retries. After this the session is marked 'failed'.
const MAX_ATTEMPTS = 3;
// shortcut: one global daily cap shared by all users (anonymous auth can't support per-user quotas); add per-user limits once real accounts exist.
const DAILY_CALL_LIMIT = 200;
const SOURCES = ['userA', 'userB', 'common'];
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const CURATOR_SYSTEM = `You are the film curator of FilmMatch, an app where two people swipe on films to find one they will watch together tonight.

You receive two viewers' signals: a mood preset, free text about what they want, an energy level from 0 (very calm) to 100 (very energetic), and red lines (themes they do not want, e.g. horror, violence, old films, long films).

Pick exactly ${POOL_SIZE} real feature films that exist on TMDB:
- 2 with source "userA": lean toward viewer A's taste, still acceptable for B.
- 2 with source "userB": lean toward viewer B's taste, still acceptable for A.
- 4 with source "common": the overlap both are likely to enjoy.

Red lines from either viewer are hard constraints: never pick a film that violates one. Match the energy level. Prefer variety in genre and era unless the signals say otherwise, and avoid obvious repeats of the same franchise.

For each film give its original title, release year, the source, and a one-sentence reason in Turkish addressed to both viewers.`;

const POOL_SCHEMA = {
  type: 'object',
  properties: {
    movies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalTitle: { type: 'string' },
          year: { type: 'integer' },
          source: { type: 'string', enum: SOURCES },
          reason: { type: 'string' },
        },
        required: ['originalTitle', 'year', 'source', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['movies'],
  additionalProperties: false,
};

function hasAllResponses(session) {
  const participants = session?.participants;
  const responses = session?.curationResponses || {};
  return Array.isArray(participants) && participants.length >= 2 && participants.every((uid) => responses[uid] != null);
}

/** True when the pool should be generated now (both answered, AI mode, not already running/done). */
function isReadyForCuration(session) {
  if (!session || session.isDisbanded) return false;
  if (session.selectedMode !== 'ai') return false;
  if ((session.aiStatus ?? 'idle') !== 'idle') return false;
  if (Array.isArray(session.moviePool) && session.moviePool.length > 0) return false;
  if ((session.aiAttempts ?? 0) >= MAX_ATTEMPTS) return false;
  return hasAllResponses(session);
}

/**
 * Decided inside the claim transaction. Returns null (nothing to do), or the session/usage writes
 * and whether Claude should be called. usage is the meta/aiUsage doc: { day: 'YYYY-MM-DD', count }.
 */
function planClaim(session, usage, today) {
  if (!isReadyForCuration(session)) return null;
  const count = usage?.day === today ? usage.count : 0;
  if (count >= DAILY_CALL_LIMIT) {
    return { run: false, sessionUpdate: { aiStatus: 'limit' }, usageUpdate: null };
  }
  return {
    run: true,
    sessionUpdate: { aiStatus: 'generating', aiAttempts: (session.aiAttempts ?? 0) + 1 },
    usageUpdate: { day: today, count: count + 1 },
  };
}

/** 'error' lets the client offer a retry; 'failed' is terminal once attempts are used up. */
function failureStatus(attemptsUsed) {
  return attemptsUsed >= MAX_ATTEMPTS ? 'failed' : 'error';
}

function pickSignals(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const energy = Number(r.energy);
  return {
    moodPreset: typeof r.moodPreset === 'string' ? r.moodPreset : null,
    moodText: typeof r.moodText === 'string' ? r.moodText.trim().slice(0, 500) : '',
    energy: Number.isFinite(energy) ? Math.min(100, Math.max(0, Math.round(energy))) : 50,
    redLines: Array.isArray(r.redLines) ? r.redLines.filter((x) => typeof x === 'string').slice(0, 10) : [],
    redLinesText: typeof r.redLinesText === 'string' ? r.redLinesText.trim().slice(0, 500) : '',
  };
}

/** participants[0] is viewer A, participants[1] is viewer B. */
function buildSignals(session) {
  const [uidA, uidB] = session.participants;
  const responses = session.curationResponses || {};
  return { userA: pickSignals(responses[uidA]), userB: pickSignals(responses[uidB]) };
}

/** Parse and validate Claude's JSON answer; drops malformed and duplicate entries. */
function parsePicks(text) {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed?.movies)) throw new Error('Claude response has no movies array');
  const seen = new Set();
  const picks = [];
  for (const m of parsed.movies) {
    const originalTitle = typeof m?.originalTitle === 'string' ? m.originalTitle.trim() : '';
    if (!originalTitle || !SOURCES.includes(m.source)) continue;
    const year = Number.isInteger(m.year) ? m.year : null;
    const key = `${originalTitle.toLowerCase()}|${year}`;
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push({ originalTitle, year, source: m.source, reason: typeof m.reason === 'string' ? m.reason.trim() : '' });
  }
  return picks;
}

/** Same shape as the client's TMDB items (src/services/api.js) plus source/reason. */
function toPoolItem(pick, tmdbMovie) {
  const posterPath = tmdbMovie.poster_path || tmdbMovie.backdrop_path;
  return {
    id: `movie-${tmdbMovie.id}`,
    tmdbId: tmdbMovie.id,
    type: 'movie',
    title: tmdbMovie.title || pick.originalTitle,
    overview: tmdbMovie.overview || '',
    score: tmdbMovie.vote_average ?? null,
    image: posterPath ? `${IMAGE_BASE_URL}${posterPath}` : null,
    source: pick.source,
    reason: pick.reason,
  };
}

/** Dedupe by TMDB id, cap at POOL_SIZE, shuffle so sources are not grouped. */
function finalizePool(items) {
  const unique = [...new Map(items.map((item) => [item.tmdbId, item])).values()].slice(0, POOL_SIZE);
  if (unique.length < MIN_POOL_SIZE) {
    throw new Error(`Only ${unique.length} films could be matched on TMDB`);
  }
  for (let i = unique.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]];
  }
  return unique;
}

module.exports = {
  CURATOR_SYSTEM,
  POOL_SCHEMA,
  MAX_ATTEMPTS,
  DAILY_CALL_LIMIT,
  isReadyForCuration,
  planClaim,
  failureStatus,
  buildSignals,
  parsePicks,
  toPoolItem,
  finalizePool,
};
