import { Platform } from 'react-native';

// Bedtime reminder: one gentle local notification a day at the
// user's chosen time. Opt-in, off by default, scheduled entirely on
// the device. No push server, no account, nothing leaves the phone.
//
// expo-notifications is loaded LAZILY, never at module scope. Its JS
// entry point eagerly imports expo-application, and on Expo Go the
// ExpoApplication native module is not there to answer
// (expo-notifications carries only partial Expo Go support since
// SDK 53), so a top-level import throws inside requireNativeModule
// while the route tree is still loading and takes the whole app
// down. Here the package is required on first use, inside try/catch,
// and only after probing for its native modules with
// requireOptionalNativeModule. Where the native side is absent
// (Expo Go) every function degrades to a graceful no-op and the
// Settings screen reports the reminder as unavailable; in a
// development or standalone build the native modules exist and the
// reminder works exactly as designed.

type NotificationsModule = typeof import('expo-notifications');

let cachedNotifications: NotificationsModule | null | undefined;

function loadNotifications(): NotificationsModule | null {
  if (cachedNotifications !== undefined) return cachedNotifications;
  cachedNotifications = null;
  if (Platform.OS === 'web') return null;
  try {
    const { requireOptionalNativeModule } =
      require('expo-modules-core') as typeof import('expo-modules-core');
    // Probe before requiring: evaluating expo-notifications evaluates
    // expo-application, which throws when its native module is
    // missing, so only pull the package in once both native sides
    // answer.
    if (!requireOptionalNativeModule('ExpoApplication')) return null;
    if (!requireOptionalNativeModule('ExpoNotifications')) return null;
    cachedNotifications =
      require('expo-notifications') as NotificationsModule;
  } catch {
    cachedNotifications = null;
  }
  return cachedNotifications;
}

/** True when this build can actually schedule the bedtime reminder. */
export function bedtimeReminderAvailable(): boolean {
  return loadNotifications() !== null;
}

const REMINDER_ID = 'lullhaven-bedtime-reminder';

export function parseReminderTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export async function syncBedtimeReminder(
  enabled: boolean,
  time: string,
): Promise<'scheduled' | 'cancelled' | 'denied' | 'unsupported'> {
  if (Platform.OS === 'web') return 'unsupported';
  const Notifications = loadNotifications();
  if (!Notifications) return 'unsupported';
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(
      () => {},
    );
    if (!enabled) return 'cancelled';
    const parsed = parseReminderTime(time);
    if (!parsed) return 'denied';
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return 'denied';
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_ID,
      content: {
        title: 'Time to wind down',
        body: 'Your sounds are ready. Start the mix, set the timer, and let the night do the rest.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: parsed.hour,
        minute: parsed.minute,
        repeats: true,
      },
    });
    return 'scheduled';
  } catch {
    return 'unsupported';
  }
}
