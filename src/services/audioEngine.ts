import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
} from 'expo-audio';
import { SOUND_BY_ID } from '../lib/sounds';
import { sanitizeLayer, useStore } from '../store/useStore';
import { DEFAULT_TONE, type LayerState } from '../types';

// ---------------------------------------------------------------------------
// Lullhaven audio engine.
//
// The whole product promise lives here: sound that never stops and
// never loops audibly. Mechanisms:
//
// 1. Background session. The audio mode is set at startup with
//    shouldPlayInBackground + playsInSilentMode, and the expo-audio
//    config plugin in app.json adds the iOS "audio" background mode
//    and the Android media-playback foreground service, so playback
//    continues with the screen locked, all night. The mode is
//    re-asserted after any player error (another app or a system
//    reset can steal the session overnight).
//
// 2. Seamless looping by dual-player crossfade. Every layer runs two
//    player instances. As the active instance nears the end of its
//    file, the idle instance starts from zero and the engine crossfades
//    gains over CROSSFADE_SECONDS, then the roles swap. The shipped
//    files are also loop-prepared (tail crossfaded into head), so the
//    boundary is inaudible twice over.
//
// 3. One gain equation for everything:
//      gain = master x layer x timerFade(layer) x fadeIn x osc x crossfade
//    The sleep-timer fade is per layer since v1.1: a layer with a
//    "linger" (Delayed Ending) fades against its own end time, after
//    the rest of the mix has melted away. The oscillator multiplies
//    a slow swell into the same equation, so nothing ever fights.
//
// 4. Overnight watchdog (v1.1). The category's #1 hated failure is
//    silence at 3 AM, so the engine does not trust any single player:
//      - a player that reports an error is destroyed and recreated;
//      - a player that should be audible but is not playing gets
//        play() on every tick, and if it stays silent for several
//        seconds its pair is recreated from scratch;
//      - a player whose clock stops advancing while it claims to be
//        playing (a stalled decoder) has its pair recreated.
//    Recovery is bounded (a pair is recreated at most once per few
//    seconds) and every path is guarded: a watchdog must never be
//    the thing that crashes the night.
//
// 5. Tone on the rate path. Soften and pitch ride the player's
//    playbackRate with pitch correction off (varispeed): softening
//    drops the rate, which darkens the sound; pitch nudges the rate
//    by semitones. Coarse, honest, and client-only; true EQ is
//    native work (see README roadmap).
//
// Interruptions: interruptionMode 'duckOthers' means a call or alarm
// ducks Lullhaven instead of killing it, and playback resumes at full
// gain afterwards. (On-device interruption + overnight verification
// is still owed: see README "Native build list".)
//
// The UI never touches player APIs; it writes to the Zustand store and
// this module reconciles players against the store on every tick.
// ---------------------------------------------------------------------------

const CROSSFADE_SECONDS = 8;
const TICK_MS = 250;
const FADE_IN_SECONDS = 5;
const STALL_LIMIT_TICKS = 12; // ~3 s of no clock progress -> recreate
const SILENT_LIMIT_TICKS = 8; // ~2 s of should-be-playing silence -> recreate

interface LayerPlayers {
  a: AudioPlayer;
  b: AudioPlayer;
  active: 'a' | 'b';
  crossfading: boolean;
  /** Last tone-derived rate applied, to avoid setter spam. */
  appliedRate: number;
  /** Last observed currentTime of the active player. */
  lastClock: number;
  stallTicks: number;
  silentTicks: number;
  lastRecreateAt: number;
}

const layerPlayers = new Map<string, LayerPlayers>();
let tickHandle: ReturnType<typeof setInterval> | null = null;
let modeReady = false;
let fadeInStartedAt: number | null = null;
let wasPlaying = false;

async function ensureAudioMode(force = false) {
  if (modeReady && !force) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
    modeReady = true;
  } catch {
    // Web and some environments reject parts of the mode; playback
    // still works in the foreground there.
  }
}

function resolveSource(soundId: string): AudioSource | null {
  const bundled = SOUND_BY_ID[soundId];
  if (bundled) return bundled.source as AudioSource;
  const custom = useStore
    .getState()
    .customSounds.find((s) => s.id === soundId);
  if (custom) return { uri: custom.uri };
  return null;
}

function createPair(soundId: string): LayerPlayers | null {
  const source = resolveSource(soundId);
  if (!source) return null;
  try {
    const a = createAudioPlayer(source, { updateInterval: 500 });
    const b = createAudioPlayer(source, { updateInterval: 500 });
    a.volume = 0;
    b.volume = 0;
    const pair: LayerPlayers = {
      a,
      b,
      active: 'a',
      crossfading: false,
      appliedRate: 1,
      lastClock: -1,
      stallTicks: 0,
      silentTicks: 0,
      lastRecreateAt: Date.now(),
    };
    watchPlayer(pair, a, soundId);
    watchPlayer(pair, b, soundId);
    return pair;
  } catch {
    return null;
  }
}

