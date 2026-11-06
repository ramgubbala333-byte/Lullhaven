// Procedural audio generation for Lullhaven, pure TypeScript with
// no platform imports: the same code renders bundled generated
// sounds offline (via a Node runner) and powers the in-app Noise
// Lab, where a user's coloured-noise loop is generated on the
// device at runtime. A generated loop is seamless by construction:
// the last seconds are equal-power crossfaded into the head, the
// same treatment the recorded pack gets.
//
// Everything renders mono at 22050 Hz for the Noise Lab (small
// files, fast on-device math) and stereo 44100 Hz for bundled
// assets; the sample generators themselves are rate-agnostic.

export type NoiseColor =
  | 'white'
  | 'pink'
  | 'brown'
  | 'green'
  | 'blue'
  | 'grey'
  | 'violet';

export const NOISE_COLORS: { id: NoiseColor; label: string; hint: string }[] = [
  { id: 'white', label: 'White', hint: 'Bright, even hiss' },
  { id: 'pink', label: 'Pink', hint: 'Balanced, like steady rain' },
  { id: 'brown', label: 'Brown', hint: 'Deep rumble, like distant surf' },
  { id: 'green', label: 'Green', hint: 'Mid-focused, like wind in leaves' },
  { id: 'blue', label: 'Blue', hint: 'Crisp and airy, high hiss' },
  { id: 'grey', label: 'Grey', hint: 'Even to the ear at low volume' },
  { id: 'violet', label: 'Violet', hint: 'Thin, high shimmer' },
];

/** Deterministic PRNG so a generated file is reproducible. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function whiteBuffer(n: number, rand: () => number): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rand() * 2 - 1;
  return out;
}

/** Paul Kellet's pink-noise filter approximation. */
function pinkFromWhite(w: Float32Array): Float32Array {
  const out = new Float32Array(w.length);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < w.length; i++) {
    const x = w[i];
    b0 = 0.99886 * b0 + x * 0.0555179;
    b1 = 0.99332 * b1 + x * 0.0750759;
    b2 = 0.969 * b2 + x * 0.153852;
    b3 = 0.8665 * b3 + x * 0.3104856;
    b4 = 0.55 * b4 + x * 0.5329522;
    b5 = -0.7616 * b5 - x * 0.016898;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + x * 0.5362) * 0.11;
    b6 = x * 0.115926;
  }
  return out;
}

function brownFromWhite(w: Float32Array): Float32Array {
  const out = new Float32Array(w.length);
  let last = 0;
  for (let i = 0; i < w.length; i++) {
    last = (last + 0.02 * w[i]) / 1.02;
    out[i] = last * 3.5;
  }
  return out;
}

/** One-pole lowpass with the given cutoff in Hz. */
export function lowpass(x: Float32Array, sampleRate: number, cutoffHz: number): Float32Array {
  const out = new Float32Array(x.length);
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / sampleRate;
  const alpha = dt / (rc + dt);
  let last = 0;
  for (let i = 0; i < x.length; i++) {
    last = last + alpha * (x[i] - last);
    out[i] = last;
  }
  return out;
}

/** One-pole highpass. */
export function highpass(x: Float32Array, sampleRate: number, cutoffHz: number): Float32Array {
  const out = new Float32Array(x.length);
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / sampleRate;
  const alpha = rc / (rc + dt);
  let lastX = 0;
  let lastY = 0;
  for (let i = 0; i < x.length; i++) {
    lastY = alpha * (lastY + x[i] - lastX);
    lastX = x[i];
    out[i] = lastY;
  }
  return out;
}

function derivative(x: Float32Array): Float32Array {
  const out = new Float32Array(x.length);
  for (let i = 1; i < x.length; i++) out[i] = (x[i] - x[i - 1]) * 0.7;
  return out;
}

export function normalizeToRms(x: Float32Array, targetRmsDb = -21): Float32Array {
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i] * x[i];
  const rms = Math.sqrt(sum / x.length) || 1;
  const target = Math.pow(10, targetRmsDb / 20);
  let gain = target / rms;
  // Keep peaks under -1 dBFS.
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  if (peak * gain > 0.89) gain = 0.89 / peak;
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = x[i] * gain;
  return out;
}

/** Wrap the tail into the head with an equal-power crossfade so the
 * buffer loops with no seam. Returns a buffer of length n - fade. */
export function makeSeamless(x: Float32Array, fadeSamples: number): Float32Array {
  const n = x.length;
  if (fadeSamples <= 0 || fadeSamples >= n / 2) return x;
  const out = new Float32Array(n - fadeSamples);
  for (let i = 0; i < out.length; i++) out[i] = x[i];
  for (let i = 0; i < fadeSamples; i++) {
    const t = i / fadeSamples;
    const gOut = Math.cos((t * Math.PI) / 2);
    const gIn = Math.sin((t * Math.PI) / 2);
    out[i] = x[i] * gIn + x[n - fadeSamples + i] * gOut;
  }
  return out;
}

