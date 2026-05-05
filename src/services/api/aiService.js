import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const AI_STATUS_GENERATING = 'generating';
const AI_STATUS_READY = 'ready';
const AI_STATUS_ERROR = 'error';

const FALLBACK_MOCK_POOL = [
  { id: '550', title: 'Fight Club', posterPath: '/pB8S7Sj941P6kyuSFWznG9S6YBR.jpg', source: 'common' },
  { id: '27205', title: 'Inception', posterPath: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', source: 'common' },
  { id: '157336', title: 'Interstellar', posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', source: 'userA' },
  { id: '680', title: 'Pulp Fiction', posterPath: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', source: 'userB' },
  { id: '13', title: 'Forrest Gump', posterPath: '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', source: 'common' },
  { id: '278', title: 'The Shawshank Redemption', posterPath: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', source: 'common' },
  { id: '155', title: 'The Dark Knight', posterPath: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', source: 'userA' },
  { id: '238', title: 'The Godfather', posterPath: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', source: 'userB' },
];

const FILMMATCH_CURATOR_SYSTEM =
  'Sen bir FilmMatchApp küratörüsün. Kullanıcıların o anki spesifik izleme isteğini, enerji seviyesini ve tür tercihlerini temel alarak kürasyon yap. Tam 8 film önerisi sunmalısın. %25 userA, %25 userB ve %50 common (ortak alan) kuralına uy. Çıktıyı sadece saf JSON array formatında ver: [{ "id": "string", "title": "string", "posterPath": "string", "source": "string" }]';

const filmMatchMapEntrySchema = {
  type: SchemaType.OBJECT,
  properties: {
    id: {
      type: SchemaType.STRING,
      description: 'Benzersiz kararlı kimlik, örn. movie-{tmdbId}',
    },
    title: { type: SchemaType.STRING, description: 'Film başlığı (TMDB ile uyumlu)' },
    posterPath: {
      type: SchemaType.STRING,
      description: 'TMDB poster_path; / ile başlayan yol veya boş string',
    },
    source: {
      type: SchemaType.STRING,
      description: 'Tam olarak userA, userB veya common (2+2+4 dağılım)',
    },
  },
  required: ['id', 'title', 'posterPath', 'source'],
};

const filmMatchPoolResponseSchema = {
  type: SchemaType.ARRAY,
  items: filmMatchMapEntrySchema,
  minItems: 8,
  maxItems: 8,
};

function getApiKey() {
  const k = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return typeof k === 'string' ? k.trim() : '';
}

function stripJsonFences(text) {
  const t = text.trim();
  return t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function normalizeSource(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (s === 'usera') return 'userA';
  if (s === 'userb') return 'userB';
  if (s === 'common') return 'common';
  return null;
}

/**
 * @param {unknown} row
 * @param {number} index
 * @returns {{ id: string, title: string, posterPath: string, source: 'userA'|'userB'|'common' }}
 */
function normalizeFilmMatchMapEntry(row, index) {
  if (!row || typeof row !== 'object') {
    throw new Error(`moviePool[${index}] geçerli bir nesne değil`);
  }
  const id = typeof row.id === 'string' ? row.id.trim() : '';
  const title = typeof row.title === 'string' ? row.title.trim() : '';
  const posterPath =
    typeof row.posterPath === 'string' ? row.posterPath.trim() : '';
  const source = normalizeSource(row.source);
  if (!id) throw new Error(`moviePool[${index}].id boş`);
  if (!title) throw new Error(`moviePool[${index}].title boş`);
  if (!source) throw new Error(`moviePool[${index}].source userA|userB|common olmalı`);
  return { id, title, posterPath, source };
}

function assertSourceSplit(entries) {
  let a = 0;
  let b = 0;
  let c = 0;
  for (const e of entries) {
    if (e.source === 'userA') a += 1;
    else if (e.source === 'userB') b += 1;
    else if (e.source === 'common') c += 1;
  }
  if (a !== 2 || b !== 2 || c !== 4) {
    throw new Error(
      `Beklenen source dağılımı 2 userA + 2 userB + 4 common; gelen: ${a}/${b}/${c}`,
    );
  }
}

function isGeminiRateLimitError(error) {
  const status = Number(error?.status ?? error?.code ?? error?.response?.status);
  const message = String(error?.message ?? '').toLowerCase();
  return (
    status === 429 ||
    message.includes('429') ||
    message.includes('too many requests') ||
    message.includes('rate limit') ||
    message.includes('quota')
  );
}

/**
 * @param {Record<string, unknown>} curationResponses
 * @param {string[]} participants en az 2 uid; [0]=userA, [1]=userB
 */
export function buildCuratorPromptPayload(curationResponses, participants) {
  const uidA = participants?.[0];
  const uidB = participants?.[1];
  const pick = (uid) => {
    const raw = uid ? curationResponses?.[uid] : null;
    if (!raw || typeof raw !== 'object') {
      return {
        moodText: '',
        energy: 0,
        redLinesText: '',
      };
    }
    const moodText = typeof raw.moodText === 'string' ? raw.moodText.trim() : '';
    const redLinesText =
      typeof raw.redLinesText === 'string' ? raw.redLinesText.trim() : '';
    const energy =
      typeof raw.energy === 'number' && Number.isFinite(raw.energy)
        ? raw.energy
        : parseInt(String(raw.energy ?? ''), 10) || 0;
    return { moodText, energy, redLinesText };
  };
  return {
    userA: pick(uidA),
    userB: pick(uidB),
  };
}

/**
 * moodText, energy, redLinesText ile 8 filmlik havuz (Gemini JSON).
 * @param {{ curationResponses: Record<string, unknown>, participants: string[] }} params
 * @returns {Promise<Array<{ id: string, title: string, posterPath: string, source: 'userA'|'userB'|'common' }>>}
 */
export async function generateCuratedFilmMatchPool({ curationResponses, participants }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');
  }
  if (!Array.isArray(participants) || participants.length < 2) {
    throw new Error('participants en az iki kullanıcı içermeli');
  }

  const signals = buildCuratorPromptPayload(curationResponses, participants);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: FILMMATCH_CURATOR_SYSTEM,
    generationConfig: {
      temperature: 0.55,
      responseMimeType: 'application/json',
      responseSchema: filmMatchPoolResponseSchema,
    },
  });

  const userText = [
    'Aşağıdaki JSON iki kullanıcının izleme isteği, enerji seviyesi ve redLinesText sinyalleridir.',
    'Gerçek TMDB filmleri kullan; posterPath alanına TMDB poster_path biçiminde değer koy (ör. /xxxx.jpg) veya bilinmiyorsa boş string.',
    'source alanları tam olarak 2 kez "userA", 2 kez "userB", 4 kez "common" olacak şekilde 8 öğe üret.',
    '',
    JSON.stringify(signals, null, 0),
  ].join('\n');

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userText }] }],
  });

  const text = result.response.text();
  let parsed;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch {
    throw new Error('Gemini geçerli JSON döndürmedi');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Gemini yanıtı dizi değil');
  }
  const normalized = parsed.map((row, i) => normalizeFilmMatchMapEntry(row, i));
  assertSourceSplit(normalized);
  return normalized;
}

