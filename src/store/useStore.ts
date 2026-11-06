import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_TONE,
  type CustomSound,
  type HavenSettings,
  type LayerState,
  type LayerTone,
  type Preset,
} from '../types';

export const BUILT_IN_PRESETS: Preset[] = [
  {
    id: 'preset-rainy-night',
    name: 'Rainy night',
    builtIn: true,
    createdAt: 0,
    layers: [
      { soundId: 'rain', volume: 0.8 },
      { soundId: 'thunderstorm', volume: 0.35 },
    ],
  },
  {
    id: 'preset-cabin-hearth',
    name: 'Cabin hearth',
    builtIn: true,
    createdAt: 0,
    layers: [
      { soundId: 'fireplace', volume: 0.75 },
      { soundId: 'wind', volume: 0.3 },
      { soundId: 'crickets', volume: 0.25 },
    ],
  },
  {
    id: 'preset-deep-room',
    name: 'Deep room tone',
    builtIn: true,
    createdAt: 0,
    layers: [
      { soundId: 'brown-noise', volume: 0.65 },
      { soundId: 'fan', volume: 0.4 },
    ],
  },
  // The Baby collection: the standalone answer to a "baby mode".
  // Not a separate mode, just scenes grouped for the nursery:
  // low, even, womb-adjacent sounds that mask household noise.
  {
    id: 'preset-baby-womb',
    name: 'Womb room',
    builtIn: true,
    collection: 'baby',
    createdAt: 0,
    layers: [
      { soundId: 'womb', volume: 0.7 },
      { soundId: 'brown-noise', volume: 0.35 },
    ],
  },
  {
    id: 'preset-baby-hairdryer',
    name: 'Hair dryer hush',
    builtIn: true,
    collection: 'baby',
    createdAt: 0,
    layers: [
      { soundId: 'hair-dryer', volume: 0.6 },
      { soundId: 'pink-noise', volume: 0.3 },
    ],
  },
  {
    id: 'preset-baby-fan',
    name: 'Nursery fan',
    builtIn: true,
    collection: 'baby',
    createdAt: 0,
    layers: [
      { soundId: 'box-fan', volume: 0.65 },
      { soundId: 'heartbeat', volume: 0.3 },
    ],
  },
];

export const ALL_BUILT_IN_PRESETS: Preset[] = BUILT_IN_PRESETS;

// How many sounds can layer at once. The engine runs two crossfading
// players per layer, so six layers is twelve live players: well inside
// what expo-audio and a phone's audio stack handle comfortably, and
// past six a sleep mix turns to mud anyway. The cap is shown in the
// UI ("3 of 6 layers") wherever sounds are picked.
export const MAX_LAYERS = 6;

// A sound joins the mix clearly audible. (Bug, Oct 31 2026: layers
// could be added at or near zero and Ram heard nothing from them;
// the add default is now a deliberate 0.75 and the slider can only be
// moved by a real touch, never by a mount-time event.)
export const DEFAULT_LAYER_VOLUME = 0.75;

const DEFAULT_SETTINGS: HavenSettings = {
  defaultTimerMinutes: 45,
  fadeSeconds: 120,
  masterVolume: 0.9,
  bedtimeReminderEnabled: false,
  bedtimeReminderTime: '22:00',
  fadeInEnabled: true,
};

/** Fill v1.1 fields on a layer that may have been written by v1.0
 * (or by an imported mix file), so the engine never reads undefined
 * tone/linger values. */
export function sanitizeLayer(layer: Partial<LayerState> & { soundId: string }): LayerState {
  const toneIn = (layer.tone ?? {}) as Partial<LayerTone>;
  const clamp = (v: unknown, lo: number, hi: number, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v)
      ? Math.min(hi, Math.max(lo, v))
      : fallback;
  return {
    soundId: layer.soundId,
    volume: clamp(layer.volume, 0, 1, DEFAULT_LAYER_VOLUME),
    tone: {
      soften: clamp(toneIn.soften, 0, 1, DEFAULT_TONE.soften),
      pitch: clamp(toneIn.pitch, -6, 6, DEFAULT_TONE.pitch),
      oscEnabled: toneIn.oscEnabled === true,
      oscPeriodSec: clamp(toneIn.oscPeriodSec, 4, 120, DEFAULT_TONE.oscPeriodSec),
      oscDepth: clamp(toneIn.oscDepth, 0, 0.9, DEFAULT_TONE.oscDepth),
    },
    lingerMinutes: clamp(layer.lingerMinutes, 0, 240, 0),
  };
}

