import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlossCard } from '../src/components/gloss';
import { MaxWidth } from '../src/components/MaxWidth';
import {
  Body,
  Caption,
  Display,
  GhostButton,
  SectionHeading,
} from '../src/components/ui';
import { colors, spacing } from '../src/theme';

// Sound credits mirror assets/sounds/SOUND_REGISTER.md. The
// recordings are public domain or CC0 (no attribution required);
// credited here because the register keeps the record. The
// appliance sounds, the coloured noises, the heartbeat, womb,
// purr, campfire, train and cabin are generated for Lullhaven and
// are labelled generated wherever they appear.

const CREDITS: { sound: string; line: string }[] = [
  {
    sound: 'Rain, Soft rain, Morning rain',
    line: 'Recordings by ezwa via freesound.org, public domain / CC0. Source: Wikimedia Commons.',
  },
  {
    sound: 'Rain with thunder, Rain on a veranda',
    line: 'Recordings by ezwa via freesound.org, public domain / CC0. Source: Wikimedia Commons.',
  },
  {
    sound: 'Light rain',
    line: 'Recording by kvgarlic via freesound.org, CC0. Source: Wikimedia Commons.',
  },
  {
    sound: 'Thunderstorm, Summer thunderstorm, Distant thunder',
    line: 'Recordings by stephan via PDSounds, public domain. Source: Wikimedia Commons.',
  },
  {
    sound: 'Close thunderstorm',
    line: 'Recording by Matt DeNardo, dedicated to the public domain. Source: archive.org.',
  },
  {
    sound: 'Night storm (Milwaukee)',
    line: 'Recording by The Green Lama / john grzinich, Public Domain Mark 1.0. Source: radio aporee on archive.org.',
  },
  {
    sound: 'Ocean waves, Calm shore',
    line: 'Recording by Dsw4, released into the public domain. Source: Wikimedia Commons.',
  },
  {
    sound: 'Tropical beach, River rapids, Wild river, Waterfall, Mountain rapids',
    line: 'Recordings by Jarrod Stanley, CC0. Source: Wikimedia Commons.',
  },
  {
    sound: 'Pebble beach',
    line: 'Recording by earthcalling via freesound.org, public domain. Source: Wikimedia Commons.',
  },
  {
    sound: 'Mountain stream',
    line: 'Recording by DrTrumpet via freesound.org, CC0. Source: Wikimedia Commons.',
  },
  {
    sound: 'Gentle wind',
    line: 'Recording by Tvabutzku1234, CC0. Source: Wikimedia Commons.',
  },
  {
    sound: 'Night crickets',
    line: 'Recording by john grzinich, Public Domain Mark 1.0. Source: radio aporee on archive.org.',
  },
  {
    sound: 'Spring frogs',
    line: 'Recording by JohnDziak via freesound.org, CC0. Source: Wikimedia Commons.',
  },
  {
    sound: 'Fireplace',
    line: 'Recording by stephan via PDSounds, public domain. Source: Wikimedia Commons.',
  },
  {
    sound: 'Shower',
    line: 'Recording by Wilfredor, CC0. Source: Wikimedia Commons.',
  },
  {
    sound: 'White, pink, brown, green, blue, grey and violet noise',
    line: 'Generated mathematically in the project. No recording, no licence.',
  },
  {
    sound: 'Box fan, Table fan, Air conditioner, Hair dryer, Vacuum',
    line: 'Generated for Lullhaven: filtered noise with a slow, even wobble. No recording used.',
  },
  {
    sound: 'Airplane cabin, Train, Heartbeat, Womb, Cat purr, Campfire',
    line: 'Generated for Lullhaven. No recording used.',
  },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <MaxWidth>
        <ScrollView contentContainerStyle={styles.content}>
          <Display style={styles.heading}>About Lullhaven</Display>

          <GlossCard variant="hero" style={styles.card}>
            <Body style={styles.body}>
              Lullhaven plays sleep sounds through the night: long,
              seamless loops of rain, ocean, wind and room tone that keep
              playing with your screen locked, mixed the way you like
              them, with a timer that fades out instead of cutting off.
              There are no ads. There never will be.
            </Body>
          </GlossCard>

          <GlossCard style={styles.card}>
            <SectionHeading>The privacy promise</SectionHeading>
            <Body style={styles.body}>
              No account. No tracking. Lullhaven collects nothing. Your
              mixes, favourites and settings never leave this phone, and
              the sounds play from files stored on the device, so the app
              works fully offline, all night, in airplane mode.
            </Body>
          </GlossCard>

          <GlossCard style={styles.card}>
            <SectionHeading>Plainly stated</SectionHeading>
            <Body style={styles.body}>
              Lullhaven is a sound player. It is not a medical device and
              does not diagnose, treat, cure, or prevent any medical
              condition, including insomnia or any other sleep disorder.
              If you have ongoing trouble sleeping, talk to a healthcare
              professional.
            </Body>
          </GlossCard>

          <GlossCard style={styles.card}>
            <SectionHeading>Sound credits</SectionHeading>
            {CREDITS.map((credit, i) => (
              <View
                key={credit.sound}
                style={[styles.creditRow, i > 0 && styles.creditDivider]}
              >
                <Body style={styles.creditSound}>{credit.sound}</Body>
                <Caption style={styles.creditLine}>{credit.line}</Caption>
              </View>
            ))}
          </GlossCard>

          <View style={styles.backWrap}>
            <GhostButton label="Back" onPress={() => router.back()} />
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
    paddingBottom: spacing.xl + 16,
  },
  heading: { fontSize: 34, lineHeight: 40, marginBottom: spacing.lg },
  card: { padding: spacing.md + 2, marginBottom: 14 },
  body: { maxWidth: 360 },
  creditRow: { paddingVertical: 9 },
  creditDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairlineSoft,
  },
  creditSound: { color: colors.ink },
  creditLine: { marginTop: 2 },
  backWrap: { marginTop: spacing.sm },
});
