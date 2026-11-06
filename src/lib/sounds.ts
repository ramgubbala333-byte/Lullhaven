import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import type { CustomSound, SoundDef } from '../types';

// The catalogue: 44 sounds, every one license-clean and logged in
// assets/sounds/SOUND_REGISTER.md. Recordings are public domain or
// CC0 (checked on each file's own page, never from a search filter).
// The appliance and colour family is generated in-project with the
// code in src/services/noiseGen.ts and labelled as generated.
// Every file is loop-prepared (tail crossfaded into head) and the
// player crossfades again at the boundary, so there is no audible
// loop point. v1 shipped 10 sounds; v1.1 grew the library
// variants-first, the way the category's reviewers ask for them:
// more rains, more fans, more waters, more nights.
export const SOUNDS: SoundDef[] = [
  // --- Rain and storm -------------------------------------------------
  {
    id: 'rain',
    title: 'Rain',
    category: 'Rain and storm',
    note: 'Rain against a window, steady and close.',
    source: require('../../assets/sounds/rain.m4a'),
    licenseId: 'rain-cc0',
  },
  {
    id: 'soft-rain',
    title: 'Soft rain',
    category: 'Rain and storm',
    note: 'A light, even rainfall with nothing else in it.',
    source: require('../../assets/sounds/soft-rain.m4a'),
    licenseId: 'soft-rain-pd',
  },
  {
    id: 'light-rain',
    title: 'Light rain, distant thunder',
    category: 'Rain and storm',
    note: 'The quietest bed in the pack. Faint rain, thunder far away.',
    source: require('../../assets/sounds/light-rain.m4a'),
    licenseId: 'light-rain-cc0',
  },
  {
    id: 'rain-veranda',
    title: 'Rain on a veranda',
    category: 'Rain and storm',
    note: 'Rain on a roof and open air, recorded on a veranda.',
    source: require('../../assets/sounds/rain-veranda.m4a'),
    licenseId: 'rain-veranda-pd',
  },
  {
    id: 'rain-thunder',
    title: 'Rain and thunder',
    category: 'Rain and storm',
    note: 'Steady rain with thunder moving through it.',
    source: require('../../assets/sounds/rain-thunder.m4a'),
    licenseId: 'rain-thunder-pd',
  },
  {
    id: 'thunderstorm',
    title: 'Thunderstorm',
    category: 'Rain and storm',
    note: 'Rain with low, distant thunder rolling through.',
    source: require('../../assets/sounds/thunderstorm.m4a'),
    licenseId: 'thunderstorm-cc0',
  },
  {
    id: 'arlington-storm',
    title: 'Close thunderstorm',
    category: 'Rain and storm',
    note: 'A storm near overhead, recorded in Arlington, Virginia.',
    source: require('../../assets/sounds/arlington-storm.m4a'),
    licenseId: 'arlington-storm-pd',
  },
  {
    id: 'summer-thunderstorm',
    title: 'Summer thunderstorm',
    category: 'Rain and storm',
    note: 'Warm rain and rolling thunder after a hot day.',
    source: require('../../assets/sounds/summer-thunderstorm.m4a'),
    licenseId: 'summer-thunderstorm-pd',
  },
  {
    id: 'night-storm',
    title: 'Night storm',
    category: 'Rain and storm',
    note: 'A city storm at night, rain and far thunder.',
    source: require('../../assets/sounds/night-storm.m4a'),
    licenseId: 'night-storm-pdm',
  },
  {
    id: 'distant-thunder',
    title: 'Distant thunder',
    category: 'Rain and storm',
    note: 'Only the rumble, from a storm that never arrives.',
    source: require('../../assets/sounds/distant-thunder.m4a'),
    licenseId: 'distant-thunder-pd',
  },
  {
    id: 'morning-rain',
    title: 'Morning rain',
    category: 'Rain and storm',
    note: 'Rain with birds in it, and thunder far off. The birds are meant to be there.',
    source: require('../../assets/sounds/morning-rain.m4a'),
    licenseId: 'morning-rain-pd',
  },
  // --- Water ----------------------------------------------------------
  {
    id: 'ocean',
    title: 'Ocean waves',
    category: 'Water',
    note: 'Slow shore break, no gulls, no voices.',
    source: require('../../assets/sounds/ocean.m4a'),
    licenseId: 'ocean-cc0',
  },
  {
    id: 'tropical-beach',
    title: 'Tropical beach',
    category: 'Water',
    note: 'Warm, even surf on a tropical beach.',
    source: require('../../assets/sounds/tropical-beach.m4a'),
    licenseId: 'tropical-beach-cc0',
  },
  {
    id: 'calm-shore',
    title: 'Calm shore',
    category: 'Water',
    note: 'A second stretch of the Lake Ontario shore, gentler water.',
    source: require('../../assets/sounds/calm-shore.m4a'),
    licenseId: 'calm-shore-pd',
  },
  {
    id: 'pebble-beach',
    title: 'Pebble beach',
    category: 'Water',
    note: 'Small waves washing over pebbles, bright and close.',
    source: require('../../assets/sounds/pebble-beach.m4a'),
    licenseId: 'pebble-beach-pd',
  },
  {
    id: 'river-rapids',
    title: 'River rapids',
    category: 'Water',
    note: 'Fast water over rock on the James River.',
    source: require('../../assets/sounds/river-rapids.m4a'),
    licenseId: 'river-rapids-cc0',
  },
  {
    id: 'wild-river',
    title: 'Wild river',
    category: 'Water',
    note: 'Bigger, louder rapids. White water all the way.',
    source: require('../../assets/sounds/wild-river.m4a'),
    licenseId: 'wild-river-cc0',
  },
  {
    id: 'waterfall',
    title: 'Waterfall',
    category: 'Water',
    note: 'A broad fall of water, full and constant.',
    source: require('../../assets/sounds/waterfall.m4a'),
    licenseId: 'waterfall-cc0',
  },
  {
    id: 'mountain-rapids',
    title: 'Mountain rapids',
    category: 'Water',
    note: 'Cold rapids on the Sanna river, quick and bright.',
    source: require('../../assets/sounds/mountain-rapids.m4a'),
    licenseId: 'mountain-rapids-cc0',
  },
  {
    id: 'mountain-stream',
    title: 'Mountain stream',
    category: 'Water',
    note: 'A small Austrian brook, close to the microphone. A short loop.',
    source: require('../../assets/sounds/mountain-stream.m4a'),
    licenseId: 'mountain-stream-cc0',
  },
  // --- Air and noise --------------------------------------------------
  {
    id: 'fan',
    title: 'Fan',
    category: 'Air and noise',
    note: 'A steady fan hum, generated for a perfectly even loop.',
    source: require('../../assets/sounds/fan.m4a'),
    licenseId: 'fan-cc0',
  },
  {
    id: 'box-fan',
    title: 'Box fan',
    category: 'Air and noise',
    note: 'Low and full, the classic window box fan. Generated.',
    source: require('../../assets/sounds/box-fan.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'table-fan',
    title: 'Table fan',
    category: 'Air and noise',
    note: 'Smaller and brighter than the box fan. Generated.',
    source: require('../../assets/sounds/table-fan.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'wind',
    title: 'Gentle wind',
    category: 'Air and noise',
    note: 'Soft wind moving through open country, slow swells.',
    source: require('../../assets/sounds/wind.m4a'),
    licenseId: 'wind-cc0',
  },
  {
    id: 'white-noise',
    title: 'White noise',
    category: 'Air and noise',
    note: 'Generated signal. Bright, even hiss.',
    source: require('../../assets/sounds/white-noise.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'pink-noise',
    title: 'Pink noise',
    category: 'Air and noise',
    note: 'Generated signal. Softer and deeper than white.',
    source: require('../../assets/sounds/pink-noise.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'brown-noise',
    title: 'Brown noise',
    category: 'Air and noise',
    note: 'Generated signal. Low rumble, like distant surf.',
    source: require('../../assets/sounds/brown-noise.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'green-noise',
    title: 'Green noise',
    category: 'Air and noise',
    note: 'Generated signal. Mid-focused, like wind in leaves.',
    source: require('../../assets/sounds/green-noise.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'blue-noise',
    title: 'Blue noise',
    category: 'Air and noise',
    note: 'Generated signal. Crisp and airy, a high hiss.',
    source: require('../../assets/sounds/blue-noise.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'grey-noise',
    title: 'Grey noise',
    category: 'Air and noise',
    note: 'Generated signal. Even to the ear at low volume.',
    source: require('../../assets/sounds/grey-noise.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'violet-noise',
    title: 'Violet noise',
    category: 'Air and noise',
    note: 'Generated signal. Thin, high shimmer; the quietest colour.',
    source: require('../../assets/sounds/violet-noise.m4a'),
    licenseId: 'generated',
  },
  // --- Night ----------------------------------------------------------
  {
    id: 'crickets',
    title: 'Night crickets',
    category: 'Night',
    note: 'A warm night field, crickets only.',
    source: require('../../assets/sounds/crickets.m4a'),
    licenseId: 'crickets-cc0',
  },
  {
    id: 'spring-frogs',
    title: 'Spring frogs',
    category: 'Night',
    note: 'Spring peeper frogs calling on an April night.',
    source: require('../../assets/sounds/spring-frogs.m4a'),
    licenseId: 'spring-frogs-cc0',
  },
  {
    id: 'fireplace',
    title: 'Fireplace',
    category: 'Night',
    note: 'Low fire with a slow, random crackle.',
    source: require('../../assets/sounds/fireplace.m4a'),
    licenseId: 'fireplace-cc0',
  },
  {
    id: 'campfire',
    title: 'Campfire',
    category: 'Night',
    note: 'A generated fire: soft bed with woody pops and crackle.',
    source: require('../../assets/sounds/campfire.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'cat-purr',
    title: 'Cat purr',
    category: 'Night',
    note: 'A generated purr, low and rhythmic, breathing slowly.',
    source: require('../../assets/sounds/cat-purr.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'heartbeat',
    title: 'Heartbeat',
    category: 'Night',
    note: 'A slow, steady heartbeat at rest. Generated.',
    source: require('../../assets/sounds/heartbeat.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'womb',
    title: 'Womb',
    category: 'Night',
    note: 'Low wash and a muffled heartbeat, as if heard from inside. Generated.',
    source: require('../../assets/sounds/womb.m4a'),
    licenseId: 'generated',
  },
  // --- Home and travel ------------------------------------------------
  {
    id: 'air-conditioner',
    title: 'Air conditioner',
    category: 'Home and travel',
    note: 'Deep, even AC hum. Generated.',
    source: require('../../assets/sounds/air-conditioner.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'hair-dryer',
    title: 'Hair dryer',
    category: 'Home and travel',
    note: 'Fast warm air, the nursery classic. Generated.',
    source: require('../../assets/sounds/hair-dryer.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'vacuum',
    title: 'Vacuum cleaner',
    category: 'Home and travel',
    note: 'A steady vacuum drone that masks everything. Generated.',
    source: require('../../assets/sounds/vacuum.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'shower',
    title: 'Shower',
    category: 'Home and travel',
    note: 'A real shower recording, pipes and all.',
    source: require('../../assets/sounds/shower.m4a'),
    licenseId: 'shower-cc0',
  },
  {
    id: 'airplane-cabin',
    title: 'Airplane cabin',
    category: 'Home and travel',
    note: 'The low roar of a cabin at altitude. Generated.',
    source: require('../../assets/sounds/airplane-cabin.m4a'),
    licenseId: 'generated',
  },
  {
    id: 'train',
    title: 'Train ride',
    category: 'Home and travel',
    note: 'Deep rumble with a soft rail rhythm underneath. Generated.',
    source: require('../../assets/sounds/train.m4a'),
    licenseId: 'generated',
  },
];

export const SOUND_BY_ID: Record<string, SoundDef> = Object.fromEntries(
  SOUNDS.map((s) => [s.id, s]),
);

export const USER_CATEGORY = 'Your sounds';

export const CATEGORIES: string[] = [
  'Rain and storm',
  'Water',
  'Air and noise',
  'Night',
  'Home and travel',
  USER_CATEGORY,
];

export function soundDefFromCustom(sound: CustomSound): SoundDef {
  return {
    id: sound.id,
    title: sound.title,
    category: USER_CATEGORY,
    note: sound.note,
    source: { uri: sound.uri },
    licenseId: sound.origin === 'import' ? 'user-import' : 'user-generated',
    userMade: true,
  };
}

/** The live catalogue: bundled sounds plus this device's user
 * sounds, with a merged by-id index. Components read through this
 * hook so imported and generated sounds appear everywhere bundled
 * ones do. */
export function useSoundIndex(): {
  sounds: SoundDef[];
  byId: Record<string, SoundDef>;
  categories: string[];
} {
  const customSounds = useStore((s) => s.customSounds);
  return useMemo(() => {
    const userDefs = customSounds.map(soundDefFromCustom);
    const sounds = [...SOUNDS, ...userDefs];
    return {
      sounds,
      byId: Object.fromEntries(sounds.map((s) => [s.id, s])),
      categories: CATEGORIES.filter(
        (c) => c !== USER_CATEGORY || userDefs.length > 0,
      ),
    };
  }, [customSounds]);
}
