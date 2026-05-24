import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { translations } from '../i18n/translations';
import type { TKey } from '../i18n/translations';

export interface NotifPrefs {
  weeklySummary: boolean;
  budgetAlerts: boolean;
  streakReminders: boolean;
  tips: boolean;
}

const STORAGE_KEY = 'kachingo_notif_prefs';
const FIRST_PROMPT_KEY = 'kachingo_notif_first_prompted';
const SCHEDULED_IDS_KEY = 'kachingo_notif_scheduled_ids';

export const DEFAULT_PREFS: NotifPrefs = {
  weeklySummary: true,
  budgetAlerts: true,
  streakReminders: true,
  tips: true,
};

export async function loadNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  const t = await getTranslationFunction();
  await syncNotificationSettings(prefs, t);
}

export async function getTranslationFunction(language?: string): Promise<(key: TKey) => string> {
  try {
    // Use provided language or try to get user profile with language preference from the main app storage
    let targetLanguage = language;
    if (!targetLanguage) {
      const raw = await AsyncStorage.getItem('kachingo_data') ?? await AsyncStorage.getItem('expensewise_data');
      const blob = raw ? JSON.parse(raw) : {};
      targetLanguage = blob.userProfile?.language || 'en';
    }
    const dict = translations[targetLanguage as keyof typeof translations] ?? translations.en;
    
    return (key: TKey) => {
      return (dict[key] ?? (translations.en as Record<TKey, string>)[key] ?? key) as string;
    };
  } catch {
    // Fallback to English if anything goes wrong
    const dict = translations.en;
    return (key: TKey) => (dict[key] ?? key) as string;
  }
}

async function getNotifications() {
  return import('expo-notifications');
}

export async function ensureNotificationChannel(): Promise<void> {
  const Notifications = await getNotifications();
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('kachingo-default', {
    name: 'Kachingo reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermissionIfNeeded(): Promise<boolean> {
  const Notifications = await getNotifications();
  await ensureNotificationChannel();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  if (existing.status !== 'undetermined' && !existing.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function requestInitialNotificationPermission(): Promise<void> {
  const alreadyPrompted = await AsyncStorage.getItem(FIRST_PROMPT_KEY);
  if (alreadyPrompted) return;
  await AsyncStorage.setItem(FIRST_PROMPT_KEY, '1');
  await requestNotificationPermissionIfNeeded();
}

async function cancelManagedNotifications(): Promise<void> {
  const Notifications = await getNotifications();
  const rawIds = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
  const ids: string[] = rawIds ? JSON.parse(rawIds) : [];
  await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
}

async function scheduleManagedNotification(
  content: { title: string; body: string },
  trigger: Record<string, unknown>,
): Promise<string> {
  const Notifications = await getNotifications();
  return Notifications.scheduleNotificationAsync({
    content: {
      ...content,
      sound: true,
    },
    trigger: {
      channelId: 'kachingo-default',
      ...trigger,
    } as any,
  });
}

export async function syncNotificationSettings(prefs: NotifPrefs, t?: (key: string) => string): Promise<void> {
  await cancelManagedNotifications();
  if (!Object.values(prefs).some(Boolean)) return;

  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return;

  // Fallback translation function if not provided
  const translate = t || ((key: string) => key);

  const ids: string[] = [];
  if (prefs.weeklySummary) {
    // Sunday night (weekday 1 = Sunday in Expo Calendar trigger)
    ids.push(await scheduleManagedNotification(
      {
        title: translate('notif.weekly_summary'),
        body: translate('notif.weekly_summary_body'),
      },
      { weekday: 1, hour: 21, minute: 0, repeats: true },
    ));
  }
  if (prefs.streakReminders) {
    // Daily at 20:00
    ids.push(await scheduleManagedNotification(
      {
        title: translate('notif.streak_reminders'),
        body: translate('notif.streak_reminders_body'),
      },
      { hour: 20, minute: 0, repeats: true },
    ));
  }
  if (prefs.tips) {
    // One tip per day of week (7 tips rotating), each at 09:00
    const tipTitle = translate('notif.tips');
    const tipBodies = [
      translate('notif.tips_body_1'),
      translate('notif.tips_body_2'),
      translate('notif.tips_body_3'),
      translate('notif.tips_body_4'),
      translate('notif.tips_body_5'),
      translate('notif.tips_body_6'),
      translate('notif.tips_body_7'),
    ];
    for (let i = 0; i < 7; i++) {
      ids.push(await scheduleManagedNotification(
        { title: tipTitle, body: tipBodies[i] },
        { weekday: i + 1, hour: 9, minute: 0, repeats: true },
      ));
    }
  }
  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}

export async function sendBudgetAlertOnce(key: string, title: string, body: string): Promise<void> {
  const prefs = await loadNotifPrefs();
  if (!prefs.budgetAlerts) return;
  const sentKey = `kachingo_budget_alert_${key}`;
  if (await AsyncStorage.getItem(sentKey)) return;

  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return;
  const Notifications = await getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
  await AsyncStorage.setItem(sentKey, '1');
}
