import type { Mixpanel } from 'mixpanel-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Lazy load — mixpanel-react-native lacks codegenConfig and may fail to
// initialize on New Architecture Android. Wrapping in try-catch prevents
// a fatal crash; analytics simply becomes a no-op on affected devices.
let MixpanelClass: (new (token: string, trackAutoEvents: boolean) => Mixpanel) | null = null;
try {
  MixpanelClass = require('mixpanel-react-native').Mixpanel;
} catch (e) {
  console.warn('[Analytics] mixpanel-react-native failed to load:', e);
}

const MIXPANEL_TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';
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
  if (!MIXPANEL_TOKEN || mp || !MixpanelClass) return;
  const instance = new MixpanelClass(MIXPANEL_TOKEN, /* trackAutomaticEvents */ false);
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
