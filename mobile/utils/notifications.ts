import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotifPrefs {
  weeklySummary: boolean;
  budgetAlerts: boolean;
  streakReminders: boolean;
  tips: boolean;
}

const STORAGE_KEY = 'kachingo_notif_prefs';

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
}
