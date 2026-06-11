import * as SecureStore from 'expo-secure-store';

const PIN_KEY          = 'kachingo_pin';
const PIN_LENGTH_KEY   = 'kachingo_pin_length';
const PIN_SQ_IDX_KEY   = 'kachingo_pin_sq_idx';
const PIN_SQ_ANS_KEY   = 'kachingo_pin_sq_ans';
const PIN_BIO_KEY      = 'kachingo_pin_biometric';

// ── Core PIN ──────────────────────────────────────────────────────────────────

export async function getStoredPin(): Promise<string | null> {
  try { return await SecureStore.getItemAsync(PIN_KEY); } catch { return null; }
}

export async function savePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function removePin(): Promise<void> {
  try { await SecureStore.deleteItemAsync(PIN_KEY); } catch {}
  try { await SecureStore.deleteItemAsync(PIN_LENGTH_KEY); } catch {}
}

export async function isPinEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(PIN_KEY);
    return typeof val === 'string' && val.length > 0;
  } catch { return false; }
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored === pin;
}

// ── PIN length (4 or 6) ───────────────────────────────────────────────────────

export async function getPinLength(): Promise<4 | 6> {
  try {
    const val = await SecureStore.getItemAsync(PIN_LENGTH_KEY);
    return val === '6' ? 6 : 4;
  } catch { return 4; }
}

export async function savePinLength(len: 4 | 6): Promise<void> {
  await SecureStore.setItemAsync(PIN_LENGTH_KEY, String(len));
}

// ── Security question ─────────────────────────────────────────────────────────

export async function saveSecurityQuestion(index: number, answer: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_SQ_IDX_KEY, String(index));
  await SecureStore.setItemAsync(PIN_SQ_ANS_KEY, answer.trim().toLowerCase());
}

export async function getSecurityQuestionIndex(): Promise<number | null> {
  try {
    const val = await SecureStore.getItemAsync(PIN_SQ_IDX_KEY);
    return val !== null ? parseInt(val, 10) : null;
  } catch { return null; }
}

export async function hasSecurityQuestion(): Promise<boolean> {
  const idx = await getSecurityQuestionIndex();
  return idx !== null;
}

export async function verifySecurityAnswer(answer: string): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(PIN_SQ_ANS_KEY);
    return stored !== null && stored === answer.trim().toLowerCase();
  } catch { return false; }
}

export async function removeSecurityQuestion(): Promise<void> {
  try { await SecureStore.deleteItemAsync(PIN_SQ_IDX_KEY); } catch {}
  try { await SecureStore.deleteItemAsync(PIN_SQ_ANS_KEY); } catch {}
}

// ── Biometric preference ──────────────────────────────────────────────────────

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(PIN_BIO_KEY);
    return val === 'true';
  } catch { return false; }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(PIN_BIO_KEY, enabled ? 'true' : 'false');
}

export async function removeBiometricPref(): Promise<void> {
  try { await SecureStore.deleteItemAsync(PIN_BIO_KEY); } catch {}
}
