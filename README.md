# FilmMatch

A mobile app that ends the "what should we watch?" argument. Two people join the same session from their own phones, answer three quick questions, and swipe through a shortlist built for both of them. When both swipe right on the same film, it's a match.

## How it works

1. **Start or join a session.** No sign-up: one person creates a session and shares a 6-digit code, the other joins with it. Sessions use anonymous Firebase auth.
2. **Pick a mode.** *Movies* or *Series* pull popular and top-rated titles from TMDB. *Pick for Us* ("Bize Seç") builds a pool just for the two of you.
3. **Answer three questions** (Pick for Us). Mood, energy level and deal-breakers, set by each person separately.
4. **Get a shared pool.** A Cloudflare Worker running Workers AI (Llama 3.3 70B) picks 8 films from both sets of answers: 2 for each person's taste and 4 on common ground. Every pick is verified against TMDB, so posters, details and streaming providers are real data.
5. **Swipe.** Each vote is written to Firestore and both phones listen to the session in real time, so a mutual like shows up on both screens as soon as it happens.

## Tech stack

| Area        | Technology                                        |
|-------------|---------------------------------------------------|
| App         | React Native, Expo SDK 58                         |
| Realtime    | Firebase Firestore (`onSnapshot` listeners), Firebase Auth (anonymous) |
| AI curation | Cloudflare Worker + Workers AI (`worker/`, free tier) |
| Movie data  | TMDB API                                          |
| UI          | "Kadife Perde" dark theme (burgundy, velvet red, gold; DM Serif Display headings), haptic feedback, 7 languages (TR, EN, DE, ES, FR, IT, RU) |

No AI key ever ships in the app: the host phone sends both users' answers to the Worker (`POST /curate`), the Worker asks Workers AI for a list, verifies it on TMDB and returns the pool, and the host writes it to the session's `moviePool` field.

## Project structure

```
src/
  components/   Reusable UI (AppButton, AppText, IconSquare, SurfaceCard, WedgeBackground, ...)
  constants/    Colors (single source: Colors.js), fonts, avatars
  context/      Language preference
  hooks/        i18n, session disband sync
  i18n/         Translations
  navigation/   Stack navigator
  screens/      Home, join-by-code, mode selection, curation questions, swipe
  services/     Firebase session logic, TMDB client
worker/         Cloudflare Worker: AI curation (Workers AI + TMDB)
```

## Run it locally

You need Node.js and the Expo Go app (SDK 58) or an emulator, plus your own Firebase project and TMDB API key.

```bash
git clone https://github.com/BartuCelik/FilmMatchApp.git
cd FilmMatchApp
npm install
cp .env.example .env    # fill in your Firebase and TMDB keys
npx expo start
```

### Curation worker (one-time)

1. Create a free Cloudflare account (no card needed).
2. `cd worker && npm install && npx wrangler login`
3. `npx wrangler secret put TMDB_API_KEY`
4. `npx wrangler deploy`
5. Put the printed URL in `.env` as `EXPO_PUBLIC_CURATION_URL` (it must end in `/curate`).
6. Deploy the Firestore rules (works on the free Spark plan): `npx firebase-tools login`, `npx firebase-tools use --add`, `npx firebase-tools deploy --only firestore:rules`

Worker tests: `cd worker && npm test`
Theme check: `npm run check:theme` (no hex colours or indigo outside `Colors.js`, mode labels translated in all 7 languages)

## Status

Personal side project, in progress. Working notes (in Turkish) live in [docs/STATUS.md](docs/STATUS.md).

- [x] Anonymous sessions and joining by 6-digit code
- [x] Three-question curation flow
- [x] Worker-built shared movie pool, verified on TMDB
- [x] Real-time swiping with mutual-like detection
- [x] "Kadife Perde" redesign
- [ ] Match celebration screen and results summary
- [ ] Sessions for groups larger than two

---

Built by [Bartu Çelik](https://github.com/BartuCelik).
