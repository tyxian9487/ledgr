import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { translations } from '../i18n/translations';
import type { TKey } from '../i18n/translations';
import type { Transaction, AutoDebitPeriod } from '../types';

export interface NotifPrefs {
  weeklySummary: boolean;
  budgetAlerts: boolean;
  streakReminders: boolean;
  tips: boolean;
  paymentReminders: boolean;
}

const STORAGE_KEY = 'kachingo_notif_prefs';
const FIRST_PROMPT_KEY = 'kachingo_notif_first_prompted';
const SCHEDULED_IDS_KEY = 'kachingo_notif_scheduled_ids';
const PAYMENT_REMINDER_IDS_KEY = 'kachingo_payment_reminder_ids';

export const DEFAULT_PREFS: NotifPrefs = {
  weeklySummary: true,
  budgetAlerts: true,
  streakReminders: true,
  tips: true,
  paymentReminders: true,
};

function advanceDate(d: Date, period: AutoDebitPeriod): Date {
  const next = new Date(d);
  if (period === 'daily') next.setDate(next.getDate() + 1);
  else if (period === 'weekly') next.setDate(next.getDate() + 7);
  else if (period === 'biweekly') next.setDate(next.getDate() + 14);
  else if (period === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (period === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

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

  const translate = t || ((key: string) => key);

  const ids: string[] = [];
  if (prefs.weeklySummary) {
    // Sunday night — type:'weekly' required by Expo SDK 55; weekday 1 = Sunday
    ids.push(await scheduleManagedNotification(
      {
        title: translate('notif.weekly_summary'),
        body: translate('notif.weekly_summary_body'),
      },
      { type: 'weekly', weekday: 1, hour: 21, minute: 0 },
    ));
  }
  if (prefs.streakReminders) {
    // Daily at 20:00
    ids.push(await scheduleManagedNotification(
      {
        title: translate('notif.streak_reminders'),
        body: translate('notif.streak_reminders_body'),
      },
      { type: 'daily', hour: 20, minute: 0 },
    ));
  }
  if (prefs.tips) {
    // One tip per day of week (7 tips rotating), each at 09:00.
    // type:'weekly' is required — the old { weekday, hour, repeats:true } format
    // lacks an explicit type, which Expo SDK 55 treats as invalid and falls back
    // to immediate delivery, causing all 7 to fire at once.
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
        { type: 'weekly', weekday: i + 1, hour: 9, minute: 0 },
      ));
    }
  }
  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}

/**
 * Fires a single immediate tip notification in the given language so the user
 * can preview what translated notifications look like without waiting for the
 * next scheduled slot.  Called only on explicit language change.
 */
export async function sendLanguagePreviewNotification(lang: string): Promise<void> {
  const granted = await requestNotificationPermissionIfNeeded();
  if (!granted) return;
  const Notifications = await getNotifications();
  const translate = await getTranslationFunction(lang);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: translate('notif.tips'),
      body:  translate('notif.tips_body_1'),
      sound: true,
    },
    trigger: null, // deliver immediately
  });
}

export async function schedulePaymentReminderNotifications(
  transactions: Transaction[],
  prefsOverride?: NotifPrefs,
): Promise<void> {
  try {
    const Notifications = await getNotifications();

    // Cancel previously scheduled payment reminders
    const rawIds = await AsyncStorage.getItem(PAYMENT_REMINDER_IDS_KEY);
    const existingIds: string[] = rawIds ? JSON.parse(rawIds) : [];
    await Promise.all(existingIds.map(id =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ));

    const prefs = prefsOverride ?? await loadNotifPrefs();
    if (!prefs.paymentReminders) {
      await AsyncStorage.removeItem(PAYMENT_REMINDER_IDS_KEY);
      return;
    }

    const granted = await requestNotificationPermissionIfNeeded();
    if (!granted) return;

    const t = await getTranslationFunction();
    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);

    const templates = transactions.filter(tx =>
      tx.isAutoDebit && tx.autoDebitPeriod && !tx.id.includes('_auto_'),
    );

    const newIds: string[] = [];
    for (const tmpl of templates) {
      const related = transactions.filter(tx =>
        tx.id === tmpl.id || tx.id.startsWith(`${tmpl.id}_auto_`),
      );
      const lastMs = Math.max(...related.map(tx => new Date(tx.date).getTime()));
      let next = advanceDate(new Date(lastMs), tmpl.autoDebitPeriod!);

      while (next <= horizon) {
        if (next > now) {
          const reminderDate = new Date(next);
          reminderDate.setDate(reminderDate.getDate() - 1);
          reminderDate.setHours(9, 0, 0, 0);

          if (reminderDate > now) {
            const name = tmpl.description || tmpl.category;
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: t('notif.payment_due_title' as TKey),
                body: `${name} ${t('notif.payment_due_body' as TKey)}`,
                sound: true,
              },
              trigger: {
                channelId: 'kachingo-default',
                date: reminderDate,
              } as any,
            });
            newIds.push(id);
          }
        }
        next = advanceDate(next, tmpl.autoDebitPeriod!);
      }
    }

    await AsyncStorage.setItem(PAYMENT_REMINDER_IDS_KEY, JSON.stringify(newIds));
  } catch { /* Non-critical */ }
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
