# Kadife Perde redesign

Date: 2026-11-18 · Branch: `feature/ai-curation-swipe-overhaul`

## Intent

The app currently reads as "generic AI-generated app": Tailwind indigo `#6366F1` everywhere, indigo glows, purple gradients on near-black, default system font. The owner wants it to feel like **a movie night at home**. They chose direction **B – Kadife Perde** (velvet curtain) from three mockups: deep burgundy-black surfaces, velvet red accent, small gold details, serif display headlines. Layout language comes from a reference shot (dark e-commerce concept): a diagonal accent wedge behind content, layered/stacked cards, small square icon buttons, soft depth (shadow + 1px top highlight) instead of glows.

## Goals

- One dark palette ("Kadife Perde") used by every screen through a single source of truth.
- DM Serif Display for headline text; body stays system font.
- Shared building blocks so screens look like one product: square icon button, surface card, diagonal wedge background, accent button.
- Swipe screen gets the stacked-cards + wedge look from the mockup.
- "AI Kürasyon" is renamed to **"Bize Seç"** in the UI.

## Non-goals

- No light theme. The app becomes dark-only (owner decision).
- No layout/flow redesign of individual screens beyond applying the shared pieces (that was option 3, not chosen).
- No match animation / results screen; that is the next roadmap item.
- No logic changes to sessions, curation, or swiping.

## Anti-goals

- Must not reintroduce the "AI look": no indigo/purple, no neon glows, no gradient-on-everything. Gradients are allowed only on the accent (red→deep red) and posters.
- Must not break existing flows (create/join room, mode select, curation questions, swipe).

## Decisions

### Palette (replaces `src/constants/Colors.js` values)

| Token | Value | Use |
|---|---|---|
| background | `#170E10` | screen bg |
| surface | `#231518` | cards, buttons |
| surfaceElevated | `#2C1A1E` | inputs, raised |
| surfaceMuted / surface2 | `#3A2126` | stacked ghost cards, icon tiles |
| border | `#3A2427` | hairlines |
| textPrimary | `#F7E9E4` | |
| textSecondary | `#D6BFBB` | |
| textMuted | `#BFA2A0` | |
| textSubtle | `#8C6F6E` | |
| accent | `#D23C43` | primary actions, wedge |
| accentDeep | `#9E1F2E` | accent gradient end |
| onAccent | `#FFF3EC` | text on accent |
| gold | `#D9A441` | rating chips, small highlights only |
| match (keep green family) | `#22C55E` / `#4ADE80` | match/success stays green |
| error | `#F87171` | |

Indigo token names (`indigo*`, `glowIndigo*`) are removed and call sites move to the new names, so no indigo can survive by accident. Glows become plain dark shadows (`rgba(0,0,0,.4)`).

### Typography

- Install `expo-font` + `@expo-google-fonts/dm-serif-display` (Expo SDK 54 compatible versions via `npx expo install`).
- Load in `App.js`; keep the splash/blank until fonts load.
- `AppText` variants `hero`, `title`, `screenTitle`, `section` use `DMSerifDisplay_400Regular` (weight 400; it has no bold). All others stay system font.

### Shared components (in `src/components/common/`)

- `IconSquare` — 34–42px rounded-square (radius ~11–14) icon button; `variant: 'surface' | 'accent'`.
- `SurfaceCard` — surface bg, radius 20, dark shadow, 1px top inner highlight.
- `WedgeBackground` — absolute diagonal accent shape behind content (SVG polygon via `react-native-svg`, already installed), with a `shape` prop for the two variants seen in the mockup (swipe vs. list screens).
- `AppButton` — restyled: primary = accent gradient (`expo-linear-gradient`, installed), secondary = surface.

### Screens

- **Home, JoinRoomCode:** drop `getPalette(theme)` usage, use `Colors` directly; add wedge; logo recoloured (accent red + gold, no indigo).
- **ModeSelection:** cards become `SurfaceCard` with `IconSquare` icons (🍿 Bize Seç, 🎬 Filmler, 📺 Diziler); selected card gets accent outline + accent icon tile. Mode titles/subtitles move into `src/i18n/strings.js` for all 5 locales (they are hard-coded mixed TR/EN today).
- **AiCurationQuestions:** recolour via tokens; header text "AI Kürasyon" → "Bize Seç"; quota message wording drops "AI" ("Bugünlük öneri hakkı doldu…").
- **Swipe:** wedge behind the deck, two ghost cards behind the top poster (static, offset/scaled), poster chips (rating chip in gold), action buttons as rounded squares (✕ / ★ surface, ♥ accent gradient). All 22 hard-coded hex values replaced by tokens.
- **GradientEnergySlider:** gold → red → deep red instead of indigo.

### Theme removal

- Remove `theme` state, `toggleTheme`, storage key from `AppPreferencesContext`; remove the theme button from `PreferencesHeaderControls` (language picker stays).
- Delete `src/theme/palettes.js`; `HomeScreen.styles.js` / `JoinRoomCodeScreen.styles.js` take `Colors` instead of a palette param.
- StatusBar always `light`.

## Approaches considered

1. **Colours only** — swap token values. Fastest, but layout stays template-like; rejected as not enough.
2. **Colours + font + shared components applied to every screen** — chosen by owner. Gets the mockup look with reusable pieces, no flow changes.
3. **Full per-screen redesign** — most thorough, delays match/results work; rejected for now.

## Left to the builder

- Exact spacing/radius values per screen, as long as they follow the mockup's language.
- Wedge geometry per screen.
- Whether ghost cards in the swipe deck animate when the top card leaves (nice-to-have; static is acceptable).

## Verification

- App boots in Expo Go with fonts loaded; no indigo/purple visible on any screen (also `grep -ri "6366F1\|indigo" src` returns nothing).
- Walk the full flow on a device: create room → join from second device → mode select → Bize Seç questions → swipe.
- Worker tests unaffected.
