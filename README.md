# Lullhaven — Sleep Sounds Mixer

A quiet sleep-sounds app built around the three failures that fill
the incumbents' 1-star reviews: playback that stops when the screen
locks, short loops you can hear restarting, and loud ads in the
middle of the night. Lullhaven plays long, seamless loops of rain,
ocean, wind and room tone with the screen locked, all night; layers up
to six sounds in a mixer with per-sound volumes; saves mixes as
one-tap scenes; and fades out gently on a sleep timer instead of
cutting off. Fully offline, no account, no ads, nothing collected.

> **Name.** The display name is **Lullhaven** (locked by Ram Oct 31,
> 2026). The app was built as **Rainhaven** (name locked Oct 26,
> 2026, after Quietide was dropped for a registered trademark), but
> first-hand re-verification on Oct 30, 2026 found that name
> **blocked on iOS**: a live app, "Rainhaven: Sleep & Rain Sounds"
> by Ruben Alvarez (App Store ID 6808733074, released Sep 21, 2026),
> already owns the exact name in the exact category, and Apple
> requires unique app names. A 20-candidate rename search ran
> Oct 30–31, 2026 (report:
> `~/workspace/research_notes/rainhaven-rename-search-20261030/report.md`),
> and Ram picked **Lullhaven** from the shortlist. The screening
> basis is a knockout-lite pass over trademark mirrors (Justia,
> TrademarkElite, Furm): no exact LULLHAVEN mark found, no exact
> app on either store, and `lullhaven.app` available. **Still owed
> before any store submission: a manual USPTO tmsearch check on
> LULLHAVEN** (the official search would not render for automated
> checks). `lullhaven.app` is **not yet registered**; domain
> registration is Ram's purchase step. Following the Mistless
> precedent (Exhale → Mistless), the rename is display-only:
> internal identifiers keep the original **rainhaven** codename:
> this folder, Expo slug `rainhaven`, URL scheme `rainhaven`,
> bundle ID / package `app.rainhaven.sleep`, AsyncStorage key
> `rainhaven-state-v1`. Store title in the listing pack is
> "Lullhaven: Sleep Sounds".

## Run it

```bash
npm install
npx expo start
```

Then open it in **Expo Go** (scan the QR code) or press `a` / `i` /
`w`. For the real background-playback behaviour, use an EAS
development build: Expo Go cannot host the Android foreground
service or the iOS audio background mode the app is configured for.

Other scripts:

```bash
npm run typecheck        # tsc --noEmit
npx expo export --platform web   # production bundle smoke test
```

## Stack

- Expo (SDK 58) + React Native + TypeScript
- expo-router (file-based navigation, tabs + modals)
- **expo-audio** for playback, behind a single engine module
- Zustand for state, persisted to AsyncStorage (`zustand/middleware/persist`)
- Custom gesture-driven slider (react-native-gesture-handler +
  Reanimated) for every volume control; see the design notes
- `expo-linear-gradient` for the glossy card and button finishes
- Reanimated 4 (with the worklets babel plugin) for card
  expand/collapse, the breathing play-button halo, and wave bars
- Fonts: Fraunces (display) + Archivo (body) via `@expo-google-fonts/*`
- Icons: `@expo/vector-icons` (Ionicons + MaterialCommunityIcons)

## How it is organised

```
app/                      expo-router routes
  _layout.tsx             root stack, font loading, engine start
  index.tsx               entry redirect into the tabs
  paywall.tsx             Plus screen, dormant in v1 (modal)
  about.tsx               privacy promise, plain disclaimer, sound
                          credits (modal)
  (tabs)/
    index.tsx             Sounds: Hume-style device tiles grouped by
                          category, stat pills, now-playing hero card;
                          tap to add a sound, its slider slides open
    mixer.tsx             The dashboard: now-playing scene card,
                          per-layer cards, master volume, sleep timer
                          as a segmented glass dock, save as a scene
    presets.tsx           Scenes: built-in + your mixes as glossy
                          scene cards, one tap to play, delete your own
    settings.tsx          default timer and fade length as segmented
                          docks in gloss cards, Plus and About links,
                          reset all data

src/
  types.ts                SoundDef, LayerState, Preset, HavenSettings
  theme.ts                night palette, font families, spacing, radii
  store/useStore.ts       the single Zustand store (persisted)
  lib/sounds.ts           the ten-sound core pack + categories
  components/             ui primitives, MaxWidth, VolumeSlider
  services/
    audioEngine.ts        the playback engine (see below)
    revenuecat.ts         dormant purchase layer (see below)

assets/sounds/            the core pack (.m4a) + SOUND_REGISTER.md
                          with the licence record for every file
```

