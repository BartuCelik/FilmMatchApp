# Cloudflare Worker Curation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Firebase Cloud Function + Claude curation with a free Cloudflare Worker + Workers AI endpoint that the host's app calls and whose result the app writes to Firestore.

**Architecture:** `worker/` holds a Worker with one route, `POST /curate`. It takes both viewers' signals and returns `{ moviePool }`, built by Llama 3.3 70B and checked against TMDB. The pure helpers from `functions/curation.js` move into `worker/src/curation.js`. The host's client calls the Worker and writes `moviePool` and `aiStatus` itself. Firestore rules are relaxed to allow those writes. `functions/` is deleted.

**Tech Stack:** Cloudflare Workers (wrangler ≥ 4.36, ES modules), Workers AI binding, Rate Limiting binding, `node:test`, Expo RN client, Firestore.

**Spec:** `docs/superpowers/specs/2026-11-15-cloudflare-worker-curation-design.md`

## Global Constraints

- No paid plan anywhere: no Firebase Blaze, no paid Workers plan, no LLM API keys in the client.
- Never reintroduce Gemini or the Anthropic SDK.
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- Rate limit: 5 requests per 60 s per client IP (`CF-Connecting-IP`).
- Status codes: `200 { moviePool }`; `400` bad body; `429` rate limited or AI quota exhausted; `502` any other failure.
- Pool size and source rules stay as today: `POOL_SIZE = 8`, `MIN_POOL_SIZE = 4`, `MAX_ATTEMPTS = 3`. The `CURATOR_SYSTEM` text is unchanged except that the line about the JSON format may be adjusted.
- `aiStatus` values stay the same so the UI is untouched: `idle | generating | ready | error | failed | limit`.
- Client env var: `EXPO_PUBLIC_CURATION_URL` (full URL including `/curate`).

## Review Focus

1. Llama returns JSON wrapped in prose or code fences → `parsePicks` must still extract it. (Task 1 test `parsePicks extracts JSON from fenced text`.)
2. Both clients see "both answered" at the same moment → only `participants[0]` calls the Worker. (Task 3, manual check.)
3. A malicious body (huge strings, wrong types, missing userB) → returns 400 or clamps the input, never crashes. (Task 2 test `400 on missing userB`; clamping is already covered by the `pickSignals` test.)
4. Workers AI daily quota exhausted → `429` → client shows the existing "limit" message, not "error". (Task 2 test `429 when AI throws quota error`.)
5. The host leaves the screen mid-request → the session must not stay on `generating` forever. Accepted shortcut: a retry is only possible when the status is `error`. Add `// shortcut:` comment in Task 3.

---

### Task 1: Move pure curation helpers into `worker/`

**Files:**
- Create: `worker/package.json` (`"type": "module"`, scripts `test: node --test`, `deploy: wrangler deploy`; devDependency `wrangler@^4.36`)
- Create: `worker/src/curation.js` (ESM port of `functions/curation.js`)
- Create: `worker/test/curation.test.js` (port of `functions/curation.test.js`)

**Interfaces:**
- Produces: `CURATOR_SYSTEM`, `POOL_SCHEMA`, `pickSignals(raw) -> Signals`, `parsePicks(text) -> Pick[]`, `toPoolItem(pick, tmdbMovie) -> PoolItem`, `finalizePool(items) -> PoolItem[]` (throws if fewer than 4).
- Drop: `isReadyForCuration`, `planClaim`, `failureStatus`, `buildSignals`, `DAILY_CALL_LIMIT`, `hasAllResponses`. Firestore-only; the client owns this now.

- [ ] **Step 1:** Port the tests for `pickSignals` (via the old `buildSignals` cases, called directly on each raw object), `parsePicks`, `toPoolItem` and `finalizePool` to ESM `import`. Add:
```js
test('parsePicks extracts JSON from fenced text', () => {
  const text = 'Here you go:\n```json\n{"movies":[{"originalTitle":"Heat","year":1995,"source":"common","reason":"x"}]}\n```';
  assert.equal(parsePicks(text)[0].originalTitle, 'Heat');
});
```
- [ ] **Step 2:** `cd worker && npm install && npm test`. Expected: FAIL (module not found).
- [ ] **Step 3:** Create `worker/src/curation.js`. `parsePicks` first tries `JSON.parse(text)`, and on failure parses the substring from the first `{` to the last `}`.
- [ ] **Step 4:** `npm test`. Expected: all pass.
- [ ] **Step 5:** Commit `feat(worker): port curation helpers to Cloudflare worker`.

### Task 2: Worker endpoint