export function sanitizePreset(preset: Preset): Preset {
  return {
    ...preset,
    layers: (preset.layers ?? []).map(sanitizeLayer),
  };
}

interface HavenState {
  // Current mix (not persisted layer-by-layer playback, but the mix
  // itself is restored so the app reopens where the night left off).
  layers: LayerState[];
  isPlaying: boolean;
  activePresetId: string | null;
  activePresetName: string | null;
  timerEndsAt: number | null;
  timerTotalSeconds: number;
  favorites: string[];
  presets: Preset[];
  settings: HavenSettings;
  /** Sounds imported or generated on this device (v1.1). */
  customSounds: CustomSound[];
  /** Scene queue: ordered preset ids + minutes per scene. */
  queueIds: string[];
  queueMinutesPerScene: number;
  /** Memory-only queue playback position (not persisted). */
  queueIndex: number;
  queueStartedAt: number | null;

  toggleSound: (soundId: string) => void;
  setLayerVolume: (soundId: string, volume: number) => void;
  setLayerTone: (soundId: string, partial: Partial<LayerTone>) => void;
  setLayerLinger: (soundId: string, minutes: number) => void;
  removeLayer: (soundId: string) => void;
  setMasterVolume: (volume: number) => void;
  play: () => void;
  pause: () => void;
  startTimer: (minutes: number) => void;
  cancelTimer: () => void;
  timerFinished: () => void;
  applyPreset: (preset: Preset) => void;
  savePreset: (name: string) => void;
  addPreset: (preset: Preset) => void;
  deletePreset: (id: string) => void;
  toggleFavorite: (soundId: string) => void;
  updateSettings: (partial: Partial<HavenSettings>) => void;
  addCustomSound: (sound: CustomSound) => void;
  deleteCustomSound: (id: string) => void;
  setQueue: (ids: string[], minutesPerScene: number) => void;
  startQueue: () => void;
  stopQueue: () => void;
  advanceQueue: () => void;
  resetAll: () => void;
}

let presetCounter = 0;

export function findPresetById(
  id: string,
  userPresets: Preset[],
): Preset | undefined {
  return (
    userPresets.find((p) => p.id === id) ??
    ALL_BUILT_IN_PRESETS.find((p) => p.id === id)
  );
}