/** Error listener: a player that errors overnight is marked for
 * recreation by zeroing its clock progress; the tick loop performs
 * the actual rebuild (listeners stay thin and never throw). */
function watchPlayer(pair: LayerPlayers, player: AudioPlayer, soundId: string) {
  try {
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.error) {
        pair.stallTicks = STALL_LIMIT_TICKS;
        void ensureAudioMode(true);
      }
      if (status.mediaServicesDidReset) {
        pair.stallTicks = STALL_LIMIT_TICKS;
        void ensureAudioMode(true);
      }
    });
  } catch {
    // The event API is best-effort; the tick watchdog still covers us.
  }
  void soundId;
}

function destroyPair(pair: LayerPlayers) {
  try {
    pair.a.pause();
    pair.b.pause();
    pair.a.remove();
    pair.b.remove();
  } catch {
    // already released
  }
}

function activePlayer(pair: LayerPlayers): AudioPlayer {
  return pair.active === 'a' ? pair.a : pair.b;
}

function idlePlayer(pair: LayerPlayers): AudioPlayer {
  return pair.active === 'a' ? pair.b : pair.a;
}

/** Per-layer timer fade: the layer's own end is the mix's timer end
 * plus its linger. No timer -> 1. Also drives mix completion: the
 * caller reports whether every layer's end has passed. */
function layerFadeMultiplier(layer: LayerState, now: number): number {
  const { timerEndsAt, settings } = useStore.getState();
  if (!timerEndsAt) return 1;
  const end = timerEndsAt + (layer.lingerMinutes ?? 0) * 60_000;
  const remaining = (end - now) / 1000;
  if (remaining <= 0) return 0;
  const fade = settings.fadeSeconds;
  if (remaining >= fade) return 1;
  return Math.max(0, remaining / fade);
}

function allLayerEndsPassed(now: number): boolean {
  const { timerEndsAt, layers } = useStore.getState();
  if (!timerEndsAt) return false;
  return layers.every(
    (l) => timerEndsAt + (l.lingerMinutes ?? 0) * 60_000 <= now,
  );
}

function fadeInMultiplier(now: number): number {
  const { settings } = useStore.getState();
  if (!settings.fadeInEnabled || fadeInStartedAt === null) return 1;
  const p = (now - fadeInStartedAt) / (FADE_IN_SECONDS * 1000);
  if (p >= 1) return 1;
  return Math.max(0, p);
}

/** Oscillator swell factor for a layer: 1 at the top of the swell,
 * dipping to (1 - depth) at the bottom. Phase is derived from the
 * sound id so layers never swell in lockstep. */
function oscMultiplier(layer: LayerState, now: number): number {
  const tone = layer.tone ?? DEFAULT_TONE;
  if (!tone.oscEnabled) return 1;
  let hash = 0;
  for (let i = 0; i < layer.soundId.length; i++) {
    hash = (hash * 31 + layer.soundId.charCodeAt(i)) % 997;
  }
  const phase = (hash / 997) * tone.oscPeriodSec;
  const t = (now / 1000 + phase) / tone.oscPeriodSec;
  const wave = 0.5 + 0.5 * Math.sin(2 * Math.PI * t - Math.PI / 2);
  return 1 - tone.oscDepth + tone.oscDepth * wave;
}

/** Rate for the tone controls: soften drops the rate (darker via
 * varispeed), pitch multiplies by semitones. */
function toneRate(layer: LayerState): number {
  const tone = layer.tone ?? DEFAULT_TONE;
  const softenRate = 1 - tone.soften * 0.14;
  const pitchRate = Math.pow(2, tone.pitch / 12);
  const rate = softenRate * pitchRate;
  return Number.isFinite(rate) ? Math.min(2, Math.max(0.5, rate)) : 1;
}

function applyToneRate(pair: LayerPlayers, layer: LayerState) {
  const rate = toneRate(layer);
  if (Math.abs(rate - pair.appliedRate) < 0.001) return;
  pair.appliedRate = rate;
  for (const player of [pair.a, pair.b]) {
    try {
      player.shouldCorrectPitch = rate === 1;
      player.setPlaybackRate(rate, 'high');
    } catch {
      // Rate control is unavailable on some web paths; gains still work.
    }
  }
}

