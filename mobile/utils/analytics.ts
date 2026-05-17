import { Mixpanel } from 'mixpanel-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MIXPANEL_TOKEN = '7da9020d9537b75ac0595651281a8b99';
const USER_ID_KEY = 'kachingo_analytics_uid';

let mp: Mixpanel | null = null;

async function getOrCreateUserId(): Promise<string> {
  const stored = await AsyncStorage.getItem(USER_ID_KEY);
  if (stored) return stored;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await AsyncStorage.setItem(USER_ID_KEY, id);
  return id;
}

export async function initMixpanel(): Promise<void> {
  if (mp) return;
  const instance = new Mixpanel(MIXPANEL_TOKEN, /* trackAutomaticEvents */ false);
  await instance.init();
  instance.registerSuperProperties({ platform: Platform.OS });
  mp = instance;
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>,
): void {
  mp?.track(name, props);
}

export async function identifyUser(profile: {
  name?: string;
  plan?: string;
  currency?: string;
}): Promise<void> {
  if (!mp) return;
  const id = await getOrCreateUserId();
  mp.identify(id);
  mp.getPeople().set({
    $name: profile.name ?? 'User',
    plan: profile.plan ?? 'free',
    currency: profile.currency ?? 'USD',
  });
  mp.getPeople().setOnce({ first_seen: new Date().toISOString() });
}

export function resetAnalytics(): void {
  mp?.reset();
}
