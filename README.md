# FilmMatch

A mobile app that ends the "what should we watch?" argument. Two people join the same session from their own phones, answer three quick questions, and swipe through a shortlist built for both of them. When both swipe right on the same film, it's a match.

## How it works

1. **Start or join a session.** No sign-up: one person creates a session and shares a 6-digit code, the other joins with it. Sessions use anonymous Firebase auth.
2. **Answer three questions.** Mood, energy level and deal-breakers, set by each person separately.
3. **Get a shared pool.** Gemini builds the movie pool from both sets of answers: roughly a quarter leans to each person's taste and half sits on common ground. Posters and details come from TMDB.
4. **Swipe.** Each vote is written to Firestore and both phones listen to the session in real time, so a mutual like shows up on both screens as soon as it happens.

## Tech stack

| Area        | Technology                                        |
|-------------|---------------------------------------------------|
| App         | React Native, Expo SDK 54                         |
| Realtime    | Firebase Firestore (`onSnapshot` listeners), Firebase Auth (anonymous) |
| AI curation | Google Gemini API with a structured JSON response schema, plus a fallback pool if the call fails |
| Movie data  | TMDB API                                          |
| UI          | Shared theme and color system, light/dark palettes, haptic feedback, i18n |

## Project structure

```
src/
  components/   Reusable UI (movie card, detail modal, buttons, sliders)
  screens/      Welcome, home, join-by-code, mode selection, AI curation, swipe, match
  services/     Firebase session logic, Gemini curation, TMDB client
  hooks/        i18n, session disband sync
  context/      App-wide preferences (theme, language)
  navigation/   Stack navigator
```

## Run it locally

You need Node.js and the Expo Go app (or an emulator), plus your own Firebase project, TMDB API key and Gemini API key.

```bash
git clone https://github.com/BartuCelik/FilmMatchApp.git
cd FilmMatchApp
npm install
cp .env.example .env    # fill in your Firebase, TMDB and Gemini keys
npx expo start
```

## Status

Personal side project, in progress.

- [x] Anonymous sessions and joining by 6-digit code
- [x] Three-question curation flow
- [x] Gemini-built shared movie pool with fallback
- [x] Real-time swiping with mutual-like detection
- [ ] Match celebration screen and results summary
- [ ] Sessions for groups larger than two

---

Built by [Bartu Çelik](https://github.com/BartuCelik).
