import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'kachingo_pin';

export async function getStoredPin(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(PIN_KEY);
  } catch {
    return null;
  }
}

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function removePin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PIN_KEY);
  } catch {}
}

export async function isPinEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(PIN_KEY);
    return typeof val === 'string' && val.length > 0;
  } catch {
    return false;
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored === pin;
}
