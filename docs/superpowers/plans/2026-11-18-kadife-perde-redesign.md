# Kadife Perde Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the indigo "AI look" with the dark-only Kadife Perde visual language (burgundy surfaces, velvet red accent, gold details, DM Serif Display headlines, diagonal wedge, stacked cards, square icon buttons) across every screen.

**Architecture:** All colour comes from `src/constants/Colors.js`; the light theme and `src/theme/palettes.js` are deleted. Four small shared components carry the look; screens compose them. A guard script (`scripts/check-theme.mjs`) enforces "no hex or indigo outside Colors.js" and is the automated test for the redesign; `npx expo export` proves the bundle compiles.

**Tech Stack:** Expo SDK 54, React Native 0.81, react-native-svg, expo-linear-gradient, expo-font + @expo-google-fonts/dm-serif-display.

**Spec:** `docs/superpowers/specs/2026-11-18-kadife-perde-redesign-design.md`

## Global Constraints

- Dark only. No `theme` state, no theme toggle, StatusBar always `light`.
- Palette values exactly as the spec table: background `#170E10`, surface `#231518`, surfaceElevated `#2C1A1E`, surface2 `#3A2126`, border `#3A2427`, textPrimary `#F7E9E4`, textSecondary `#D6BFBB`, textMuted `#BFA2A0`, textSubtle `#8C6F6E`, accent `#D23C43`, accentDeep `#9E1F2E`, onAccent `#FFF3EC`, gold `#D9A441`, match `#22C55E`/`#4ADE80`, error `#F87171`.
- Gradients only on accent (accent→accentDeep), posters, and the energy slider (gold→accent→accentDeep). No glows; shadows are `rgba(0,0,0,0.4)`-ish.
- Headline font `DMSerifDisplay_400Regular` (weight must stay `'400'` / unset — the font has no bold).
- UI copy: "AI Kürasyon" → "Bize Seç"; no user-facing "AI" wording.
- No changes to session, curation, or swipe logic.

## Review Focus

