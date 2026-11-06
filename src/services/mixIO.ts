import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SOUND_BY_ID } from '../lib/sounds';
import { findPresetById, sanitizeLayer, sanitizePreset, useStore } from '../store/useStore';
import type { LayerState, MixFileV1, Preset } from '../types';

// Mix sharing and backup, entirely on-device: a mix is a small JSON
// file (sound ids + volumes + tone + linger) that travels through
// the system share sheet and comes back through the Files picker.
// No server, no account, no community. Importing validates every
// field and refuses gracefully with a plain-language reason.

export type ImportResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function isKnownSound(id: unknown, customIds: Set<string>): id is string {
  return (
    typeof id === 'string' && (id in SOUND_BY_ID || customIds.has(id))
  );
}

function validateLayers(
  raw: unknown,
  customIds: Set<string>,
): LayerState[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const layers: LayerState[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const l = item as Partial<LayerState>;
    if (!isKnownSound(l.soundId, customIds)) return null;
    layers.push(sanitizeLayer(l as LayerState));
  }
  return layers.slice(0, 6);
}

export function parseMixFile(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, message: 'That file is not readable as a Lullhaven mix (it is not valid JSON).' };
  }
  const file = data as Partial<MixFileV1>;
  if (
    !file ||
    typeof file !== 'object' ||
    file.app !== 'lullhaven' ||
    file.version !== 1 ||
    (file.kind !== 'mix' && file.kind !== 'backup')
  ) {
    return { ok: false, message: 'That file is not a Lullhaven mix or backup from this version of the app.' };
  }

  const state = useStore.getState();
  const customIds = new Set(state.customSounds.map((s) => s.id));

  if (file.kind === 'mix') {
    const layers = validateLayers(file.layers, customIds);
    if (!layers) {
      return { ok: false, message: 'That mix names a sound this phone does not have, or its layers are malformed. Nothing was imported.' };
    }
    const name =
      typeof file.name === 'string' && file.name.trim()
        ? file.name.trim().slice(0, 60)
        : 'Imported mix';
    const preset: Preset = {
      id: `preset-import-${Date.now()}`,
      name,
      layers,
      createdAt: Date.now(),
    };
    state.addPreset(preset);
    return { ok: true, message: `Imported "${name}". It is waiting in Scenes.` };
  }

  // Backup: presets + favourites (settings stay personal to a phone;
  // user-sound files cannot travel inside JSON, so mixes that use
  // them are skipped with a note in the result).
  if (!Array.isArray(file.presets)) {
    return { ok: false, message: 'That backup has no scenes in it. Nothing was imported.' };
  }
  let imported = 0;
  let skipped = 0;
  for (const rawPreset of file.presets) {
    if (!rawPreset || typeof rawPreset !== 'object') { skipped++; continue; }
    const p = rawPreset as Partial<Preset>;
    const layers = validateLayers(p.layers, customIds);
    if (!layers || typeof p.name !== 'string') { skipped++; continue; }
    state.addPreset(
      sanitizePreset({
        id: `preset-import-${Date.now()}-${imported}`,
        name: p.name.slice(0, 60),
        layers,
        createdAt: Date.now(),
      }),
    );
    imported++;
  }
  if (Array.isArray(file.favorites)) {
    for (const fav of file.favorites) {
      if (isKnownSound(fav, customIds) && !state.favorites.includes(fav)) {
        state.toggleFavorite(fav);
      }
    }
  }
  if (imported === 0) {
    return { ok: false, message: 'None of the scenes in that backup could be imported (they may use sounds this phone does not have).' };
  }
  return {
    ok: true,
    message: `Imported ${imported} scene${imported === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} that use sounds this phone does not have` : ''}.`,
  };
}

async function shareJson(payload: MixFileV1, filename: string): Promise<boolean> {
  try {
    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Share Lullhaven mix',
      UTI: 'public.json',
    });
    return true;
  } catch {
    return false;
  }
}

export async function shareCurrentMix(): Promise<boolean> {
  const state = useStore.getState();
  if (state.layers.length === 0) return false;
  const payload: MixFileV1 = {
    app: 'lullhaven',
    kind: 'mix',
    version: 1,
    exportedAt: Date.now(),
    name: state.activePresetName ?? 'Shared mix',
    layers: state.layers.map((l) => sanitizeLayer(l)),
  };
  return shareJson(payload, 'lullhaven-mix.json');
}

export async function sharePreset(presetId: string): Promise<boolean> {
  const state = useStore.getState();
  const preset = findPresetById(presetId, state.presets);
  if (!preset) return false;
  const payload: MixFileV1 = {
    app: 'lullhaven',
    kind: 'mix',
    version: 1,
    exportedAt: Date.now(),
    name: preset.name,
    layers: preset.layers.map((l) => sanitizeLayer(l)),
  };
  return shareJson(
    payload,
    `lullhaven-${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`,
  );
}

export async function shareBackup(): Promise<boolean> {
  const state = useStore.getState();
  const payload: MixFileV1 = {
    app: 'lullhaven',
    kind: 'backup',
    version: 1,
    exportedAt: Date.now(),
    presets: state.presets.map((p) => sanitizePreset(p)),
    favorites: [...state.favorites],
  };
  return shareJson(payload, 'lullhaven-backup.json');
}

export async function importMixFromPicker(): Promise<ImportResult | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    const asset = result.assets[0];
    const text = await FileSystem.readAsStringAsync(asset.uri);
    return parseMixFile(text);
  } catch {
    return { ok: false, message: 'That file could not be read. Nothing was imported.' };
  }
}