/** Render a coloured-noise buffer.
 * tone 0..1: 0 = full spectrum for the colour, 1 = softened hard
 * (a one-pole lowpass sweeps down) — the Noise Lab's Tone slider. */
export function renderColoredNoise(opts: {
  color: NoiseColor;
  seconds: number;
  sampleRate: number;
  tone?: number;
  seed?: number;
}): Float32Array {
  const { color, seconds, sampleRate } = opts;
  const tone = opts.tone ?? 0;
  const rand = mulberry32(opts.seed ?? 1234567);
  const n = Math.floor(seconds * sampleRate);
  const white = whiteBuffer(n, rand);
  let buf: Float32Array;
  switch (color) {
    case 'white':
      buf = white;
      break;
    case 'pink':
      buf = pinkFromWhite(white);
      break;
    case 'brown':
      buf = brownFromWhite(white);
      break;
    case 'green':
      // Mid-band emphasis: pink, band-limited to the leaf-rustle zone.
      buf = highpass(lowpass(pinkFromWhite(white), sampleRate, 1400), sampleRate, 250);
      break;
    case 'blue':
      buf = derivative(white);
      break;
    case 'violet':
      buf = derivative(derivative(white));
      break;
    case 'grey':
      // Approximation of equal-loudness noise: pink warmed below,
      // gently lifted above, overall the flattest to the ear.
      buf = lowpass(pinkFromWhite(white), sampleRate, 5200);
      break;
  }
  if (tone > 0) {
    const cutoff = 12000 * Math.pow(400 / 12000, tone);
    buf = lowpass(buf, sampleRate, cutoff);
  }
  buf = normalizeToRms(buf);
  return makeSeamless(buf, Math.min(Math.floor(sampleRate * 5), Math.floor(n / 4)));
}

// --- Appliance and character synthesis (bundled generated sounds) ---

function sine(freq: number, n: number, sampleRate: number, gain: number): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate) * gain;
  return out;
}

function addInto(target: Float32Array, src: Float32Array, gain = 1) {
  // Render helpers return buffers shortened by their seamless wrap,
  // so a composite render must never read past the source's end
  // (an out-of-bounds read is undefined and NaNs the whole mix).
  const n = Math.min(target.length, src.length);
  for (let i = 0; i < n; i++) target[i] += src[i] * gain;
}

/** A fan-family sound: filtered noise bed + mains hum + a slow,
 * loop-periodic blade wobble. `body` tunes the noise colour. */
export function renderFan(opts: {
  seconds: number;
  sampleRate: number;
  body: 'box' | 'desk' | 'ac' | 'dryer' | 'vacuum' | 'cabin';
  seed?: number;
}): Float32Array {
  const { seconds, sampleRate, body } = opts;
  const rand = mulberry32(opts.seed ?? 424242);
  const n = Math.floor(seconds * sampleRate);
  const white = whiteBuffer(n, rand);
  let bed: Float32Array;
  let humFreq = 60;
  let humGain = 0.06;
  switch (body) {
    case 'box':
      bed = lowpass(pinkFromWhite(white), sampleRate, 900);
      humFreq = 59;
      break;
    case 'desk':
      bed = lowpass(pinkFromWhite(white), sampleRate, 2400);
      humFreq = 120;
      humGain = 0.04;
      break;
    case 'ac':
      bed = lowpass(brownFromWhite(white), sampleRate, 700);
      humFreq = 60;
      humGain = 0.09;
      break;
    case 'dryer':
      // Band of fast air around 1-3 kHz plus a motor tone.
      bed = highpass(lowpass(white, sampleRate, 3200), sampleRate, 700);
      humFreq = 180;
      humGain = 0.035;
      break;
    case 'vacuum':
      bed = highpass(lowpass(white, sampleRate, 1800), sampleRate, 300);
      humFreq = 100;
      humGain = 0.05;
      break;
    case 'cabin':
      bed = lowpass(brownFromWhite(white), sampleRate, 500);
      humFreq = 80;
      humGain = 0.05;
      break;
  }
  const out = new Float32Array(n);
  addInto(out, bed, 1);
  addInto(out, sine(humFreq, n, sampleRate, humGain), 1);
  addInto(out, sine(humFreq * 2, n, sampleRate, humGain * 0.4), 1);
  // Slow wobble: an integer number of cycles per loop, so the loop
  // point carries the same wobble phase.
  const cycles = 6;
  for (let i = 0; i < n; i++) {
    const w = 1 + 0.05 * Math.sin((2 * Math.PI * cycles * i) / n);
    out[i] *= w;
  }
  return makeSeamless(normalizeToRms(out), Math.floor(sampleRate * 5));
}