- App launch before fonts load: must not crash or flash unstyled text — render nothing (or the splash) until `useFonts` resolves; if font loading errors, render the app with system font rather than hanging.
- Users who previously stored `@filmmatch/theme = 'light'`: app must still open dark; the stale key is ignored.
- Locales other than tr/en (de, es, fr, it, ru): mode titles must not show raw keys like `mode_ai_title`.
- Small phones (≈360dp wide): wedge and stacked ghost cards must not cover action buttons or push them off-screen.
- Swipe deck with only 1 card left: ghost cards must not render behind it as if more cards remain.

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/check-theme.mjs` (create) | Guard: fails on hex literals / `indigo` / `glowIndigo` outside `src/constants/Colors.js`; fails if any locale lacks the new mode keys |
| `src/constants/Colors.js` | Single palette (spec values) |
| `src/components/common/AppText.js` | Headline variants use DM Serif Display |
| `App.js` | Load fonts before rendering navigator |
| `src/context/AppPreferencesContext.js` | Locale only |
| `src/components/common/PreferencesHeaderControls.js` | Language picker only |
| `src/components/common/IconSquare.js` (create) | Rounded-square icon button |
| `src/components/common/SurfaceCard.js` (create) | Card surface with depth |
| `src/components/common/WedgeBackground.js` (create) | Diagonal accent shape |
| `src/components/common/AppButton.js` | Accent-gradient primary / surface secondary |
| `src/components/common/GradientEnergySlider.js`, `src/components/branding/FilmMatchLogo.js` | Recolour |
| Screens | Compose the above |

---

### Task 1: Guard script, palette, fonts

**Files:**
- Create: `scripts/check-theme.mjs`
- Modify: `src/constants/Colors.js`, `src/components/common/AppText.js`, `App.js`, `package.json` (via `npx expo install`)

**Interfaces:**
- Produces: `Colors` keys `background, surface, surfaceElevated, surface2, border, textPrimary, textSecondary, textMuted, textSubtle, accent, accentDeep, onAccent, gold, match, matchBright, matchMuted, matchSurface, error, errorSoft, overlay, shadow` (`shadow: 'rgba(0,0,0,0.4)'`), plus `Fonts.display = 'DMSerifDisplay_400Regular'` exported from `Colors.js`. Temporarily also keeps the old `indigo*`, `glow*`, `surfaceMuted`, `surfaceCard`, `borderLight`, `borderAccent`, `textOnAccent`, `trackUnderlay`, `sliderMaxTrack` keys as aliases pointing at new values so untouched screens still render; Task 7 deletes them.
- `npm run check:theme` script in `package.json` → `node scripts/check-theme.mjs`.

- [ ] **Step 1: Write the guard script.** It walks `src/**/*.js`, skipping `src/constants/Colors.js`, and reports every match of `/#[0-9a-fA-F]{3,8}\b/`, `/indigo/i`, `/glowIndigo/`. It also reads `src/i18n/strings.js` as text and requires each of `mode_ai_title, mode_ai_subtitle, mode_movie_title, mode_movie_subtitle, mode_tv_title, mode_tv_subtitle` to occur exactly 7 times. Exit 1 with a list of `file:line: match` on any failure, exit 0 and print `theme check passed` otherwise. Add `"check:theme": "node scripts/check-theme.mjs"` to package.json scripts.
- [ ] **Step 2: Run it.** `npm run check:theme` → FAIL listing many hits (expected; it becomes green in Task 7).
- [ ] **Step 3: Install fonts.** `npx expo install expo-font @expo-google-fonts/dm-serif-display`.
- [ ] **Step 4: Replace palette in `Colors.js`** with the spec values + temporary aliases described above; export `Fonts`.
- [ ] **Step 5: AppText.** Variants `hero, title, screenTitle, section` get `fontFamily: Fonts.display` and drop `fontWeight` (letterSpacing on `hero` → 0.5). `kicker` colour → `Colors.gold`.
- [ ] **Step 6: App.js.** `const [loaded, error] = useFonts({ DMSerifDisplay_400Regular })`; return `null` while `!loaded && !error`; otherwise render the existing tree.
- [ ] **Step 7: Bundle check.** `npx expo export --platform android --output-dir %TEMP%/fm-export` → completes without errors.
- [ ] **Step 8: Commit** `feat(ui): Kadife Perde palette, DM Serif Display, theme guard script`.

### Task 2: Remove light theme

**Files:**
- Modify: `src/context/AppPreferencesContext.js`, `src/components/common/PreferencesHeaderControls.js`, `src/screens/HomeScreen.js`, `src/screens/HomeScreen.styles.js`, `src/screens/JoinRoomCodeScreen.js`, `src/screens/JoinRoomCodeScreen.styles.js`
- Delete: `src/theme/palettes.js`