function tick() {
  const state = useStore.getState();
  const now = Date.now();

  // Gentle start bookkeeping: a rising edge of isPlaying (re)starts
  // the fade-in ramp.
  if (state.isPlaying && !wasPlaying) fadeInStartedAt = now;
  if (!state.isPlaying) fadeInStartedAt = null;
  wasPlaying = state.isPlaying;

  // Queue advancement: a scene's segment elapsed -> next scene.
  if (state.queueStartedAt !== null && state.queueIds.length > 0) {
    const segmentMs = state.queueMinutesPerScene * 60_000;
    if (now - state.queueStartedAt >= segmentMs) {
      state.advanceQueue();
    }
  }

  // Timer completion is per-layer now: the mix ends only when the
  // longest linger has melted away.
  if (state.timerEndsAt && allLayerEndsPassed(now)) {
    state.timerFinished();
  }

  const fadeIn = fadeInMultiplier(now);
  // Never let a missing or corrupt setting reach a player as NaN.
  const masterRaw = state.settings.masterVolume;
  const master = Number.isFinite(masterRaw)
    ? Math.min(1, Math.max(0, masterRaw))
    : 0.9;
  const wanted = new Map(
    state.layers.map((l) => [l.soundId, sanitizeLayer(l)]),
  );

  // Remove players for layers that left the mix.
  for (const [soundId, pair] of Array.from(layerPlayers.entries())) {
    if (!wanted.has(soundId)) {
      destroyPair(pair);
      layerPlayers.delete(soundId);
    }
  }

  // Add players for new layers.
  for (const soundId of wanted.keys()) {
    if (!layerPlayers.has(soundId)) {
      const pair = createPair(soundId);
      if (pair) layerPlayers.set(soundId, pair);
    }
  }

  for (const [soundId, pair] of layerPlayers.entries()) {
    const layer = wanted.get(soundId);
    if (!layer) continue;
    applyToneRate(pair, layer);
    const layerFade = layerFadeMultiplier(layer, now);
    const osc = oscMultiplier(layer, now);
    const layerVolume = layer.volume;
    const base = Number.isFinite(layerVolume)
      ? layerVolume * master * layerFade * fadeIn * osc
      : 0;
    const current = activePlayer(pair);
    const idle = idlePlayer(pair);

    if (!state.isPlaying || base <= 0.001) {
      if (current.playing) current.pause();
      if (idle.playing) idle.pause();
      pair.crossfading = false;
      pair.silentTicks = 0;
      pair.stallTicks = 0;
      continue;
    }

    // --- Watchdog: stall detection on the active player's clock.
    const clock = current.currentTime || 0;
    if (current.playing && !pair.crossfading) {
      if (Math.abs(clock - pair.lastClock) < 0.01) {
        pair.stallTicks += 1;
      } else {
        pair.stallTicks = 0;
      }
    }
    pair.lastClock = clock;

    const needsRecreate =
      (pair.stallTicks >= STALL_LIMIT_TICKS ||
        pair.silentTicks >= SILENT_LIMIT_TICKS) &&
      now - pair.lastRecreateAt > 4000;
    if (needsRecreate) {
      destroyPair(pair);
      const fresh = createPair(soundId);
      if (fresh) {
        layerPlayers.set(soundId, fresh);
        fresh.appliedRate = 1;
        applyToneRate(fresh, layer);
        try {
          activePlayer(fresh).play();
        } catch {
          // next tick retries
        }
      } else {
        layerPlayers.delete(soundId);
      }
      continue;
    }

    if (!current.playing && !pair.crossfading) {
      pair.silentTicks += 1;
      try {
        current.play();
      } catch {
        // Autoplay restrictions (web) resolve on the next user tap.
      }
    } else if (current.playing) {
      pair.silentTicks = 0;
    }

    const duration = current.duration || 0;
    const remaining = duration > 0 ? duration - clock : Infinity;

    if (!pair.crossfading && duration > 0 && remaining <= CROSSFADE_SECONDS) {
      pair.crossfading = true;
      pair.stallTicks = 0;
      try {
        idle.seekTo(0);
        idle.volume = 0;
        idle.play();
      } catch {
        pair.crossfading = false;
      }
    }

    if (pair.crossfading) {
      const progress = Math.min(
        1,
        Math.max(0, (CROSSFADE_SECONDS - remaining) / CROSSFADE_SECONDS),
      );
      current.volume = base * (1 - progress);
      idle.volume = base * progress;
      if (remaining <= 0.15 || progress >= 1) {
        try {
          current.pause();
          current.seekTo(0);
        } catch {
          // ignore
        }
        current.volume = 0;
        idle.volume = base;
        pair.active = pair.active === 'a' ? 'b' : 'a';
        pair.crossfading = false;
        pair.lastClock = 0;
      }
    } else {
      current.volume = base;
      idle.volume = 0;
    }
  }
}

export function startEngine() {
  void ensureAudioMode();
  if (tickHandle) return;
  tickHandle = setInterval(tick, TICK_MS);
  tick();
}

export function stopEngine() {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
  for (const pair of layerPlayers.values()) {
    try {
      pair.a.pause();
      pair.b.pause();
    } catch {
      // ignore
    }
  }
}
