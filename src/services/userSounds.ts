import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useStore } from '../store/useStore';
import type { CustomSound } from '../types';
import {
  encodeWav,
  renderColoredNoise,
  uint8ToBase64,
  type NoiseColor,
} from './noiseGen';

// User sounds: imported recordings and Noise Lab generations. Both
// live as files under documentDirectory/lullhaven-sounds/ and are
// registered in the store as CustomSound entries the engine plays
// from file URIs, exactly like bundled sounds.

const SOUNDS_DIR = `${FileSystem.documentDirectory}lullhaven-sounds/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(SOUNDS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SOUNDS_DIR, { intermediates: true });
  }
}

function extensionOf(name: string): string {
  const match = /\.([A-Za-z0-9]+)(?:\?|$)/.exec(name);
  return match ? `.${match[1].toLowerCase()}` : '.audio';
}

/** Import one audio file from the system Files picker. Returns the
 * new sound, or a plain-language failure. */
export async function importUserSound(): Promise<
  { ok: true; sound: CustomSound } | { ok: false; message: string } | null
> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    await ensureDir();
    const id = `user-${Date.now()}`;
    const dest = `${SOUNDS_DIR}${id}${extensionOf(asset.name ?? 'sound')}`;
    await FileSystem.copyAsync({ from: asset.uri, to: dest });
    const title = (asset.name ?? 'My sound')
      .replace(/\.[A-Za-z0-9]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .slice(0, 48) || 'My sound';
    const sound: CustomSound = {
      id,
      title,
      note: 'Imported from your files. It loops like any other sound.',
      uri: dest,
      origin: 'import',
      createdAt: Date.now(),
    };
    useStore.getState().addCustomSound(sound);
    return { ok: true, sound };
  } catch {
    return { ok: false, message: 'That file could not be imported.' };
  }
}

/** Generate a coloured-noise loop on the device (Noise Lab) and
 * register it as a user sound. */
export async function generateNoiseLabSound(opts: {
  color: NoiseColor;
  colorLabel: string;
  tone: number;
  seconds: number;
}): Promise<{ ok: true; sound: CustomSound } | { ok: false; message: string }> {
  try {
    await ensureDir();
    const sampleRate = 22050;
    // Render off the current tick so the UI can breathe first; the
    // caller awaits a setTimeout(0) before invoking this.
    const samples = renderColoredNoise({
      color: opts.color,
      seconds: opts.seconds,
      sampleRate,
      tone: opts.tone,
    });
    const wav = encodeWav(samples, sampleRate);
    const id = `lab-${Date.now()}`;
    const dest = `${SOUNDS_DIR}${id}.wav`;
    await FileSystem.writeAsStringAsync(dest, uint8ToBase64(wav), {
      encoding: FileSystem.EncodingType.Base64,
    });
    const toneLabel = opts.tone <= 0.05 ? 'full tone' : opts.tone >= 0.95 ? 'very soft' : 'softened';
    const sound: CustomSound = {
      id,
      title: `${opts.colorLabel} noise, yours`,
      note: `Generated in the Noise Lab: ${opts.colorLabel.toLowerCase()} noise, ${toneLabel}, seamless by construction.`,
      uri: dest,
      origin: 'noise-lab',
      createdAt: Date.now(),
    };
    useStore.getState().addCustomSound(sound);
    return { ok: true, sound };
  } catch {
    return { ok: false, message: 'Generation failed on this device. Nothing was saved.' };
  }
}

/** Delete the file behind a user sound (store entry removal is the
 * store's deleteCustomSound; call both). */
export async function deleteUserSoundFile(sound: CustomSound): Promise<void> {
  try {
    await FileSystem.deleteAsync(sound.uri, { idempotent: true });
  } catch {
    // File already gone; the store entry removal proceeds anyway.
  }
}