export const useStore = create<HavenState>()(
  persist(
    (set, get) => ({
      layers: [],
      isPlaying: false,
      activePresetId: null,
      activePresetName: null,
      timerEndsAt: null,
      timerTotalSeconds: 0,
      favorites: [],
      presets: [],
      settings: DEFAULT_SETTINGS,
      customSounds: [],
      queueIds: [],
      queueMinutesPerScene: 30,
      queueIndex: 0,
      queueStartedAt: null,

      toggleSound: (soundId) => {
        const { layers } = get();
        if (layers.some((l) => l.soundId === soundId)) {
          set({
            layers: layers.filter((l) => l.soundId !== soundId),
            activePresetId: null,
            activePresetName: null,
          });
        } else if (layers.length < MAX_LAYERS) {
          set({
            layers: [
              ...layers,
              sanitizeLayer({ soundId, volume: DEFAULT_LAYER_VOLUME }),
            ],
            isPlaying: true,
            activePresetId: null,
            activePresetName: null,
          });
        }
      },

      setLayerVolume: (soundId, volume) =>
        set({
          layers: get().layers.map((l) =>
            l.soundId === soundId ? { ...l, volume } : l,
          ),
          activePresetId: null,
          activePresetName: null,
        }),

      setLayerTone: (soundId, partial) =>
        set({
          layers: get().layers.map((l) =>
            l.soundId === soundId
              ? { ...l, tone: { ...(l.tone ?? DEFAULT_TONE), ...partial } }
              : l,
          ),
        }),

      setLayerLinger: (soundId, minutes) =>
        set({
          layers: get().layers.map((l) =>
            l.soundId === soundId ? { ...l, lingerMinutes: minutes } : l,
          ),
        }),

      removeLayer: (soundId) =>
        set({
          layers: get().layers.filter((l) => l.soundId !== soundId),
          activePresetId: null,
          activePresetName: null,
        }),

      setMasterVolume: (volume) =>
        set({ settings: { ...get().settings, masterVolume: volume } }),

      play: () => {
        if (get().layers.length > 0) set({ isPlaying: true });
      },

      pause: () => set({ isPlaying: false }),

      startTimer: (minutes) =>
        set({
          timerEndsAt: Date.now() + minutes * 60 * 1000,
          timerTotalSeconds: minutes * 60,
          isPlaying: get().layers.length > 0 ? true : get().isPlaying,
        }),

      cancelTimer: () => set({ timerEndsAt: null, timerTotalSeconds: 0 }),

      timerFinished: () =>
        set({ isPlaying: false, timerEndsAt: null, timerTotalSeconds: 0 }),

      applyPreset: (preset) =>
        set({
          layers: preset.layers.map((l) => sanitizeLayer(l)),
          isPlaying: true,
          activePresetId: preset.id,
          activePresetName: preset.name,
        }),

      savePreset: (name) => {
        const { layers, presets } = get();
        if (layers.length === 0) return;
        presetCounter += 1;
        const preset: Preset = {
          id: `preset-${Date.now()}-${presetCounter}`,
          name: name.trim() || 'My mix',
          layers: layers.map((l) => sanitizeLayer(l)),
          createdAt: Date.now(),
        };
        set({ presets: [preset, ...presets], activePresetId: preset.id, activePresetName: preset.name });
      },

      addPreset: (preset) => {
        const clean = sanitizePreset(preset);
        set({ presets: [clean, ...get().presets] });
      },

      deletePreset: (id) =>
        set({ presets: get().presets.filter((p) => p.id !== id) }),

      toggleFavorite: (soundId) => {
        const { favorites } = get();
        set({
          favorites: favorites.includes(soundId)
            ? favorites.filter((f) => f !== soundId)
            : [...favorites, soundId],
        });
      },

      updateSettings: (partial) =>
        set({ settings: { ...get().settings, ...partial } }),

      addCustomSound: (sound) =>
        set({ customSounds: [sound, ...get().customSounds] }),

      deleteCustomSound: (id) => {
        const { customSounds, layers, favorites } = get();
        set({
          customSounds: customSounds.filter((s) => s.id !== id),
          layers: layers.filter((l) => l.soundId !== id),
          favorites: favorites.filter((f) => f !== id),
        });
      },

      setQueue: (ids, minutesPerScene) =>
        set({
          queueIds: ids,
          queueMinutesPerScene: minutesPerScene,
          queueIndex: 0,
          queueStartedAt: null,
        }),

      startQueue: () => {
        const { queueIds, presets } = get();
        if (queueIds.length === 0) return;
        const first = findPresetById(queueIds[0], presets);
        if (!first) return;
        set({ queueIndex: 0, queueStartedAt: Date.now() });
        get().applyPreset(first);
      },

      stopQueue: () => set({ queueIndex: 0, queueStartedAt: null }),

      advanceQueue: () => {
        const { queueIds, queueIndex, presets } = get();
        const next = queueIndex + 1;
        if (next >= queueIds.length) {
          set({ queueIndex: 0, queueStartedAt: null });
          return;
        }
        const preset = findPresetById(queueIds[next], presets);
        set({ queueIndex: next, queueStartedAt: Date.now() });
        if (preset) get().applyPreset(preset);
      },

      resetAll: () =>
        set({
          layers: [],
          isPlaying: false,
          activePresetId: null,
          activePresetName: null,
          timerEndsAt: null,
          timerTotalSeconds: 0,
          favorites: [],
          presets: [],
          settings: DEFAULT_SETTINGS,
          queueIds: [],
          queueIndex: 0,
          queueStartedAt: null,
          // customSounds survive a settings reset on purpose: their
          // files are the user's own property on this device; deleting
          // them is a per-sound action in Settings.
        }),
    }),
    {
      name: 'rainhaven-state-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Deep-merge settings over the defaults on rehydration: state
      // written by an older build may lack newer settings fields, and
      // a missing masterVolume would otherwise turn every gain in the
      // engine into NaN. Layers and presets are sanitized so v1.0
      // shapes (no tone, no linger) load cleanly into v1.1.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<HavenState>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
          layers: Array.isArray(p.layers)
            ? p.layers.map((l) => sanitizeLayer(l as LayerState))
            : current.layers,
          presets: Array.isArray(p.presets)
            ? p.presets.map((pr) => sanitizePreset(pr as Preset))
            : current.presets,
          customSounds: Array.isArray(p.customSounds)
            ? p.customSounds
            : current.customSounds,
          queueIds: Array.isArray(p.queueIds) ? p.queueIds : current.queueIds,
          queueIndex: 0,
          queueStartedAt: null,
        };
      },
      partialize: (state) => ({
        layers: state.layers,
        activePresetId: state.activePresetId,
        activePresetName: state.activePresetName,
        favorites: state.favorites,
        presets: state.presets,
        settings: state.settings,
        customSounds: state.customSounds,
        queueIds: state.queueIds,
        queueMinutesPerScene: state.queueMinutesPerScene,
      }),
    },
  ),
);
