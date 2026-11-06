import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlossCard, PlayButton, WaveBars } from '../../src/components/gloss';
import { MaxWidth } from '../../src/components/MaxWidth';
import { VolumeSlider } from '../../src/components/VolumeSlider';
import {
  Body,
  Caption,
  Display,
  SectionHeading,
} from '../../src/components/ui';
import { useSoundIndex } from '../../src/lib/sounds';
import { importUserSound } from '../../src/services/userSounds';
import { MAX_LAYERS, useStore } from '../../src/store/useStore';
import { colors, fonts, radii, spacing } from '../../src/theme';
import { TAB_BAR_CLEARANCE } from './_layout';

// Sounds as Hume-style device tiles: a frosted icon orb, the name,
// and a clear on/off pill. A tile that is on lights up teal, glows,
// and its volume slider slides open underneath. Off tiles stay quiet.

const SOUND_ICONS: Record<string, { set: 'ion' | 'mci'; name: string }> = {
  rain: { set: 'ion', name: 'rainy' },
  'soft-rain': { set: 'mci', name: 'weather-rainy' },
  'light-rain': { set: 'mci', name: 'weather-rainy' },
  'rain-veranda': { set: 'ion', name: 'rainy' },
  'rain-thunder': { set: 'mci', name: 'weather-lightning-rainy' },
  thunderstorm: { set: 'ion', name: 'thunderstorm' },
  'arlington-storm': { set: 'mci', name: 'weather-pouring' },
  'summer-thunderstorm': { set: 'mci', name: 'weather-lightning-rainy' },
  'night-storm': { set: 'ion', name: 'cloudy-night' },
  'distant-thunder': { set: 'ion', name: 'thunderstorm' },
  'morning-rain': { set: 'mci', name: 'weather-pouring' },
  ocean: { set: 'ion', name: 'water' },
  'tropical-beach': { set: 'mci', name: 'waves' },
  'calm-shore': { set: 'mci', name: 'waves' },
  'pebble-beach': { set: 'mci', name: 'waves' },
  'river-rapids': { set: 'mci', name: 'waves-arrow-up' },
  'wild-river': { set: 'mci', name: 'waves-arrow-up' },
  waterfall: { set: 'mci', name: 'waterfall' },
  'mountain-rapids': { set: 'mci', name: 'waves' },
  'mountain-stream': { set: 'mci', name: 'waves' },
  fan: { set: 'mci', name: 'fan' },
  'box-fan': { set: 'mci', name: 'fan' },
  'table-fan': { set: 'mci', name: 'fan' },
  wind: { set: 'mci', name: 'weather-windy' },
  'white-noise': { set: 'mci', name: 'waveform' },
  'pink-noise': { set: 'mci', name: 'waveform' },
  'brown-noise': { set: 'mci', name: 'waveform' },
  'green-noise': { set: 'mci', name: 'waveform' },
  'blue-noise': { set: 'mci', name: 'waveform' },
  'grey-noise': { set: 'mci', name: 'waveform' },
  'violet-noise': { set: 'mci', name: 'waveform' },
  crickets: { set: 'mci', name: 'bug' },
  'spring-frogs': { set: 'ion', name: 'leaf' },
  fireplace: { set: 'ion', name: 'flame' },
  campfire: { set: 'mci', name: 'campfire' },
  'cat-purr': { set: 'mci', name: 'cat' },
  heartbeat: { set: 'mci', name: 'heart-pulse' },
  womb: { set: 'mci', name: 'baby-face' },
  'air-conditioner': { set: 'mci', name: 'air-conditioner' },
  'hair-dryer': { set: 'mci', name: 'hair-dryer' },
  vacuum: { set: 'mci', name: 'vacuum' },
  shower: { set: 'mci', name: 'shower-head' },
  'airplane-cabin': { set: 'mci', name: 'airplane' },
  train: { set: 'mci', name: 'train' },
};

function SoundGlyph({
  soundId,
  size,
  color,
}: {
  soundId: string;
  size: number;
  color: string;
}) {
  const icon = SOUND_ICONS[soundId] ?? { set: 'ion' as const, name: 'musical-note' };
  if (icon.set === 'mci') {
    return (
      <MaterialCommunityIcons
        name={icon.name as never}
        size={size}
        color={color}
      />
    );
  }
  return <Ionicons name={icon.name as never} size={size} color={color} />;
}