/** A slow thump-thump heartbeat at ~52 bpm, for the Baby scenes. */
export function renderHeartbeat(opts: {
  seconds: number;
  sampleRate: number;
  seed?: number;
}): Float32Array {
  const { seconds, sampleRate } = opts;
  const n = Math.floor(seconds * sampleRate);
  const out = new Float32Array(n);
  const period = Math.floor(sampleRate * (60 / 52));
  const thump = (start: number, amp: number, freq: number) => {
    const len = Math.floor(sampleRate * 0.16);
    for (let i = 0; i < len && start + i < n; i++) {
      const env = Math.exp(-i / (sampleRate * 0.045));
      out[start + i] +=
        Math.sin((2 * Math.PI * freq * i) / sampleRate) * env * amp;
    }
  };
  for (let s = 0; s * period < n; s++) {
    thump(s * period, 0.8, 55);
    thump(s * period + Math.floor(sampleRate * 0.24), 0.5, 48);
  }
  // A whisper of low body underneath so it never feels clinical.
  const rand = mulberry32(opts.seed ?? 777);
  addInto(out, lowpass(brownFromWhite(whiteBuffer(n, rand)), sampleRate, 220), 0.25);
  return makeSeamless(normalizeToRms(out, -24), Math.floor(sampleRate * 2));
}

/** Womb ambience: low, muffled rhythm and wash, as heard from
 * inside. Labelled in the app as a generated approximation. */
export function renderWomb(opts: { seconds: number; sampleRate: number }): Float32Array {
  const { seconds, sampleRate } = opts;
  const n = Math.floor(seconds * sampleRate);
  const rand = mulberry32(31337);
  const wash = lowpass(brownFromWhite(whiteBuffer(n, rand)), sampleRate, 320);
  const beat = renderHeartbeat({ seconds, sampleRate, seed: 778 });
  const out = new Float32Array(n);
  addInto(out, wash, 0.8);
  addInto(out, beat, 0.65);
  return makeSeamless(normalizeToRms(out, -23), Math.floor(sampleRate * 3));
}

/** Cat purr: brown rumble amplitude-modulated at purr rate. */
export function renderPurr(opts: { seconds: number; sampleRate: number }): Float32Array {
  const { seconds, sampleRate } = opts;
  const n = Math.floor(seconds * sampleRate);
  const rand = mulberry32(90210);
  const base = lowpass(brownFromWhite(whiteBuffer(n, rand)), sampleRate, 300);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    // Purr pulses ~25 Hz, breathing in 4-second phrases.
    const pulse = 0.55 + 0.45 * Math.sin(2 * Math.PI * 25 * t);
    const breath = 0.8 + 0.2 * Math.sin((2 * Math.PI * t) / 4);
    out[i] = base[i] * pulse * breath;
  }
  addInto(out, sine(52, n, sampleRate, 0.05), 1);
  return makeSeamless(normalizeToRms(out, -23), Math.floor(sampleRate * 3));
}

/** Campfire crackle: soft brown bed + random woody pops. Generated,
 * and labelled as such; the pops are seeded so the loop is stable. */
export function renderCampfire(opts: { seconds: number; sampleRate: number }): Float32Array {
  const { seconds, sampleRate } = opts;
  const n = Math.floor(seconds * sampleRate);
  const rand = mulberry32(5150);
  const out = lowpass(brownFromWhite(whiteBuffer(n, rand)), sampleRate, 420);
  const pops = Math.floor(seconds * 7);
  for (let p = 0; p < pops; p++) {
    const start = Math.floor(rand() * (n - sampleRate));
    const amp = 0.25 + rand() * 0.65;
    const len = Math.floor(sampleRate * (0.01 + rand() * 0.05));
    const freq = 900 + rand() * 2400;
    for (let i = 0; i < len; i++) {
      const env = Math.exp(-i / (sampleRate * 0.008));
      out[start + i] += Math.sin((2 * Math.PI * freq * i) / sampleRate) * env * amp * (rand() > 0.5 ? 1 : 0.6);
    }
  }
  return makeSeamless(normalizeToRms(out, -22), Math.floor(sampleRate * 4));
}

/** Train ride: deep rumble with a soft, periodic rail rhythm. */
export function renderTrain(opts: { seconds: number; sampleRate: number }): Float32Array {
  const { seconds, sampleRate } = opts;
  const n = Math.floor(seconds * sampleRate);
  const rand = mulberry32(1212);
  const out = lowpass(brownFromWhite(whiteBuffer(n, rand)), sampleRate, 380);
  // Rail joints: a soft double-thud every ~1.4 s, integer count per
  // loop so the rhythm wraps cleanly.
  const beats = Math.max(1, Math.round(seconds / 1.4));
  const period = Math.floor(n / beats);
  for (let bIdx = 0; bIdx < beats; bIdx++) {
    for (const off of [0, Math.floor(sampleRate * 0.18)]) {
      const start = bIdx * period + off;
      const len = Math.floor(sampleRate * 0.09);
      for (let i = 0; i < len && start + i < n; i++) {
        const env = Math.exp(-i / (sampleRate * 0.03));
        out[start + i] += Math.sin((2 * Math.PI * 68 * i) / sampleRate) * env * 0.4;
      }
    }
  }
  return makeSeamless(normalizeToRms(out, -22), Math.floor(sampleRate * 4));
}

// --- WAV encoding (16-bit PCM) ---

export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + n * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(s * 32767), true);
  }
  return new Uint8Array(buffer);
}

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
