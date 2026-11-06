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
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlossCard, SegmentedPills } from '../../src/components/gloss';
import { MaxWidth } from '../../src/components/MaxWidth';
import {
  Body,
  Caption,
  Display,
  Hairline,
  SectionHeading,
} from '../../src/components/ui';
import {
  bedtimeReminderAvailable,
  parseReminderTime,
  syncBedtimeReminder,
} from '../../src/services/notifications';
import { useStore } from '../../src/store/useStore';
import { colors, fonts, spacing } from '../../src/theme';
import { TAB_BAR_CLEARANCE } from './_layout';

const TIMER_DEFAULTS = [15, 30, 45, 60, 90] as const;
const FADE_OPTIONS = [
  { label: '30 sec', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '60 min', seconds: 3600 },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const customSounds = useStore((s) => s.customSounds);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const [confirmingReset, setConfirmingReset] = React.useState(false);
  const [reminderNote, setReminderNote] = React.useState<string | null>(null);
  // Probed once: false where this build has no notifications native
  // module (Expo Go), so the card says so up front instead of the
  // reminder silently never firing.
  const [reminderAvailable] = React.useState<boolean>(() =>
    bedtimeReminderAvailable(),
  );
  const [timeDraft, setTimeDraft] = React.useState(settings.bedtimeReminderTime);

  const onReset = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setTimeout(() => setConfirmingReset(false), 4000);
      return;
    }
    resetAll();
    setConfirmingReset(false);
  };

  const applyReminder = async (enabled: boolean, time: string) => {
    if (enabled && !parseReminderTime(time)) {
      setReminderNote('Use a 24-hour time like 22:00.');
      return;
    }
    updateSettings({
      bedtimeReminderEnabled: enabled,
      bedtimeReminderTime: time,
    });
    const result = await syncBedtimeReminder(enabled, time);
    setReminderNote(
      result === 'scheduled'
        ? `Set for ${time} every night. One gentle nudge, nothing more.`
        : result === 'cancelled'
          ? 'Reminder off.'
          : result === 'denied'
            ? 'Notifications are not allowed for Lullhaven, so the reminder cannot be set. You can allow them in your phone settings.'
            : 'Reminders are not available in this build.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <MaxWidth>
        <ScrollView contentContainerStyle={styles.content}>
          <Display style={styles.heading}>Settings</Display>

          <GlossCard style={styles.card}>
            <SectionHeading>Default sleep timer</SectionHeading>
            <SegmentedPills
              options={TIMER_DEFAULTS}
              value={settings.defaultTimerMinutes as (typeof TIMER_DEFAULTS)[number]}
              onPick={(v) => updateSettings({ defaultTimerMinutes: v })}
              labelFor={(v) => `${v}m`}
            />
            <Caption style={styles.note}>
              The length the Mix tab offers first when you arm the timer.
            </Caption>
          </GlossCard>

          <GlossCard style={styles.card}>
            <SectionHeading>Fade-out length</SectionHeading>
            <View style={styles.fadeWrap}>
              {FADE_OPTIONS.map((option) => {
                const selected = settings.fadeSeconds === option.seconds;
                return (
                  <TouchableOpacity
                    key={option.seconds}
                    onPress={() => updateSettings({ fadeSeconds: option.seconds })}
                    style={[styles.fadeChip, selected && styles.fadeChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Body style={[styles.fadeChipLabel, selected && styles.fadeChipLabelOn]}>
                      {option.label}
                    </Body>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Caption style={styles.note}>
              How long the sound takes to melt away at the end of the
              timer. Longer is gentler. The timer remembers your last
              length, always.
            </Caption>
          </GlossCard>

          <GlossCard style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <SectionHeading>Gentle start</SectionHeading>
                <Caption style={styles.toggleCaption}>
                  Sound fades in over a few seconds instead of starting
                  at full volume.
                </Caption>
              </View>
              <Switch
                value={settings.fadeInEnabled}
                onValueChange={(v) => updateSettings({ fadeInEnabled: v })}
                trackColor={{ false: 'rgba(233,228,214,0.15)', true: colors.tealDeep }}
                thumbColor={settings.fadeInEnabled ? colors.teal : colors.muted}
              />
            </View>
          </GlossCard>

          <GlossCard style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <SectionHeading>Bedtime reminder</SectionHeading>
                <Caption style={styles.toggleCaption}>
                  One quiet notification at the same time each night.
                  Off unless you turn it on; it never sends anything
                  anywhere.
                </Caption>
              </View>
              <Switch
                value={settings.bedtimeReminderEnabled}
                onValueChange={(v) => applyReminder(v, timeDraft)}
                trackColor={{ false: 'rgba(233,228,214,0.15)', true: colors.tealDeep }}
                thumbColor={settings.bedtimeReminderEnabled ? colors.teal : colors.muted}
              />
            </View>
            <View style={styles.timeRow}>
              <TextInput
                value={timeDraft}
                onChangeText={setTimeDraft}
                onBlur={() => {
                  if (settings.bedtimeReminderEnabled) {
                    applyReminder(true, timeDraft);
                  } else {
                    updateSettings({ bedtimeReminderTime: timeDraft });
                  }
                }}
                placeholder="22:00"
                placeholderTextColor={colors.faint}
                style={styles.timeInput}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                accessibilityLabel="Reminder time, 24 hour"
              />
              <Caption style={{ flex: 1 }}>
                24-hour time. The reminder follows this phone's clock.
              </Caption>
            </View>
            {reminderNote && <Caption style={styles.reminderNote}>{reminderNote}</Caption>}
            {!reminderAvailable && !reminderNote && (
              <Caption style={styles.reminderNote}>
                Reminders are not available in this build.
              </Caption>
            )}
          </GlossCard>

          <GlossCard style={styles.card}>
            <SectionHeading>Lullhaven</SectionHeading>
            <TouchableOpacity
              onPress={() => router.push('/paywall')}
              style={styles.linkRow}
              activeOpacity={0.7}
            >
              <View style={styles.linkOrb}>
                <Ionicons name="sparkles" size={17} color={colors.amberLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Body style={styles.linkTitle}>Lullhaven Plus</Body>
                <Caption>
                  Not open yet. Everything in the app today is free, and
                  stays free.
                </Caption>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.faint} />
            </TouchableOpacity>
            <Hairline style={styles.cardHairline} />
            <TouchableOpacity
              onPress={() => router.push('/about')}
              style={styles.linkRow}
              activeOpacity={0.7}
            >
              <View style={styles.linkOrb}>
                <Ionicons name="information" size={17} color={colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Body style={styles.linkTitle}>About and sound credits</Body>
                <Caption>
                  The privacy promise, plainly, and where every sound came
                  from.
                </Caption>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.faint} />
            </TouchableOpacity>
          </GlossCard>

          <GlossCard style={styles.card}>
            <SectionHeading>Your data</SectionHeading>
            <Caption style={styles.noteFirst}>
              Presets, favourites and settings live only on this phone.
              There is no account and nothing is uploaded. To keep a
              copy, use Back up all scenes in the Scenes tab; the file
              is yours. Your own imported and generated sounds (
              {customSounds.length} on this phone) are files in the
              app's storage and are managed from the Sounds tab.
            </Caption>
            <TouchableOpacity
              onPress={onReset}
              style={[
                styles.resetButton,
                confirmingReset && styles.resetButtonArmed,
              ]}
              activeOpacity={0.75}
            >
              <Body
                style={[
                  styles.resetLabel,
                  confirmingReset && styles.resetLabelArmed,
                ]}
              >
                {confirmingReset
                  ? 'Tap again to erase everything'
                  : 'Reset all data'}
              </Body>
            </TouchableOpacity>
          </GlossCard>

          <Caption style={styles.version}>Lullhaven 1.1.0</Caption>
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
  heading: { fontSize: 36, lineHeight: 42, marginBottom: spacing.lg },
  card: { padding: spacing.md + 2, marginBottom: 14 },
  note: { marginTop: spacing.md, maxWidth: 340 },
  noteFirst: { maxWidth: 340 },
  fadeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fadeChip: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(5, 16, 13, 0.45)',
  },
  fadeChipOn: {
    backgroundColor: colors.tealSoft,
    borderColor: 'rgba(62, 214, 197, 0.5)',
  },
  fadeChipLabel: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.muted },
  fadeChipLabelOn: { color: colors.teal },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleCaption: { marginTop: 4, maxWidth: 260 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    width: 92,
    textAlign: 'center',
    backgroundColor: 'rgba(5, 16, 13, 0.5)',
  },
  reminderNote: { marginTop: spacing.sm, color: colors.teal, maxWidth: 340 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.md,
  },
  linkOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(233, 228, 214, 0.07)',
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    fontFamily: fonts.display,
    fontSize: 17.5,
    color: colors.ink,
  },
  cardHairline: { marginVertical: 4, opacity: 0.6 },
  resetButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(5, 16, 13, 0.45)',
  },
  resetButtonArmed: { borderColor: colors.danger },
  resetLabel: { fontFamily: fonts.bodyMedium, color: colors.inkSoft },
  resetLabelArmed: { color: colors.danger },
  version: { marginTop: spacing.md, color: colors.faint, textAlign: 'center' },
});