function formatRemaining(endsAt: number): string {
  const seconds = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function StatPill({
  icon,
  label,
  tinted,
}: {
  icon: React.ReactNode;
  label: string;
  tinted?: boolean;
}) {
  return (
    <View style={[styles.pill, tinted && styles.pillTinted]}>
      {icon}
      <Caption style={[styles.pillLabel, tinted && styles.pillLabelTinted]}>
        {label}
      </Caption>
    </View>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const { sounds, byId, categories } = useSoundIndex();
  const layers = useStore((s) => s.layers);
  const isPlaying = useStore((s) => s.isPlaying);
  const favorites = useStore((s) => s.favorites);
  const timerEndsAt = useStore((s) => s.timerEndsAt);
  const customSounds = useStore((s) => s.customSounds);
  const toggleSound = useStore((s) => s.toggleSound);
  const setLayerVolume = useStore((s) => s.setLayerVolume);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const deleteCustomSound = useStore((s) => s.deleteCustomSound);
  const pause = useStore((s) => s.pause);
  const play = useStore((s) => s.play);

  const activeIds = new Set(layers.map((l) => l.soundId));
  const mixFull = layers.length >= MAX_LAYERS;
  const [, forceTick] = React.useReducer((x: number) => x + 1, 0);
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!timerEndsAt) return;
    const handle = setInterval(forceTick, 1000);
    return () => clearInterval(handle);
  }, [timerEndsAt]);

  const onToggle = (soundId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleSound(soundId);
  };

  const onImport = async () => {
    const result = await importUserSound();
    if (!result) return;
    setNotice(
      result.ok
        ? `"${result.sound.title}" is in Your sounds, ready to layer.`
        : result.message,
    );
    setTimeout(() => setNotice(null), 4000);
  };

  const onDeleteUserSound = async (soundId: string) => {
    const entry = customSounds.find((s) => s.id === soundId);
    if (entry) {
      const { deleteUserSoundFile } = await import('../../src/services/userSounds');
      await deleteUserSoundFile(entry);
    }
    deleteCustomSound(soundId);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MaxWidth>
        <ScrollView contentContainerStyle={styles.content}>
          <Display style={styles.wordmark}>Lullhaven</Display>
          <Body style={styles.tagline}>
            Sleep sounds that play all night. No ads, no accounts, nothing
            to stop at 3 AM.
          </Body>

          <View style={styles.pillRow}>
            <StatPill
              icon={
                <Ionicons
                  name="layers"
                  size={13}
                  color={mixFull ? colors.amberLight : colors.teal}
                />
              }
              label={`${layers.length} of ${MAX_LAYERS} layers`}
              tinted={mixFull}
            />
            <StatPill
              icon={
                <Ionicons
                  name="timer-outline"
                  size={14}
                  color={timerEndsAt ? colors.teal : colors.muted}
                />
              }
              label={
                timerEndsAt
                  ? `Timer ${formatRemaining(timerEndsAt)}`
                  : 'No timer set'
              }
            />
            <StatPill
              icon={
                <Ionicons
                  name={favorites.length ? 'heart' : 'heart-outline'}
                  size={13}
                  color={favorites.length ? colors.accent : colors.muted}
                />
              }
              label={`${favorites.length} favourite${favorites.length === 1 ? '' : 's'}`}
            />
          </View>

          {mixFull && (
            <Caption style={styles.capNote}>
              All {MAX_LAYERS} layers are on. That is the whole room
              filled; tap a sound off to swap another in.
            </Caption>
          )}

          {notice && <Caption style={styles.notice}>{notice}</Caption>}

          {layers.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)}>
              <GlossCard variant="hero" style={styles.hero}>
                <View style={styles.heroTop}>
                  <Caption style={styles.heroLabel}>
                    {isPlaying ? 'NOW PLAYING' : 'PAUSED'}
                    {timerEndsAt
                      ? `  ·  TIMER ${formatRemaining(timerEndsAt)}`
                      : ''}
                  </Caption>
                  <WaveBars playing={isPlaying} />
                </View>
                <Body style={styles.heroNames}>
                  {layers
                    .map((l) => byId[l.soundId]?.title ?? l.soundId)
                    .join('  +  ')}
                </Body>
                <View style={styles.heroBottom}>
                  <PlayButton
                    playing={isPlaying}
                    onPress={isPlaying ? pause : play}
                    size={48}
                    iconSize={20}
                  />
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/mixer')}
                    style={styles.openMix}
                    activeOpacity={0.75}
                  >
                    <Body style={styles.openMixLabel}>Open mix</Body>
                    <Ionicons name="chevron-forward" size={15} color={colors.teal} />
                  </TouchableOpacity>
                </View>
              </GlossCard>
            </Animated.View>
          )}

          {favorites.length > 0 && (
            <View style={styles.section}>
              <SectionHeading>Favourites</SectionHeading>
              <View style={styles.tileStack}>
                {sounds.filter((s) => favorites.includes(s.id)).map((sound) =>
                  renderTile(sound.id),
                )}
              </View>
            </View>
          )}

          {categories.map((category) => (
            <View key={category} style={styles.section}>
              <SectionHeading>{category}</SectionHeading>
              <View style={styles.tileStack}>
                {sounds
                  .filter((s) => s.category === category)
                  .map((sound) => renderTile(sound.id))}
              </View>
              {category === 'Your sounds' && (
                <Caption style={styles.sectionNote}>
                  These live on this phone only. Deleting one removes
                  its file and takes it out of any mix using it.
                </Caption>
              )}
            </View>
          ))}

          <View style={styles.section}>
            <SectionHeading>Bring your own</SectionHeading>
            <GlossCard style={styles.actionCard}>
              <TouchableOpacity
                onPress={onImport}
                style={styles.actionRow}
                activeOpacity={0.75}
              >
                <View style={styles.orb}>
                  <Ionicons name="folder-open-outline" size={20} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body style={styles.actionTitle}>Import a sound</Body>
                  <Caption>
                    A recording of your own, from Files. It loops like
                    any other sound.
                  </Caption>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.faint} />
              </TouchableOpacity>
              <View style={styles.actionDivider} />
              <TouchableOpacity
                onPress={() => router.push('/noise-lab')}
                style={styles.actionRow}
                activeOpacity={0.75}
              >
                <View style={styles.orb}>
                  <MaterialCommunityIcons name="flask-outline" size={20} color={colors.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body style={styles.actionTitle}>Noise lab</Body>
                  <Caption>
                    Generate your own coloured noise, tuned by ear,
                    seamless by construction.
                  </Caption>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.faint} />
              </TouchableOpacity>
            </GlossCard>
          </View>

          <Caption style={styles.footer}>
            Tap a sound to add it to tonight's mix. Up to {MAX_LAYERS}{' '}
            sounds can play together, each at its own volume, all night.
          </Caption>
        </ScrollView>
      </MaxWidth>
    </SafeAreaView>
  );

  function renderTile(soundId: string) {
    const sound = byId[soundId];
    if (!sound) return null;
    const layer = layers.find((l) => l.soundId === soundId);
    const active = activeIds.has(soundId);
    const isFav = favorites.includes(soundId);
    const disabled = !active && mixFull;
    const mutedLayer = active && layer !== undefined && layer.volume <= 0.001;
    return (
      <Animated.View
        key={`${sound.category}-${sound.id}`}
        layout={LinearTransition.springify().damping(20).stiffness(220)}
      >
        <GlossCard
          variant={active ? 'active' : 'card'}
          radius={24}
          style={[styles.tile, disabled && styles.tileDisabled]}
        >
          <TouchableOpacity
            onPress={() => onToggle(soundId)}
            activeOpacity={0.75}
            disabled={disabled}
            style={styles.tileHead}
            accessibilityRole="switch"
            accessibilityState={{ checked: active, disabled }}
            accessibilityLabel={`${sound.title}, ${active ? 'in the mix' : 'not in the mix'}`}
          >
            <View style={[styles.orb, active && styles.orbActive]}>
              <SoundGlyph
                soundId={soundId}
                size={21}
                color={active ? colors.teal : colors.muted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Body style={[styles.tileTitle, active && styles.tileTitleActive]}>
                {sound.title}
              </Body>
              <Caption numberOfLines={2}>{sound.note}</Caption>
            </View>
            {sound.userMade ? (
              <TouchableOpacity
                onPress={() => onDeleteUserSound(soundId)}
                hitSlop={10}
                accessibilityLabel={`Delete ${sound.title}`}
                style={styles.heart}
              >
                <Ionicons name="trash-outline" size={18} color={colors.faint} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => toggleFavorite(soundId)}
                hitSlop={10}
                accessibilityLabel={isFav ? 'Remove favourite' : 'Save as favourite'}
                style={styles.heart}
              >
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={19}
                  color={isFav ? colors.accent : colors.faint}
                />
              </TouchableOpacity>
            )}
            <View style={[styles.statePill, active && styles.statePillOn]}>
              <Body style={[styles.statePillLabel, active && styles.statePillLabelOn]}>
                {active ? 'ON' : 'OFF'}
              </Body>
            </View>
          </TouchableOpacity>
          {active && layer && (
            <Animated.View
              entering={FadeIn.duration(220)}
              exiting={FadeOut.duration(140)}
              style={styles.tileSlider}
            >
              <Caption style={styles.tileSliderLabel}>Volume</Caption>
              <VolumeSlider
                value={layer.volume}
                onChange={(v) => setLayerVolume(soundId, v)}
              />
              <Caption
                style={[
                  styles.tileSliderValue,
                  mutedLayer && styles.tileSliderValueMuted,
                ]}
              >
                {mutedLayer ? 'Muted' : Math.round(layer.volume * 100)}
              </Caption>
            </Animated.View>
          )}
        </GlossCard>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  wordmark: { fontSize: 40, lineHeight: 44 },
  tagline: { marginTop: spacing.sm, maxWidth: 340 },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    borderRadius: radii.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  pillTinted: {
    borderColor: 'rgba(217, 147, 46, 0.45)',
    backgroundColor: colors.accentSoft,
  },
  pillLabel: { fontSize: 12, color: colors.muted },
  pillLabelTinted: { color: colors.amberLight },
  capNote: { marginTop: spacing.md, color: colors.amberLight, maxWidth: 340 },
  notice: { marginTop: spacing.md, color: colors.teal, maxWidth: 340 },
  hero: { marginTop: spacing.lg, padding: spacing.md + 4 },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontFamily: fonts.bodySemi,
    letterSpacing: 1.2,
    color: colors.teal,
    fontSize: 11,
  },
  heroNames: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
    marginTop: spacing.sm,
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  openMix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  openMixLabel: { color: colors.teal, fontFamily: fonts.bodyMedium, fontSize: 13.5 },
  section: { marginTop: 28 },
  sectionNote: { marginTop: spacing.sm, maxWidth: 340 },
  tileStack: { gap: 12 },
  tile: { paddingHorizontal: 16 },
  tileDisabled: { opacity: 0.42 },
  tileHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 15,
  },
  orb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(233, 228, 214, 0.06)',
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbActive: {
    backgroundColor: colors.tealSoft,
    borderColor: 'rgba(62, 214, 197, 0.45)',
    shadowColor: colors.teal,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  tileTitle: {
    fontFamily: fonts.display,
    fontSize: 19,
    color: colors.inkSoft,
  },
  tileTitleActive: { color: colors.ink },
  heart: { padding: 2 },
  statePill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 5,
    paddingHorizontal: 11,
    minWidth: 52,
    alignItems: 'center',
  },
  statePillOn: {
    backgroundColor: colors.tealSoft,
    borderColor: 'rgba(62, 214, 197, 0.5)',
  },
  statePillLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.faint,
  },
  statePillLabelOn: { color: colors.teal },
  tileSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: 13,
    paddingLeft: 59,
    paddingRight: 2,
  },
  tileSliderLabel: { width: 52 },
  tileSliderValue: { width: 34, textAlign: 'right' },
  tileSliderValueMuted: { color: colors.amberLight, fontFamily: fonts.bodyMedium },
  actionCard: { paddingHorizontal: 16, paddingVertical: 6 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairlineSoft,
    marginLeft: 59,
  },
  actionTitle: {
    fontFamily: fonts.display,
    fontSize: 17.5,
    color: colors.ink,
  },
  footer: { marginTop: spacing.xl, maxWidth: 340 },
});
