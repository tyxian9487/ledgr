import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  weeklySummary: false,
  budgetAlerts: false,
  streakReminders: false,
  tips: false,
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
  await syncNotificationSettings(prefs);
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

export async function syncNotificationSettings(prefs: NotifPrefs): Promise<void> {
  await cancelManagedNotifications();
  if (!Object.values(prefs).some(Boolean)) return;

  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return;

  const ids: string[] = [];
  if (prefs.weeklySummary) {
    ids.push(await scheduleManagedNotification(
      { title: 'Weekly summary', body: 'Review your spending and progress for the week.' },
      { weekday: 1, hour: 9, minute: 0, repeats: true },
    ));
  }
  if (prefs.streakReminders) {
    ids.push(await scheduleManagedNotification(
      { title: 'Keep your streak going', body: 'Log your spending and stay under budget this month.' },
      { hour: 20, minute: 0, repeats: true },
    ));
  }
  if (prefs.tips) {
    ids.push(await scheduleManagedNotification(
      { title: 'Money tip', body: 'Small consistent habits make the biggest difference.' },
      { weekday: 3, hour: 12, minute: 0, repeats: true },
    ));
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
