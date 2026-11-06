import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlossCard, WaveBars } from '../src/components/gloss';
import { MaxWidth } from '../src/components/MaxWidth';
import {
  Body,
  Caption,
  Display,
  GhostButton,
  SectionHeading,
} from '../src/components/ui';
import { PLUS_PRICES } from '../src/services/revenuecat';
import { colors, fonts, spacing } from '../src/theme';

// Dormant Plus screen. Lullhaven launches free and nothing can be
// purchased in v1; this screen exists so the shape of Plus is honest
// and ready: what it will cost, printed here, and what it will never
// gate. When Plus opens (after the business structure is cleared),
// prices come from RevenueCat offerings, not from constants.

const FREE_FOREVER = [
  'Overnight, lock-screen playback',
  'The full core sound pack',
  'The six-layer mixer and every volume',
  'Your saved mixes and scenes',
  'The sleep timer with fade-out',
  'Favourites',
];

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <MaxWidth>
        <ScrollView contentContainerStyle={styles.content}>
          <GlossCard variant="hero" style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Caption style={styles.heroLabel}>LULLHAVEN PLUS</Caption>
              <WaveBars playing={false} height={16} />
            </View>
            <Display style={styles.heading}>Lullhaven Plus</Display>
            <Body style={styles.intro}>
              Plus is not open yet. Lullhaven is free while it finds its
              first sleepers, and there is nothing to buy in this version.
            </Body>
          </GlossCard>

          <View style={styles.section}>
            <SectionHeading>Free forever, on purpose</SectionHeading>
            <GlossCard style={styles.listCard}>
              {FREE_FOREVER.map((item, i) => (
                <View
                  key={item}
                  style={[styles.freeRow, i > 0 && styles.freeRowDivider]}
                >
                  <View style={styles.checkOrb}>
                    <Ionicons name="checkmark" size={13} color={colors.teal} />
                  </View>
                  <Body style={styles.freeLabel}>{item}</Body>
                </View>
              ))}
            </GlossCard>
            <Caption style={styles.note}>
              A sleep app that stops working when a subscription lapses is
              a sleep app that wakes you up. The core never goes behind
              this screen.
            </Caption>
            <GlossCard style={styles.promiseCard}>
              <Body style={styles.promise}>
                The grandfathering promise: sounds and features that
                are free today stay free forever. Nothing already in
                your mixes ever re-locks, whatever Plus adds later.
              </Body>
            </GlossCard>
          </View>

          <View style={styles.section}>
            <SectionHeading>When Plus opens</SectionHeading>
            <GlossCard style={styles.priceCard}>
              <View style={styles.priceRow}>
                <View style={styles.priceBlock}>
                  <Display style={styles.price}>
                    ${PLUS_PRICES.lifetime.toFixed(2)}
                  </Display>
                  <Caption>once, yours forever</Caption>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceBlock}>
                  <Display style={styles.priceSm}>
                    ${PLUS_PRICES.annual.toFixed(2)}
                  </Display>
                  <Caption>a year, if you prefer</Caption>
                </View>
              </View>
              <Body style={styles.body}>
                Planned pricing, printed here so there are no surprises
                later. One payment is the way most sleepers choose to
                pay, so lifetime leads. Plus will add downloadable
                sound packs and a bedtime routine builder on top of the
                free app. No trial traps, no weekly billing, and the
                renewal terms will sit on this screen, not in fine
                print.
              </Body>
            </GlossCard>
          </View>

          <View style={styles.section}>
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
  heroCard: { padding: spacing.lg },
  heroTop: {
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
  heading: { fontSize: 34, lineHeight: 40, marginTop: spacing.sm },
  intro: { marginTop: spacing.sm, maxWidth: 340, fontSize: 16, lineHeight: 24 },
  section: { marginTop: 30 },
  listCard: { paddingHorizontal: spacing.md, paddingVertical: 6 },
  freeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
  },
  freeRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairlineSoft,
  },
  checkOrb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(62, 214, 197, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeLabel: { color: colors.ink, flex: 1 },
  note: { marginTop: spacing.md, maxWidth: 340 },
  promiseCard: { padding: spacing.md + 2, marginTop: spacing.md },
  promise: { color: colors.ink, maxWidth: 350 },
  priceSm: { fontSize: 22, lineHeight: 30, color: colors.inkSoft },
  priceCard: { padding: spacing.lg },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceBlock: { flex: 1, alignItems: 'center' },
  price: { fontSize: 30, lineHeight: 36, color: colors.amberLight },
  priceDivider: {
    width: StyleSheet.hairlineWidth,
    height: 44,
    backgroundColor: colors.hairline,
  },
  body: { maxWidth: 360 },
});