**Files:**
- Create: `worker/wrangler.jsonc` (name `filmmatch-curation`, `main: src/index.js`, recent `compatibility_date`, `ai: { binding: "AI" }`, `ratelimits: [{ name: "LIMITER", namespace_id: "1001", simple: { limit: 5, period: 60 } }]`)
- Create: `worker/src/index.js`
- Create: `worker/test/index.test.js`
- Modify: `.gitignore` (add `worker/node_modules`, `worker/.wrangler`, `worker/.dev.vars`)

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: `export default { fetch(request, env) }`. `env` = `{ AI, LIMITER, TMDB_API_KEY }`. Route `POST /curate`, body `{ userA, userB }`, response codes per Global Constraints.

- [ ] **Step 1:** Write tests that call `worker.fetch` with fake `env`. `AI.run` is stubbed to return `{ response: <JSON string or object> }`, `LIMITER.limit` to return `{ success }`, and `globalThis.fetch` is stubbed for TMDB.
  - `200 returns moviePool of 4..8 items` (8 picks, TMDB stub returns distinct ids)
  - `400 on missing userB`
  - `429 when limiter rejects`
  - `429 when AI throws quota error` (error message contains `4006` or `neurons`)
  - `502 when fewer than 4 films resolve`
  - `405 on GET`
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `src/index.js`.
  - Call `env.AI.run(MODEL, { messages: [system, user], response_format: { type: 'json_schema', json_schema: POOL_SCHEMA }, max_tokens: 1500 })`.
  - `result.response` may be an object; if so, `JSON.stringify` it before `parsePicks`.
  - TMDB lookup is the same as `searchTmdb`/`resolveOnTmdb` in `functions/index.js`, with `env.TMDB_API_KEY`.
- [ ] **Step 4:** `npm test`. Expected: all pass.
- [ ] **Step 5:** Smoke test: `npx wrangler dev --remote`, then `curl -X POST localhost:8787/curate -d '{"userA":{"moodText":"gerilim"},"userB":{"energy":80}}'`. Expected: 200 with 4–8 films. If the model rejects `response_format`, drop it and rely on the Task 1 extraction. Needs the user's Cloudflare login and `.dev.vars` with `TMDB_API_KEY`.
- [ ] **Step 6:** Commit `feat(worker): add /curate endpoint with Workers AI and TMDB check`.

### Task 3: Client calls the Worker; rules and cleanup

**Files:**
- Modify: `src/services/sessionService.js` (add `generateAiPool`; update the `retryAiCuration` comment)
- Modify: `src/screens/AiCurationQuestionsScreen.js:128` area (host-only effect; update the comment that mentions the Cloud Function)
- Modify: `firestore.rules` (remove the `moviePool`/`aiAttempts` bans and `aiStatusChangeAllowed`; keep `hostId`/`code` immutable)
- Modify: `.env.example` (add `EXPO_PUBLIC_CURATION_URL=https://filmmatch-curation.<account>.workers.dev/curate`)
- Modify: `firebase.json` (remove the `functions` block)
- Modify: `README.md` (replace the Functions/Blaze section with the Cloudflare steps from the spec's "Kullanıcının adımları")
- Delete: `functions/`

**Interfaces:**
- Produces: `generateAiPool(sessionId: string, session: SessionDoc) => Promise<void>` in `sessionService.js`.

- [ ] **Step 1:** Implement `generateAiPool`.
  1. `updateDoc` with `aiStatus: 'generating'`.
  2. POST `{ userA: responses[participants[0]], userB: responses[participants[1]] }` to `process.env.EXPO_PUBLIC_CURATION_URL`.
  3. On 200: write `{ moviePool, aiStatus: 'ready', aiMoviePoolGeneratedAt: serverTimestamp() }`.
  4. Otherwise compute `attempts = (session.aiAttempts ?? 0) + 1` and write `{ aiAttempts: attempts, aiStatus: res.status === 429 ? 'limit' : attempts >= 3 ? 'failed' : 'error' }`.
  5. A network exception is treated like a non-429 failure.
- [ ] **Step 2:** In the screen, add a `useEffect` that calls `generateAiPool(sessionId, sessionSnap)` once (guard with a ref) when all of these hold:
  - `bothAnswered`
  - `aiStatus === 'idle'`
  - `selectedMode === 'ai'`
  - the pool is empty
  - `userId === participants[0]`

  Reset the ref when `aiStatus` returns to `'idle'` after a retry. Add the Review Focus #5 `// shortcut:` comment.
- [ ] **Step 3:** Rules, `.env.example`, `firebase.json`, README and `functions/` deletion as listed above.
- [ ] **Step 4:** Verify:
  - `cd worker && npm test` passes.
  - `npx expo export --platform android` (or `npx expo start` and open the app) builds without import errors.
  - Grep finds no `functions/` references outside docs: `git grep -n "functions/" -- ':!docs'` shows no code hits.
- [ ] **Step 5:** Manual end-to-end check (user, with the Worker deployed):
  - Two devices create a room, choose AI mode and answer → both land on the swipe screen with the same pool.
  - Network kill → "Tekrar dene" works.
- [ ] **Step 6:** Commit `feat: switch AI curation to Cloudflare Worker, drop Firebase Functions`.