### Where state lives

One Zustand store (`src/store/useStore.ts`), persisted under the
AsyncStorage key `rainhaven-state-v1`. It holds the current mix
(layers + volumes), the active preset name, favourites, user presets,
and settings (default timer, fade length, master volume). Playback
state (`isPlaying`, the running timer's end time) is deliberately not
persisted: reopening the app restores the mix, paused, ready.

## The audio engine (the product)

`src/services/audioEngine.ts` is the only module that touches player
APIs. Three mechanisms, per the architecture doc:

1. **Background session.** The engine sets the audio mode once at
   startup (`shouldPlayInBackground`, `playsInSilentMode`,
   `interruptionMode: 'duckOthers'` so a call or alarm ducks the mix
   instead of killing it). The `expo-audio` config plugin in
   `app.json` adds the iOS `audio` background mode and the Android
   media-playback **foreground service** (with `FOREGROUND_SERVICE`,
   `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, and `WAKE_LOCK` permissions,
   and no microphone permission: Lullhaven never records).
2. **Seamless looping by dual-player crossfade.** Every layer runs
   two player instances. As the active one nears the end of its file,
   the idle one starts from zero and gains crossfade over 8 seconds,
   then roles swap. The shipped files are also loop-prepared (tail
   crossfaded into head in the asset pipeline), so the boundary is
   inaudible twice over.
3. **One gain equation.** `gain = masterVolume x layerVolume x
   timerFade x crossfadeFactor`. Normal playback, crossfades, and the
   sleep-timer fade-out all read from it, so they can never fight.

The engine reconciles players against the store on a 250 ms tick:
add a sound in the library and it is playing before the screen
finishes responding; let the timer run out and the fade multiplier
walks every gain to zero, then playback stops.

### Audio spike status (sandbox vs device)

Verified in this sandbox: the background configuration is present and
correct in the generated native config (iOS background mode, Android
foreground service + permissions, all visible via `expo config` /
prebuild output), the engine's crossfade and fade math is
deterministic and covered by the tick logic, and the web build plays
and loops through the same engine code.

**Still owed on real devices before release** (release blockers from
the spike plan, unchanged): an 8-hour overnight run, screen locked,
on a real iPhone and a real Android phone, with battery drain noted;
the interruption test (call, alarm, another app's audio); and a
headphone loop audit across crossfade boundaries on device. The spike
plan also leaves the door open to swapping the player layer for
react-native-track-player behind the same engine interface if the
overnight test ever shows a gap. Expo Go cannot prove any of this;
an EAS development build on Ram's S25 Ultra and an iPhone is the next
physical step.

## The sounds

**44 bundled sounds** (v1.1), variants first: 11 rain and storm, 9
water, 11 air and noise, 7 night, 6 home and travel. 29 are
recordings and 15 are generated in-project. The sourcing rule is
hard: every recording is public domain, CC0, or Public Domain Mark,
with the licence read on the file's own page (Wikimedia Commons,
PDSounds, archive.org); CC BY material is excluded even though
attribution would be possible, and anything whose licence could not
be verified was rejected and logged. The generated family (seven
coloured noises, five appliance sounds, airplane cabin, train,
heartbeat, womb, cat purr, campfire) is rendered by
`src/services/noiseGen.ts` and labelled generated everywhere it
appears. Every file's source, author, licence, preparation, and QA
result is logged in `assets/sounds/SOUND_REGISTER.md`, and the About
screen carries the credits. Every file is loop-prepared with the
same 10-second equal-power crossfade and level-normalised to the
pack profile (about −21 dB RMS, −1 dB peak ceiling); the pack is
about 64 MB. On top of the bundled 44, users can import their own
audio files and generate coloured noise in the Noise Lab; those live
only on the device.

## v1.1: absorb the category (Oct 31, 2026)

Built from a review-mining pass over the top sleep-sounds apps
(BetterSleep, Rain Rain, Slumber, myNoise and peers): fold in
everything users love, engineer out everything they hate. The
category contract this serves: "play my exact mix, seamlessly, all
night, in the background, offline, and never surprise me."

- **Overnight reliability hardening.** The engine now watches its
  own playback: a stalled or silently stopped player pair is
  recreated (bounded, so a genuinely broken file cannot spin), OS
  media-service resets and player errors trigger recovery, and the
  audio mode is re-asserted. The Mix hero shows the countdown and a
  plain "Playing until 6:47 AM" clock time; nothing stops silently
  if the engine can help it.
- **Library 10 → 44 bundled sounds**, variants first (see above).
- **Per-layer tone shaping.** Each layer card opens tone controls:
  Soften (one-knob muffling via the player's rate/pitch path),
  Pitch (−6..+6 semitones), an Oscillator swell (Rain Rain's
  pattern; 8/16/32/60-second cycles, applied in the engine's gain
  equation so it is safe with the dual-player crossfade), and a
  Delayed Ending (Slumber's pattern: the layer lingers +15/+30/+60
  minutes after the timer ends the mix). True multi-band EQ is
  native work and stays on the roadmap below; the UI says what the
  controls do in plain words.
- **Noise Lab.** Runtime procedural coloured-noise generator
  (white, pink, brown, green, blue, grey, violet) with a tone
  control and 60/120-second loops, seamless by construction,
  generated on the device and saved as a user sound.
- **Mix backup and sharing.** Mixes, scenes, and a full backup
  travel as small versioned JSON files through the system share
  sheet; import validates everything (app tag, version, known
  sounds) and refuses gracefully with a plain-language reason,
  never a partial import.
- **Import your own sound.** File picker → copied into app storage
  → appears under "Your sounds", layerable and deletable like any
  bundled sound.
- **Fade-duration choice** extended to 30 sec / 1 / 2 / 5 / 15 / 30
  / 60 minutes; optional gentle-start fade-in.
- **Bedtime reminder.** Opt-in local notification at a set time,
  off by default, silent, nothing sent anywhere.
- **Night queue.** Scenes can be queued to play in sequence at
  15/30/45/60 minutes per scene.
- **Baby collection.** Three nursery scenes (Womb room, Hair dryer
  hush, Nursery fan) as a scenes grouping, deliberately not a
  separate mode.
- **Paywall honesty.** The grandfathering promise is printed on the
  paywall: sounds and features that are free today stay free
  forever; nothing already in a user's mixes ever re-locks. Planned
  pricing changed to lifetime $29.99 (lead) and annual $19.99; no
  monthly, no weekly tier. The paywall stays dormant: nothing can
  be purchased.

## Product policy: the core is never paywalled

Overnight playback, the core sound pack, the mixer, presets, the
sleep timer, and favourites are **free forever**. Any future Plus
tier may only add extras on top of a complete free app (downloadable
sound packs, a bedtime routine builder). Playback itself can never
be gated: a sleep app that stops working when a subscription lapses
is a sleep app that wakes you up.

## Privacy

No account. No tracking. Lullhaven collects nothing. Mixes,
favourites, and settings live only on the device; the sounds are
bundled files, so the app works fully offline, in airplane mode, all
night.

## Design notes

**Oct 31, 2026: the UI was rebuilt in the visual system of Hume**
(Phenomenon Studio's smart-home app, Dribbble shot 26559633), at the
owner's explicit direction ("copy 100% of their UI for our apps").
This is an owner-directed override of the earlier no-glassmorphism
house rule, for this app: glossy glass is the point now. Hume's
brand, logo, and copy are not used; the system is: warm-dark
surfaces, large rounded glossy cards (radius 24–28) with gradient
finishes, a lit top edge and a soft inner glow, frosted icon orbs,
clear on/off pill states, stat pills, a smoked-glass segmented dock
for choices (sleep timer, settings), one giant glossy amber pill as
the primary action, and a **floating glass tab bar** that hovers
above the bottom edge. Lullhaven's identity inside that system:
deep pine (`#081713`), warm paper text (`#E9E4D6`), lamplight amber
(`#D9932E`) as the hot accent, luminous teal (`#3ED6C5`) as the
"switched on" accent, Fraunces display type with Archivo body text.
Mapping: Sounds are Hume's device tiles (grouped by category, as
Hume groups by room); the Mix screen is Hume's dashboard with the
now-playing scene card on top; Presets are Hume's scenes. Still
banned, as before: purple-black palettes, dot grids, rainbow
gradients, emojis in UI copy, bento grids, fake terminals, default
Inter/Geist fonts, Lucide icon spray. Every tab screen renders
inside a `MaxWidth` wrapper capped at 600dp so nothing stretches
on tablets.

Motion (Reanimated): sound tiles expand and collapse with a spring
layout transition as their sliders slide open; the play button has
a breathing halo while sound plays and springs under the finger;
wave bars on the now-playing cards move while playing and settle
flat when paused; the slider thumb swells while dragged.

### Floating tab bar and the Android nav bar (bug fix)

The previous bar was a flush 60px strip. On Ram's S25 Ultra it
rendered inside the Android system navigation strip and its icons
interleaved with the back/home/recents buttons. The bar is now a
floating glass pill whose bottom offset is the device bottom
safe-area inset (from `react-native-safe-area-context`) plus a
10px air gap, so it always clears the system nav zone; tab screens
pad their scroll content by `TAB_BAR_CLEARANCE` so nothing hides
under it. Verified in the screenshot round with a simulated 44px
Android nav strip: bar and glyphs fully separated.

### The volume-0 bug (bug fix)

Ram added Fan and White noise and heard nothing: their layers sat
at volume 0. Two-part fix. The add default is now a deliberate
`DEFAULT_LAYER_VOLUME = 0.75` (`src/store/useStore.ts`), and the
slider itself was rebuilt gesture-driven: the old
`@react-native-community/slider` could report a value before the
user touched it (Android fires on mount), silently zeroing fresh
layers; the new slider only speaks when a finger moves it. A layer
at zero now also says so: "Muted" in the library row and a MUTED
pill on its Mix card.

### Mixer cap: six layers

The cap rose from 4 to 6 (`MAX_LAYERS`). The engine runs two
crossfading players per layer, so six layers is twelve live
players, comfortably inside what expo-audio and a phone audio
stack handle; past six simultaneous loops a sleep mix turns to
mud anyway. The cap is visible wherever it matters: a "N of 6
layers" stat pill on Sounds, "N of 6 layers" on the Mix hero, and
a gentle note on Sounds when all six are on. All layers play truly
simultaneously through the one gain equation; saved mixes keep
their stored volumes (only the add-action default changed).

Claim discipline throughout: no fabricated social proof, no user
counts, no testimonials, and no medical claims. The About screen
states plainly: "Lullhaven is not a medical device and does not
diagnose, treat, cure, or prevent any medical condition, including
insomnia or any other sleep disorder."

## Monetization: deliberately OFF in v1

Lullhaven is fully free by the owner's requirement (build first,
monetize later). The paywall screen exists for design purposes and
shows an honest "not open yet" state with the planned pricing
printed on it: lifetime $29.99 as the lead, optional annual $19.99,
no monthly and no weekly tier (v1.1 repricing from the category
review mining: users will pay once, and resent weekly tiers). The
grandfathering promise is printed on the same screen. Nothing can
be purchased.

