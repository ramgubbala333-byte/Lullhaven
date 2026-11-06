export type AudioSourceLike = number | { uri: string } | string;

export interface SoundDef {
  id: string;
  title: string;
  category: string;
  /** One quiet line describing the recording, shown under the title. */
  note: string;
  /** Bundled audio asset (require() result) or a file URI for user sounds. */
  source: AudioSourceLike;
  /** Register id in SOUND_REGISTER.md / assets/sounds. */
  licenseId: string;
  /** True for sounds the user brought or generated on this device. */
  userMade?: boolean;
}

/** A sound that lives in the app's document storage, not the bundle:
 * imported by the user or generated in the Noise Lab. Persisted in
 * the store; the file itself sits under documentDirectory. */
export interface CustomSound {
  id: string;
  title: string;
  note: string;
  /** file:// URI of the copied/generated audio file. */
  uri: string;
  /** Where it came from: a Files import or the Noise Lab. */
  origin: 'import' | 'noise-lab';
  createdAt: number;
}

/** Per-layer tone shaping (v1.1). Implemented on the player's
 * rate/pitch path: the coarse, client-only implementation the
 * category research prescribed. True multi-band EQ is native work
 * and stays on the roadmap. */
export interface LayerTone {
  /** 0..1 one-knob low-pass character ("Soften" in the UI). */
  soften: number;
  /** Pitch nudge in semitones, -6..+6. */
  pitch: number;
  /** Slow automatic volume swell (Rain Rain's Oscillator). */
  oscEnabled: boolean;
  /** Full swell cycle length in seconds. */
  oscPeriodSec: number;
  /** 0..1 how deep the swell dips. */
  oscDepth: number;
}

export const DEFAULT_TONE: LayerTone = {
  soften: 0,
  pitch: 0,
  oscEnabled: false,
  oscPeriodSec: 16,
  oscDepth: 0.45,
};

export interface LayerState {
  soundId: string;
  /** 0..1, this layer's own volume before master and fades. */
  volume: number;
  /** v1.1 tone shaping; absent in v1.0 state, filled by the merge. */
  tone?: LayerTone;
  /** Minutes this layer keeps playing after the sleep timer ends
   * (Slumber's Delayed Ending). 0 = ends with the mix. */
  lingerMinutes?: number;
}

export interface Preset {
  id: string;
  name: string;
  layers: LayerState[];
  builtIn?: boolean;
  /** Built-in grouping for collections like "Baby". */
  collection?: string;
  createdAt: number;
}

export interface HavenSettings {
  /** Minutes offered as the default when the timer is armed. */
  defaultTimerMinutes: number;
  /** Length of the gentle fade at the end of the timer, in seconds. */
  fadeSeconds: number;
  /** 0..1 master gain. */
  masterVolume: number;
  /** Bedtime reminder (local notification), off by default. */
  bedtimeReminderEnabled: boolean;
  /** "HH:MM" 24-hour, local time. */
  bedtimeReminderTime: string;
  /** Gentle start: ramp in over a few seconds when playback begins. */
  fadeInEnabled: boolean;
}

/** The mix backup / sharing format. Small, human-readable, and
 * versioned so future builds can refuse gracefully instead of
 * crashing on an unknown shape. */
export interface MixFileV1 {
  app: 'lullhaven';
  kind: 'mix' | 'backup';
  version: 1;
  exportedAt: number;
  name?: string;
  layers?: LayerState[];
  presets?: Preset[];
  favorites?: string[];
}