/**
 * Idempotent olarak AI moviePool üretir ve oturuma yazar.
 * Mükerrer istekleri engeller; 429 durumunda mock data ile kurtarır.
 * @param {string} sessionId
 * @param {Record<string, unknown>} curationResponses
 * @param {string[]} participants
 */
export async function fetchAIRecommendedMovies(
  sessionId,
  curationResponses,
  participants,
) {
  const sessionRef = doc(db, 'sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);
  const sessionData = sessionSnap.data();

  if (
    !sessionSnap.exists() ||
    !sessionData ||
    (Array.isArray(sessionData.moviePool) && sessionData.moviePool.length > 0) ||
    sessionData.aiStatus === AI_STATUS_GENERATING
  ) {
    return;
  }

  await updateDoc(sessionRef, { aiStatus: AI_STATUS_GENERATING });

  try {
    const aiPool = await generateCuratedFilmMatchPool({
      curationResponses,
      participants,
    });
    await updateDoc(sessionRef, {
      moviePool: aiPool,
      aiStatus: AI_STATUS_READY,
      isMockData: false,
      aiCurationPipelineQueuedAt: serverTimestamp(),
      aiMoviePoolGeneratedAt: serverTimestamp(),
    });
  } catch (error) {
    if (isGeminiRateLimitError(error)) {
      await updateDoc(sessionRef, {
        moviePool: FALLBACK_MOCK_POOL,
        aiStatus: AI_STATUS_READY,
        isMockData: true,
        aiCurationPipelineQueuedAt: serverTimestamp(),
        aiMoviePoolGeneratedAt: serverTimestamp(),
      });
      return;
    }

    await updateDoc(sessionRef, { aiStatus: AI_STATUS_ERROR });
    throw error;
  }
}
