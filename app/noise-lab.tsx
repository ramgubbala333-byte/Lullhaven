import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlossCard, SegmentedPills } from '../src/components/gloss';
import { MaxWidth } from '../src/components/MaxWidth';
import { VolumeSlider } from '../src/components/VolumeSlider';
import {
  Body,
  Caption,
  Display,
  Hairline,
  PrimaryButton,
  SectionHeading,
} from '../src/components/ui';
import { NOISE_COLORS, type NoiseColor } from '../src/services/noiseGen';
import { generateNoiseLabSound } from '../src/services/userSounds';
import { colors, fonts, spacing } from '../src/theme';

// The Noise Lab: pick a colour of noise, roll its tone bright or
// deep, and Lullhaven generates a seamless loop on the phone. No
// file downloaded, nothing recorded, it is yours alone.

const DURATIONS = [60, 120] as const;

/** Display-only swatches; the colour definitions live in noiseGen. */
const SWATCHES: Record<NoiseColor, [string, string]> = {
  white: ['#D8D8DC', '#8E8E96'],
  pink: ['#E8A0B4', '#B45A78'],
  brown: ['#8A5A36', '#4A2E18'],
  green: ['#5FA86E', '#2C5C3A'],
  blue: ['#6EA8D8', '#2E5A8A'],
  grey: ['#9AA0A4', '#565C60'],
  violet: ['#A678D8', '#5C3494'],
};

export default function NoiseLabScreen() {
  const router = useRouter();
  const [colorId, setColorId] = React.useState<NoiseColor>('pink');
  /** 0 = deep, 1 = bright. noiseGen's tone runs the other way
   * (0 = full spectrum, 1 = softened), so it is inverted at the
   * call site. */
  const [brightness, setBrightness] = React.useState(0.5);
  const [durationSec, setDurationSec] = React.useState<(typeof DURATIONS)[number]>(60);
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const selected = NOISE_COLORS.find((c) => c.id === colorId) ?? NOISE_COLORS[1];

  const onGenerate = async () => {
    setBusy(true);
    setNotice(null);
    // Let the button state paint before the render blocks the thread.
    await new Promise((r) => setTimeout(r, 60));
    const result = await generateNoiseLabSound({
      color: colorId,
      colorLabel: selected.label,
      tone: 1 - brightness,
      seconds: durationSec,
    });
    setBusy(false);
    if (result.ok) {
      setNotice(
        `Made "${result.sound.title}". It is in Your sounds on the Sounds tab, ready to layer.`,
      );
    } else {
      setNotice(result.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <MaxWidth>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Back"
            style={styles.back}
          >
            <Body style={styles.backLabel}>‹ Back</Body>
          </TouchableOpacity>

          <Display style={styles.heading}>Noise lab</Display>
          <Body style={styles.intro}>
            Coloured noise is generated, which makes it perfectly
            seamless: the end meets the start with no seam at all. Make
            one that is exactly yours.
          </Body>

          <View style={styles.section}>
            <SectionHeading>Colour</SectionHeading>
            <View style={styles.swatchGrid}>
              {NOISE_COLORS.map((c) => {
                const on = c.id === colorId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setColorId(c.id)}
                    style={styles.swatchWrap}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <LinearGradient
                      colors={SWATCHES[c.id]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.swatch, on && styles.swatchOn]}
                    />
                    <Caption
                      style={[styles.swatchLabel, on && styles.swatchLabelOn]}
                    >
                      {c.label}
                    </Caption>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Caption style={styles.colorNote}>{selected.hint}.</Caption>
          </View>

          <View style={styles.section}>
            <SectionHeading>Tone</SectionHeading>
            <GlossCard style={styles.toneCard}>
              <View style={styles.toneRow}>
                <Caption style={styles.toneEnd}>Deep</Caption>
                <VolumeSlider value={brightness} onChange={setBrightness} />
                <Caption style={styles.toneEnd}>Bright</Caption>
              </View>
              <Caption>
                Rolls the top end off as it goes left. Deep is the
                nursery setting; bright carries over distance.
              </Caption>
            </GlossCard>
          </View>

          <View style={styles.section}>
            <SectionHeading>Loop length</SectionHeading>
            <SegmentedPills
              options={DURATIONS}
              value={durationSec}
              onPick={setDurationSec}
              labelFor={(v) => `${v} sec`}
            />
            <Caption style={styles.lengthNote}>
              Longer loops vary more; shorter ones are steadier. Both
              are seamless.
            </Caption>
          </View>

          <Hairline style={styles.hairline} />
          <PrimaryButton
            label={busy ? 'Generating…' : `Generate ${selected.label.toLowerCase()} noise`}
            onPress={onGenerate}
          />
          {notice && <Caption style={styles.notice}>{notice}</Caption>}
        </ScrollView>
      </MaxWidth>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  back: { paddingVertical: spacing.sm, alignSelf: 'flex-start' },
  backLabel: { fontFamily: fonts.bodyMedium, color: colors.teal, fontSize: 16 },
  heading: { fontSize: 38, lineHeight: 44 },
  intro: { marginTop: spacing.sm, maxWidth: 340 },
  section: { marginTop: 30 },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  swatchWrap: { alignItems: 'center', width: 62 },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(233, 228, 214, 0.18)',
  },
  swatchOn: {
    borderColor: colors.teal,
    borderWidth: 2,
  },
  swatchLabel: { marginTop: 5, fontSize: 12 },
  swatchLabelOn: { color: colors.teal, fontFamily: fonts.bodyMedium },
  colorNote: { marginTop: spacing.sm, maxWidth: 330 },
  toneCard: { padding: spacing.md },
  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toneEnd: { fontFamily: fonts.bodyMedium, color: colors.inkSoft, width: 42 },
  lengthNote: { marginTop: spacing.sm },
  hairline: { marginVertical: spacing.lg },
  notice: { marginTop: spacing.sm, color: colors.teal, maxWidth: 340 },
});