**Interfaces:**
- Produces: `useAppPreferences()` returns `{ locale, setLocale }` only. `createHomeStyles()` / the Join styles factory take no palette argument and read `Colors` (or become plain `StyleSheet.create` objects — builder's choice, keep exported names).

- [ ] **Step 1:** Remove `theme`, `setTheme`, `toggleTheme`, `STORAGE_THEME` and its AsyncStorage read from the context (stale stored value is simply never read).
- [ ] **Step 2:** Remove the theme button and its styles from `PreferencesHeaderControls`; recolour the language picker with tokens.
- [ ] **Step 3:** Home/Join: drop `getPalette`/`theme`; `palette.x` → `Colors.x` (map old names: `indigoLight`→`accent`, `glowIndigo`→`shadow`, `errorSoft` stays); `StatusBar style="light"`. Delete `src/theme/palettes.js`.
- [ ] **Step 4:** `grep -rn "getPalette\|toggleTheme\|palettes" src` → no output. `npx expo export --platform android --output-dir %TEMP%/fm-export` → succeeds.
- [ ] **Step 5: Commit** `refactor(ui): drop light theme, app is dark-only`.

### Task 3: Shared components

**Files:**
- Create: `src/components/common/IconSquare.js`, `SurfaceCard.js`, `WedgeBackground.js`
- Modify: `src/components/common/AppButton.js`, `GradientEnergySlider.js`, `src/components/branding/FilmMatchLogo.js`

**Interfaces:**
- `IconSquare({ children, onPress?, variant = 'surface' | 'accent', size = 38, style, accessibilityLabel })` — radius `size * 0.3`; accent variant = LinearGradient accent→accentDeep at 145°; surface variant = `Colors.surface` + shadow + 1px top border `rgba(255,255,255,0.06)`. Renders a `Pressable` when `onPress` is given, else a `View`.
- `SurfaceCard({ children, selected = false, style })` — `Colors.surface`, radius 20, padding 14, shadow; `selected` adds 1.5px `Colors.accent` border.
- `WedgeBackground({ shape = 'deck' | 'list' })` — absolutely fills parent, `pointerEvents="none"`, SVG `Polygon` with gradient accent→accentDeep, opacity 0.95. Points in a 100×100 viewBox with `preserveAspectRatio="none"`: `deck` = `58,0 100,0 100,70 22,100 0,100 0,62`; `list` = `70,0 100,0 100,40 0,78 0,55`.
- `AppButton` keeps its props; `primary` = accent gradient + `Colors.onAccent` text, `secondary` = `Colors.surface` + `Colors.textPrimary`; no glow shadow.
- `GradientEnergySlider` colours `[Colors.gold, Colors.accent, Colors.accentDeep]`.
- `FilmMatchLogo` defaults: `accentColor = Colors.accent`, `accentSoft = Colors.gold`, `textColor = Colors.textPrimary`, `taglineColor = Colors.textMuted`; the white play triangle uses `Colors.onAccent`.

- [ ] **Step 1:** Implement the three new components per Interfaces.
- [ ] **Step 2:** Restyle AppButton, slider, logo.
- [ ] **Step 3:** `npm run check:theme` → no hits in `src/components/**`. Bundle check succeeds.
- [ ] **Step 4: Commit** `feat(ui): IconSquare, SurfaceCard, WedgeBackground; restyle button, slider, logo`.

### Task 4: Home and Join screens

**Files:** Modify `src/screens/HomeScreen.js`, `HomeScreen.styles.js`, `JoinRoomCodeScreen.js`, `JoinRoomCodeScreen.styles.js`

**Interfaces:** Consumes `WedgeBackground`, `IconSquare`, `SurfaceCard`, `AppButton` (Task 3).

- [ ] **Step 1:** Add `<WedgeBackground shape="list" />` as first child of the screen container; back links become `IconSquare variant="accent"` with `‹`/chevron icon; the name input and avatar grid sit on `SurfaceCard`; selected avatar uses `Colors.accent` border.
- [ ] **Step 2:** `npm run check:theme` → no hits in these files. Bundle check succeeds.
- [ ] **Step 3: Commit** `feat(ui): Kadife Perde home and join screens`.

### Task 5: Mode selection, curation questions, i18n

**Files:** Modify `src/i18n/strings.js`, `src/screens/ModeSelectionScreen.js`, `src/screens/AiCurationQuestionsScreen.js`

**Interfaces:**
- Produces i18n keys in all 7 locales: `mode_ai_title`, `mode_ai_subtitle`, `mode_movie_title`, `mode_movie_subtitle`, `mode_tv_title`, `mode_tv_subtitle`, `curation_quota_reached`.
- Turkish copy (exact): `mode_ai_title: 'Bize Seç'`, `mode_ai_subtitle: 'Ruh halinize göre öneriler'`, `mode_movie_title: 'Filmler'`, `mode_movie_subtitle: 'Popüler filmler'`, `mode_tv_title: 'Diziler'`, `mode_tv_subtitle: 'Popüler ve en iyi diziler'`, `curation_quota_reached: 'Bugünlük öneri hakkı doldu. Filmler ya da Diziler modunu deneyebilirsiniz.'`. English: `'Pick for Us'`, `'Suggestions for your mood'`, `'Movies'`, `'Popular movies'`, `'Series'`, `'Popular and top rated series'`, `"Today's suggestions are used up. Try Movies or Series."`. Other locales: natural translations of the English, no "AI".

- [ ] **Step 1:** Add the keys. `npm run check:theme` → the i18n part passes.
- [ ] **Step 2:** ModeSelection: `MODE_OPTIONS` holds `{ key, icon: '🍿'|'🎬'|'📺', titleKey, subtitleKey }`, rendered with `t()`; each option is a `SurfaceCard selected={…}` containing an `IconSquare` (accent when selected) + title/subtitle; `WedgeBackground shape="list"` behind; replace all `Colors.indigo*`/`glow*`.
- [ ] **Step 3:** AiCurationQuestions: header text → `t('mode_ai_title')`, quota text → `t('curation_quota_reached')`; recolour (`indigo*`→`accent`/`gold`, `glow*`→`shadow`); add `WedgeBackground shape="list"`.
- [ ] **Step 4:** `grep -rn "AI Kürasyon\|AI önerileri" src` → no output. `npm run check:theme` → no hits in these files. Bundle check succeeds.
- [ ] **Step 5: Commit** `feat(ui): Bize Seç naming, Kadife Perde mode and question screens`.

### Task 6: Swipe screen

**Files:** Modify `src/screens/SwipeScreen.js`

**Interfaces:** Consumes `WedgeBackground`, `IconSquare` (Task 3).

- [ ] **Step 1:** Replace the background LinearGradient (`#0C0D12…#1A0F24`) and `safe` bg with `Colors.background` + `<WedgeBackground shape="deck" />`.
- [ ] **Step 2:** Behind the top card render two static ghost cards (`Colors.surface2`, radius = card radius, opacity 0.55 / 0.3, `translateY -10/-20`, `scale 0.94/0.88`) **only when ≥2 / ≥3 cards remain** (Review Focus: 1 card left).
- [ ] **Step 3:** Rating chip → `Colors.gold` bg with `Colors.background` text; other chips stay translucent dark.
- [ ] **Step 4:** Action buttons → rounded squares (radius 18, 54px; like = 62px accent gradient with `Colors.onAccent` icon; dislike/superlike = `Colors.surface`). Like/dislike feedback overlays keep green/red meaning via `Colors.match` / `Colors.error` with alpha.
- [ ] **Step 5:** Every remaining hex in the file → token; `rgba(255,255,255,x)` hairlines may stay.
- [ ] **Step 6:** `npm run check:theme` → no hits in SwipeScreen. Bundle check succeeds. On a ≈360dp emulator/device, action buttons fully visible (Review Focus).
- [ ] **Step 7: Commit** `feat(ui): Kadife Perde swipe deck`.

### Task 7: Remove aliases and verify

**Files:** Modify `src/constants/Colors.js` (+ any stragglers the guard reports)

- [ ] **Step 1:** Delete the temporary alias keys from `Colors.js`.
- [ ] **Step 2:** `npm run check:theme` → `theme check passed`. `grep -rn "Colors\.\(indigo\|glow\|surfaceMuted\|surfaceCard\|borderLight\|borderAccent\|textOnAccent\|trackUnderlay\|sliderMaxTrack\)" src` → no output.
- [ ] **Step 3:** Bundle check succeeds. `cd worker && npm test` → 17 pass.
- [ ] **Step 4:** Manual walkthrough on device (owner): create room → join from second device → mode select → Bize Seç questions → swipe; launch once with a non-tr locale; no indigo anywhere.
- [ ] **Step 5: Commit** `chore(ui): remove legacy colour aliases`.
