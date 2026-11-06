import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GlossCard,
  PlayButton,
  SegmentedPills,
  WaveBars,
} from '../../src/components/gloss';
import { MaxWidth } from '../../src/components/MaxWidth';
import { VolumeSlider } from '../../src/components/VolumeSlider';
import {
  Body,
  Caption,
  Display,
  GhostButton,
  PrimaryButton,
  SectionHeading,
} from '../../src/components/ui';
import { useSoundIndex } from '../../src/lib/sounds';
import { shareCurrentMix } from '../../src/services/mixIO';
import { MAX_LAYERS, useStore } from '../../src/store/useStore';
import { colors, fonts, radii, spacing } from '../../src/theme';
import { DEFAULT_TONE, type LayerState } from '../../src/types';
import { TAB_BAR_CLEARANCE } from './_layout';

// The Mix screen is the dashboard: one big now-playing scene card on
// top (Hume's room view shrunk to a single glowing panel), then the
// layers as device cards, the master volume, and the sleep timer as
// a segmented glass dock. Each layer card opens into tone controls:
// Soften, pitch, an oscillator swell, and a delayed ending.

const TIMER_OPTIONS = [15, 30, 45, 60, 90] as const;
const OSC_PERIODS = [8, 16, 32, 60] as const;
const LINGER_OPTIONS = [0, 15, 30, 60] as const;

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function formatUntil(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function MixerScreen() {
  const router = useRouter();
  const { byId } = useSoundIndex();
  const layers = useStore((s) => s.layers);
  const isPlaying = useStore((s) => s.isPlaying);
  const activePresetName = useStore((s) => s.activePresetName);
  const timerEndsAt = useStore((s) => s.timerEndsAt);
  const settings = useStore((s) => s.settings);
  const queueIds = useStore((s) => s.queueIds);
  const queueIndex = useStore((s) => s.queueIndex);
  const queueStartedAt = useStore((s) => s.queueStartedAt);
  const queueMinutesPerScene = useStore((s) => s.queueMinutesPerScene);
  const play = useStore((s) => s.play);
  const pause = useStore((s) => s.pause);
  const setLayerVolume = useStore((s) => s.setLayerVolume);
  const setLayerTone = useStore((s) => s.setLayerTone);
  const setLayerLinger = useStore((s) => s.setLayerLinger);
  const removeLayer = useStore((s) => s.removeLayer);
  const setMasterVolume = useStore((s) => s.setMasterVolume);
  const startTimer = useStore((s) => s.startTimer);
  const cancelTimer = useStore((s) => s.cancelTimer);
  const savePreset = useStore((s) => s.savePreset);

  const [mixName, setMixName] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const [shared, setShared] = React.useState(false);
  const [openToneFor, setOpenToneFor] = React.useState<string | null>(null);
  const [, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!timerEndsAt && queueStartedAt === null) return;
    const handle = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(handle);
  }, [timerEndsAt, queueStartedAt]);

  const remaining = timerEndsAt
    ? Math.max(0, (timerEndsAt - Date.now()) / 1000)
    : null;

  const maxLinger = layers.reduce(
    (acc, l) => Math.max(acc, l.lingerMinutes ?? 0),
    0,
  );
  const playingUntil = timerEndsAt
    ? timerEndsAt + maxLinger * 60_000
    : null;

  const queueRemaining =
    queueStartedAt !== null
      ? Math.max(
          0,
          queueMinutesPerScene * 60 -
            (Date.now() - queueStartedAt) / 1000,
        )
      : null;

  const onSave = () => {
    savePreset(mixName || 'My mix');
    setMixName('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const onShare = async () => {
    const ok = await shareCurrentMix();
    if (ok) {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const renderTonePanel = (layer: LayerState) => {
    const tone = layer.tone ?? DEFAULT_TONE;
    const linger = layer.lingerMinutes ?? 0;
    return (
      <View style={styles.tonePanel}>
        <View style={styles.toneRow}>
          <Caption style={styles.toneLabel}>Soften</Caption>
          <VolumeSlider
            value={tone.soften}
            onChange={(v) => setLayerTone(layer.soundId, { soften: v })}
          />
          <Caption style={styles.toneValue}>
            {Math.round(tone.soften * 100)}
          </Caption>
        </View>
        <Caption style={styles.toneHint}>
          Muffles the top end, like hearing it through a wall or deep water.
        </Caption>
        <View style={styles.toneRow}>
          <Caption style={styles.toneLabel}>Pitch</Caption>
          <VolumeSlider
            value={(tone.pitch + 6) / 12}
            onChange={(v) =>
              setLayerTone(layer.soundId, {
                pitch: Math.round(v * 12 - 6),
              })
            }
          />
          <Caption style={styles.toneValue}>
            {tone.pitch > 0 ? `+${tone.pitch}` : tone.pitch}
          </Caption>
        </View>
        <View style={styles.toneRowSpread}>
          <View style={{ flex: 1 }}>
            <Body style={styles.toneToggleLabel}>Oscillator</Body>
            <Caption>Swells the volume slowly, so the loop breathes.</Caption>
          </View>
          <Switch
            value={tone.oscEnabled}
            onValueChange={(v) =>
              setLayerTone(layer.soundId, { oscEnabled: v })
            }
            trackColor={{ false: 'rgba(233,228,214,0.15)', true: colors.tealDeep }}
            thumbColor={tone.oscEnabled ? colors.teal : colors.muted}
          />
        </View>
        {tone.oscEnabled && (
          <SegmentedPills
            options={OSC_PERIODS}
            value={
              OSC_PERIODS.includes(tone.oscPeriodSec as (typeof OSC_PERIODS)[number])
                ? (tone.oscPeriodSec as (typeof OSC_PERIODS)[number])
                : 16
            }
            onPick={(v) => setLayerTone(layer.soundId, { oscPeriodSec: v })}
            labelFor={(v) => `${v}s swell`}
          />
        )}
        <View style={styles.toneRowSpread}>
          <View style={{ flex: 1 }}>
            <Body style={styles.toneToggleLabel}>Delayed ending</Body>
            <Caption>
              When the timer ends the mix, this sound can stay a while longer.
            </Caption>
          </View>
        </View>
        <SegmentedPills
          options={LINGER_OPTIONS}
          value={linger as (typeof LINGER_OPTIONS)[number]}
          onPick={(v) => setLayerLinger(layer.soundId, v)}
          labelFor={(v) => (v === 0 ? 'With mix' : `+${v} min`)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MaxWidth>
        <ScrollView contentContainerStyle={styles.content}>
          {layers.length === 0 ? (
            <>
              <Display style={styles.heading}>Now playing</Display>
              <GlossCard style={styles.emptyCard}>
                <Body style={styles.emptyText}>
                  Nothing is playing yet. Pick a sound and it starts here,
                  layered, at your volumes, for as long as the night lasts.
                </Body>
                <PrimaryButton
                  label="Choose sounds"
                  onPress={() => router.push('/(tabs)')}
                />
              </GlossCard>
            </>
          ) : (
            <>
              <Animated.View entering={FadeIn.duration(300)}>
                <GlossCard variant="hero" style={styles.heroCard}>
                  <View style={styles.heroTopRow}>
                    <Caption style={styles.heroLabel}>
                      {activePresetName ? 'SCENE' : 'NOW PLAYING'}
                    </Caption>
                    <WaveBars playing={isPlaying} />
                  </View>
                  <Display style={styles.heroTitle}>
                    {activePresetName ?? 'Your mix'}
                  </Display>
                  <Caption style={styles.heroSub}>
                    {layers.length} of {MAX_LAYERS} layers · playback
                    continues with the screen locked
                  </Caption>
                  <View style={styles.heroTransport}>
                    <PlayButton
                      playing={isPlaying}
                      onPress={isPlaying ? pause : play}
                      size={72}
                      iconSize={30}
                    />
                    <View style={{ flex: 1 }}>
                      <Body style={styles.heroState}>
                        {isPlaying ? 'Playing' : 'Paused'}
                      </Body>
                      {remaining !== null && playingUntil ? (
                        <>
                          <Body style={styles.heroCountdown}>
                            {formatClock(remaining)} left
                          </Body>
                          <Caption>
                            Playing until {formatUntil(playingUntil)}
                          </Caption>
                        </>
                      ) : (
                        <Caption>Plays until morning, or set a timer below.</Caption>
                      )}
                      {queueStartedAt !== null && queueRemaining !== null && (
                        <Caption style={styles.queueLine}>
                          Queue · scene {queueIndex + 1} of {queueIds.length}
                          {'  ·  next in '}
                          {formatClock(queueRemaining)}
                        </Caption>
                      )}
                    </View>
                  </View>
                </GlossCard>
              </Animated.View>

              <View style={styles.section}>
                <SectionHeading>The mix</SectionHeading>
                <View style={styles.cardStack}>
                  {layers.map((layer) => {
                    const sound = byId[layer.soundId];
                    if (!sound) return null;
                    const muted = layer.volume <= 0.001;
                    const toneOpen = openToneFor === layer.soundId;
                    const tone = layer.tone ?? DEFAULT_TONE;
                    const toneActive =
                      tone.soften > 0.01 ||
                      tone.pitch !== 0 ||
                      tone.oscEnabled ||
                      (layer.lingerMinutes ?? 0) > 0;
                    return (
                      <Animated.View
                        key={layer.soundId}
                        layout={LinearTransition.springify()
                          .damping(20)
                          .stiffness(220)}
                      >
                        <GlossCard variant="active" radius={24} style={styles.layerCard}>
                          <View style={styles.layerHead}>
                            <Body style={styles.layerTitle}>{sound.title}</Body>
                            {muted && (
                              <View style={styles.mutedPill}>
                                <Body style={styles.mutedPillLabel}>MUTED</Body>
                              </View>
                            )}
                            <View style={{ flex: 1 }} />
                            <Caption style={styles.layerValue}>
                              {Math.round(layer.volume * 100)}
                            </Caption>
                            <TouchableOpacity
                              onPress={() =>
                                setOpenToneFor(toneOpen ? null : layer.soundId)
                              }
                              hitSlop={10}
                              accessibilityLabel={`Tone controls for ${sound.title}`}
                              style={[
                                styles.removeButton,
                                (toneOpen || toneActive) && styles.toneButtonOn,
                              ]}
                            >
                              <Ionicons
                                name="options-outline"
                                size={15}
                                color={toneOpen || toneActive ? colors.teal : colors.muted}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => removeLayer(layer.soundId)}
                              hitSlop={10}
                              accessibilityLabel={`Remove ${sound.title}`}
                              style={styles.removeButton}
                            >
                              <Ionicons
                                name="close"
                                size={16}
                                color={colors.muted}
                              />
                            </TouchableOpacity>
                          </View>
                          <VolumeSlider
                            value={layer.volume}
                            onChange={(v) => setLayerVolume(layer.soundId, v)}
                          />
                          {toneOpen && renderTonePanel(layer)}
                        </GlossCard>
                      </Animated.View>
                    );
                  })}
                </View>

                <GlossCard style={styles.masterCard}>
                  <View style={styles.layerHead}>
                    <Body style={styles.masterLabel}>Master volume</Body>
                    <View style={{ flex: 1 }} />
                    <Caption style={styles.layerValue}>
                      {Math.round(settings.masterVolume * 100)}
                    </Caption>
                  </View>
                  <VolumeSlider
                    value={settings.masterVolume}
                    onChange={setMasterVolume}
                  />
                </GlossCard>
              </View>

              <View style={styles.section}>
                <SectionHeading>Sleep timer</SectionHeading>
                {remaining !== null ? (
                  <GlossCard style={styles.timerCard}>
                    <Display style={styles.countdown}>
                      {formatClock(remaining)}
                    </Display>
                    <Caption style={styles.timerNote}>
                      {maxLinger > 0 && timerEndsAt
                        ? `The mix ends at ${formatUntil(timerEndsAt)}; the last lingering sound plays until ${formatUntil(
                            timerEndsAt + maxLinger * 60_000,
                          )}. `
                        : ''}
                      The sound fades gently over the last{' '}
                      {settings.fadeSeconds >= 60
                        ? `${Math.round(settings.fadeSeconds / 60)} minute${
                            settings.fadeSeconds === 60 ? '' : 's'
                          }`
                        : `${settings.fadeSeconds} seconds`}
                      . It never cuts off.
                    </Caption>
                    <View style={{ marginTop: spacing.md }}>
                      <GhostButton label="Cancel timer" onPress={cancelTimer} />
                    </View>
                  </GlossCard>
                ) : (
                  <View>
                    <SegmentedPills
                      options={TIMER_OPTIONS}
                      value={settings.defaultTimerMinutes as (typeof TIMER_OPTIONS)[number]}
                      onPick={(m) => startTimer(m)}
                      labelFor={(m) => `${m} min`}
                    />
                    <Caption style={styles.timerHint}>
                      Tap a length to start the timer tonight. Your default
                      ({settings.defaultTimerMinutes} min) is set in Settings.
                    </Caption>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <SectionHeading>Keep this mix</SectionHeading>
                <GlossCard style={styles.saveCard}>
                  <View style={styles.saveRow}>
                    <TextInput
                      value={mixName}
                      onChangeText={setMixName}
                      placeholder="Name it, e.g. Storm over the cabin"
                      placeholderTextColor={colors.faint}
                      style={styles.input}
                    />
                    <PrimaryButton label="Save" onPress={onSave} />
                  </View>
                  {saved && (
                    <Caption style={styles.savedNote}>
                      Saved. It is waiting in Scenes, one tap to play.
                    </Caption>
                  )}
                  <View style={styles.shareRow}>
                    <GhostButton label="Share this mix" onPress={onShare} />
                    {shared && (
                      <Caption style={styles.savedNote}>
                        Sent as a small file. It opens in any Lullhaven.
                      </Caption>
                    )}
                  </View>
                </GlossCard>
              </View>
            </>
          )}
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
  emptyCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  emptyText: { fontSize: 16, lineHeight: 24 },
  heroCard: { padding: spacing.lg },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    fontFamily: fonts.bodySemi,
    letterSpacing: 1.4,
    color: colors.teal,
    fontSize: 11,
  },
  heroTitle: { fontSize: 32, lineHeight: 38, marginTop: spacing.sm },
  heroSub: { marginTop: 4 },
  heroTransport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md + 2,
    marginTop: spacing.lg,
  },
  heroState: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.ink,
  },
  heroCountdown: {
    fontFamily: fonts.bodyMedium,
    color: colors.teal,
    marginTop: 2,
  },
  queueLine: { marginTop: 4, color: colors.amberLight },
  section: { marginTop: 30 },
  cardStack: { gap: 12 },
  layerCard: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  layerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  layerTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  mutedPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  mutedPillLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: colors.amberLight,
  },
  layerValue: { width: 30, textAlign: 'right', fontFamily: fonts.bodyMedium, color: colors.ink },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(233, 228, 214, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneButtonOn: {
    backgroundColor: colors.tealSoft,
  },
  tonePanel: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairlineSoft,
    gap: 10,
    paddingBottom: 6,
  },
  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toneLabel: { width: 52, fontFamily: fonts.bodyMedium, color: colors.inkSoft },
  toneValue: { width: 30, textAlign: 'right' },
  toneHint: { marginTop: -4, maxWidth: 320 },
  toneRowSpread: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toneToggleLabel: { fontFamily: fonts.bodyMedium, color: colors.ink, fontSize: 15 },
  masterCard: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  masterLabel: { fontFamily: fonts.bodyMedium, color: colors.inkSoft, fontSize: 15.5 },
  timerCard: { padding: spacing.lg },
  countdown: { fontSize: 48, lineHeight: 54 },
  timerNote: { marginTop: spacing.sm, maxWidth: 340 },
  timerHint: { marginTop: spacing.sm, maxWidth: 340 },
  saveCard: { padding: spacing.md },
  saveRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  shareRow: { marginTop: spacing.md, gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 14.5,
    backgroundColor: 'rgba(5, 16, 13, 0.5)',
  },
  savedNote: { marginTop: spacing.sm, color: colors.teal },
});
