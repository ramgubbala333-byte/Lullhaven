import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GlossCard,
  PlayButton,
  SegmentedPills,
  WaveBars,
} from '../../src/components/gloss';
import { MaxWidth } from '../../src/components/MaxWidth';
import {
  Body,
  Caption,
  Display,
  GhostButton,
  SectionHeading,
} from '../../src/components/ui';
import { useSoundIndex } from '../../src/lib/sounds';
import {
  importMixFromPicker,
  shareBackup,
  sharePreset,
} from '../../src/services/mixIO';
import { BUILT_IN_PRESETS, useStore } from '../../src/store/useStore';
import { colors, fonts, radii, spacing } from '../../src/theme';
import type { Preset } from '../../src/types';
import { TAB_BAR_CLEARANCE } from './_layout';

// Presets are scenes, Hume-style: wide glossy cards, one per saved
// atmosphere, with the room it fills listed underneath and a single
// glossy disc to start or stop it. The scene that is playing lights
// up teal and breathes. Scenes can also be queued to play in
// sequence across the night, shared as small files, and backed up.

const QUEUE_MINUTES = [15, 30, 45, 60] as const;

export default function PresetsScreen() {
  const { byId } = useSoundIndex();
  const userPresets = useStore((s) => s.presets);
  const activePresetId = useStore((s) => s.activePresetId);
  const isPlaying = useStore((s) => s.isPlaying);
  const applyPreset = useStore((s) => s.applyPreset);
  const deletePreset = useStore((s) => s.deletePreset);
  const pause = useStore((s) => s.pause);
  const queueIds = useStore((s) => s.queueIds);
  const queueMinutesPerScene = useStore((s) => s.queueMinutesPerScene);
  const queueStartedAt = useStore((s) => s.queueStartedAt);
  const queueIndex = useStore((s) => s.queueIndex);
  const setQueue = useStore((s) => s.setQueue);
  const startQueue = useStore((s) => s.startQueue);
  const stopQueue = useStore((s) => s.stopQueue);

  const [notice, setNotice] = React.useState<string | null>(null);
  const queueRunning = queueStartedAt !== null;

  const flash = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4500);
  };

  const onShareScene = async (preset: Preset) => {
    const ok = await sharePreset(preset.id);
    if (ok) flash(`"${preset.name}" sent as a file. It opens in any Lullhaven.`);
  };

  const onImport = async () => {
    const result = await importMixFromPicker();
    if (result) flash(result.message);
  };

  const onBackup = async () => {
    const ok = await shareBackup();
    if (ok) flash('Backup sent. Keep it somewhere safe; it restores all your scenes and favourites.');
  };

  const toggleInQueue = (preset: Preset) => {
    if (queueRunning) return;
    const next = queueIds.includes(preset.id)
      ? queueIds.filter((id) => id !== preset.id)
      : [...queueIds, preset.id];
    setQueue(next, queueMinutesPerScene);
  };

  const renderScene = (preset: Preset, opts?: { queueable?: boolean }) => {
    const isActive = activePresetId === preset.id;
    const playing = isActive && isPlaying;
    const names = preset.layers
      .map((l) => byId[l.soundId]?.title ?? l.soundId)
      .join('  ·  ');
    const queuePos = queueIds.indexOf(preset.id);
    return (
      <Animated.View key={preset.id} entering={FadeIn.duration(250)}>
        <GlossCard
          variant={playing ? 'active' : 'card'}
          radius={26}
          style={styles.scene}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Body style={[styles.name, isActive && styles.nameActive]}>
                {preset.name}
              </Body>
              {playing && <WaveBars playing height={16} />}
            </View>
            <Caption style={styles.sceneSounds}>{names}</Caption>
            <Caption style={styles.sceneMeta}>
              {preset.layers.length} sound{preset.layers.length === 1 ? '' : 's'}
              {playing ? '  ·  playing now' : ''}
              {queuePos >= 0 ? `  ·  queue ${queuePos + 1}` : ''}
            </Caption>
            <View style={styles.sceneActions}>
              <TouchableOpacity
                onPress={() => onShareScene(preset)}
                hitSlop={8}
                style={styles.miniAction}
                accessibilityLabel={`Share ${preset.name}`}
              >
                <Ionicons name="share-outline" size={15} color={colors.muted} />
                <Caption style={styles.miniActionLabel}>Share</Caption>
              </TouchableOpacity>
              {opts?.queueable && (
                <TouchableOpacity
                  onPress={() => toggleInQueue(preset)}
                  hitSlop={8}
                  style={styles.miniAction}
                  accessibilityLabel={
                    queuePos >= 0
                      ? `Remove ${preset.name} from the queue`
                      : `Add ${preset.name} to the queue`
                  }
                >
                  <Ionicons
                    name={queuePos >= 0 ? 'list-circle' : 'list-outline'}
                    size={15}
                    color={queuePos >= 0 ? colors.teal : colors.muted}
                  />
                  <Caption
                    style={[
                      styles.miniActionLabel,
                      queuePos >= 0 && styles.miniActionLabelOn,
                    ]}
                  >
                    {queuePos >= 0 ? `Queued ${queuePos + 1}` : 'Queue'}
                  </Caption>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <PlayButton
            playing={playing}
            onPress={() => (playing ? pause() : applyPreset(preset))}
            size={50}
            iconSize={21}
          />
          {!preset.builtIn && (
            <TouchableOpacity
              onPress={() => deletePreset(preset.id)}
              hitSlop={10}
              style={styles.trash}
              accessibilityLabel={`Delete ${preset.name}`}
            >
              <Ionicons name="trash-outline" size={18} color={colors.faint} />
            </TouchableOpacity>
          )}
        </GlossCard>
      </Animated.View>
    );
  };

  const mainScenes = BUILT_IN_PRESETS.filter((p) => !p.collection);
  const babyScenes = BUILT_IN_PRESETS.filter((p) => p.collection === 'baby');
  const allScenes = [...BUILT_IN_PRESETS, ...userPresets];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MaxWidth>
        <ScrollView contentContainerStyle={styles.content}>
          <Display style={styles.heading}>Scenes</Display>
          <Body style={styles.intro}>
            A mix you love, started with one tap. No rebuilding it at
            midnight, half asleep.
          </Body>

          {notice && <Caption style={styles.notice}>{notice}</Caption>}

          <View style={styles.section}>
            <SectionHeading>From Lullhaven</SectionHeading>
            <View style={styles.stack}>
              {mainScenes.map((p) => renderScene(p, { queueable: true }))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeading>Baby</SectionHeading>
            <Caption style={styles.sectionIntro}>
              For the nursery: low, even sounds that mask the house.
              Not a separate mode, just scenes that work for small ears.
            </Caption>
            <View style={styles.stack}>
              {babyScenes.map((p) => renderScene(p, { queueable: true }))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeading>Your scenes</SectionHeading>
            {userPresets.length === 0 ? (
              <GlossCard style={styles.emptyCard}>
                <Caption style={styles.empty}>
                  Nothing saved yet. Build a mix in the Mix tab and tap
                  Save; it will wait for you here.
                </Caption>
              </GlossCard>
            ) : (
              <View style={styles.stack}>
                {userPresets.map((p) => renderScene(p, { queueable: true }))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeading>Night queue</SectionHeading>
            <GlossCard style={styles.queueCard}>
              <Body style={styles.queueText}>
                {queueIds.length === 0
                  ? 'Queue scenes with the Queue button on each card, and they will play one after another through the night.'
                  : queueIds
                      .map(
                        (id, i) =>
                          `${i + 1}. ${allScenes.find((p) => p.id === id)?.name ?? 'Scene'}`,
                      )
                      .join('   ')}
              </Body>
              <Caption style={styles.queueMeta}>
                Minutes per scene
              </Caption>
              <SegmentedPills
                options={QUEUE_MINUTES}
                value={queueMinutesPerScene as (typeof QUEUE_MINUTES)[number]}
                onPick={(v) => setQueue(queueIds, v)}
                labelFor={(v) => `${v} min`}
              />
              <View style={styles.queueButtons}>
                {queueRunning ? (
                  <>
                    <Body style={styles.queueRunning}>
                      Playing scene {queueIndex + 1} of {queueIds.length}
                    </Body>
                    <GhostButton label="Stop queue" onPress={stopQueue} />
                  </>
                ) : (
                  <GhostButton
                    label={
                      queueIds.length
                        ? `Play queue (${queueIds.length} scenes)`
                        : 'Play queue'
                    }
                    onPress={startQueue}
                  />
                )}
              </View>
            </GlossCard>
          </View>

          <View style={styles.section}>
            <SectionHeading>Move your scenes</SectionHeading>
            <GlossCard style={styles.queueCard}>
              <Body style={styles.queueText}>
                Mixes travel as small files, no account and no server.
                Send one to a partner's phone, or keep a full backup of
                everything you have saved.
              </Body>
              <View style={styles.queueButtons}>
                <GhostButton label="Import a mix file" onPress={onImport} />
                <GhostButton label="Back up all scenes" onPress={onBackup} />
              </View>
            </GlossCard>
          </View>
        </ScrollView>
      </MaxWidth>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  heading: { fontSize: 36, lineHeight: 42 },
  intro: { marginTop: spacing.sm, maxWidth: 340 },
  notice: { marginTop: spacing.md, color: colors.teal, maxWidth: 340 },
  section: { marginTop: 30 },
  sectionIntro: { marginBottom: spacing.md, maxWidth: 340 },
  stack: { gap: 12 },
  scene: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: spacing.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.inkSoft,
  },
  nameActive: { color: colors.ink },
  sceneSounds: { marginTop: 3 },
  sceneMeta: { marginTop: 2, color: colors.faint },
  sceneActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 9,
  },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miniActionLabel: { color: colors.muted, fontSize: 12.5 },
  miniActionLabelOn: { color: colors.teal },
  trash: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(233, 228, 214, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: { padding: spacing.md },
  empty: { maxWidth: 320 },
  queueCard: { padding: spacing.md + 2 },
  queueText: { maxWidth: 340, color: colors.inkSoft },
  queueMeta: { marginTop: spacing.md, marginBottom: spacing.sm },
  queueButtons: { marginTop: spacing.md, gap: spacing.sm },
  queueRunning: { color: colors.teal, fontFamily: fonts.bodyMedium },
});
