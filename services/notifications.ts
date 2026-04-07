import * as Notifications from 'expo-notifications';
import { AppSettings } from '../types';

const NOTIFICATION_ID = 'witness-checkin';

// Configure how notifications are presented when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permissions from the OS.
 * Returns true if granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedules a single check-in notification if the user hasn't recorded in 4+ days.
 * Fires at the time set in settings (default 22:30).
 * Only one pending notification at a time — cancels and reschedules on each call.
 */
export async function scheduleCheckInIfNeeded(
  lastEntryDate: Date | null,
  settings: Pick<AppSettings, 'notificationsEnabled' | 'notificationHour' | 'notificationMinute'>
): Promise<void> {
  if (!settings.notificationsEnabled) {
    await cancelCheckIn();
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Cancel any existing check-in notification
  await cancelCheckIn();

  if (!lastEntryDate) {
    // No entries yet — don't nag on first use
    return;
  }

  const daysSinceLast = Math.floor(
    (Date.now() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLast < 4) return;

  // Schedule for tonight at the user's configured time
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(settings.notificationHour, settings.notificationMinute, 0, 0);

  // If that time has already passed today, schedule for tomorrow
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: '',
      body: "You haven't spoken in a while. We're here.",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    },
  });
}

/**
 * Cancels any pending check-in notification.
 */
export async function cancelCheckIn(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
}