To enable RevenueCat later:

1. `npx expo install react-native-purchases`
2. Add the public RevenueCat SDK keys to app config and pass them
   where `configurePurchases()` is documented in
   `src/services/revenuecat.ts`.
3. Implement the stub functions in that one file, then point the
   paywall at the live offerings instead of its constants.

## Native build list

Release gates first, then the roadmap. The roadmap is the review
mining report's (b) list, in its order: features that need native
code, a store presence, or a backend, deliberately not attempted in
the offline Expo build.

Release gates:

1. **On-device overnight verification** (see the spike status
   above): EAS development build, 8-hour locked-screen runs on
   iPhone and Android, interruption tests, battery numbers recorded.
2. **Developer accounts and store submission**: after Ram creates
   the accounts (his step), create the "Lullhaven: Sleep Sounds"
   store records, run the Google Play closed test, and submit,
   after the manual USPTO tmsearch check on LULLHAVEN and with the
   trademark attorney's clearance opinion in hand (see the name
   note at the top).

Roadmap, in the report's order:

1. **True multi-band EQ / DSP** (the JS rate-path tone controls are
   the honest client-only approximation).
2. **Binaural generator.**
3. **Home-screen widgets**: one-tap play of the last mix or a
   favourite scene without opening the app.
4. **Siri Shortcuts / App Intents.**
5. **Fade-in alarm.**
6. **Chromecast.**
7. **Health / sleep tracking.**
8. **Stories and meditation content.**
9. **Community, cloud sync, and accounts.**
10. **AI-generative sounds.**
11. **A separate baby mode** (v1.1 answers this with the Baby
    scenes collection instead).

## Verification (latest pass)

- `npx tsc --noEmit` — passes.
- `npx expo export --platform web` — succeeds (all routes exported,
  sound pack bundled).
- Screenshot pass at 390px phone width over the exported web build
  (library, mix with an active timer, presets, settings, paywall,
  about), seeded through the persisted store key; all six screens
  render as designed.
- One real bug found and fixed by this pass: state persisted by an
  older build could lack `settings.masterVolume` (the persist merge
  replaced the whole settings object), turning every engine gain
  into NaN and throwing on web players. The persist config now
  deep-merges settings over the defaults, and the engine clamps
  every gain input to a finite range before it reaches a player.
  Regression-tested with an old-format seed: clean.
- Known cosmetic note: the statically exported mixer route logs a
  React hydration mismatch (#418) in the browser console because the
  timer text is time-dependent; React falls back to client rendering
  and the screen works. Native builds do not hydrate and are
  unaffected.
- Rename pass (Oct 31, 2026): display name swept from Rainhaven to
  Lullhaven across app.json, every screen, the About credits, and
  the sound register; internal identifiers unchanged (Expo slug,
  bundle ID / package, AsyncStorage key all stay `rainhaven`).
  `npx tsc --noEmit` passes, `npx expo export --platform web`
  succeeds, and the 390px screenshot pass was re-run over the same
  six screens: the new name renders on the library wordmark,
  presets ("From Lullhaven"), settings, paywall ("Lullhaven Plus"),
  and About, and nothing else moved.
- Hume UI overhaul + bug fixes (Oct 31, 2026): `npx tsc --noEmit`
  passes; `npx expo export --platform web` succeeds with the
  Reanimated/worklets stack bundled. Screenshot round at 390px
  (`~/workspace/rainhaven-art/verify/shots/`), seeded with three
  layers at audible volumes (rain 0.80, ocean 0.75, fireplace
  0.60): library (playing hero, wave bars mid-animation, active
  tiles lit with sliders open at 80/75/60), library first-use
  state (empty mix, all tiles off), mixer (hero playing with the
  45-minute timer counting down, layer cards, master volume),
  scenes, settings (segmented docks), paywall, about, and a
  dedicated tab-bar shot with a simulated 44px Android nav strip
  drawn at the screen bottom: the floating bar sits fully clear
  above the strip and its glyphs, no overlap. Two defects were
  caught by this round and fixed before delivery: the slider
  thumb could render below its track inside Mix cards (hit area
  collapsed; now an explicit 40px), and tab labels needed an
  explicit line height on web. The mixer full-page capture only
  shows the first viewport (the RN-web ScrollView does not grow
  the static page), so the timer countdown card was verified in
  the round's mixer-top frame in round one of this pass.
- Expo Go crash fix (Oct 31, 2026): the installed
  react-native-gesture-handler had drifted to 3.4.0 while SDK 58's
  Expo Go binary bundles ~3.3.0; 3.4.0's JS calls a native API the
  binary lacks and the app died on open with "undefined is not a
  function" in GestureHandlerRootView. Aligned via `npx expo
  install` (gesture-handler 3.3.0, reanimated 4.7.1, worklets
  0.13.0, all matching `bundledNativeModules.json`, single copies),
  committed separately. Gate re-run for v1.1 including the newly
  added expo-sharing, expo-document-picker, expo-notifications and
  expo-file-system: all match the bundled versions; the Android
  Metro bundle contains no RNGH getModuleId path (the one
  `getModuleId` string in the bundle is React/Metro's own). This
  gate is version alignment plus bundle resolution; on-device
  confirmation is the owner's reload in Expo Go.
- v1.1 pass (Oct 31, 2026): `npx tsc --noEmit` passes;
  `npx expo export --platform web` succeeds. 390px screenshot
  round over the exported web build, seeded with a **v1.0-shape**
  persisted state (layers without tone/linger, settings without
  the v1.1 fields): library (44 sound tiles across five
  categories, Bring your own card, playing hero), mixer (timer
  armed: "44:58 left" and "Playing until 6:47 AM"; tone panel open
  showing Soften, Pitch, Oscillator, Delayed ending), scenes
  (From Lullhaven, Baby collection, Night queue, Move your
  scenes), settings (extended fade chips, gentle start, bedtime
  reminder off with the merged 22:00 default), paywall
  (grandfathering promise card, lifetime/annual pricing), noise
  lab (seven colour swatches, tone slider, generate button). The
  seeded v1.0 state loaded cleanly: after the first state write,
  persisted layers and presets carry the sanitized v1.1 defaults,
  and settings render with the new fields defaulted; no NaN gains,
  no errors. Known web-only note: the presets and settings routes
  log the same React #418 hydration artifact class documented
  above (seeded or not); both screens render and work, and native
  builds do not hydrate.
