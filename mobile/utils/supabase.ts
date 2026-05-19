import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SecureStore key rules: only a-z A-Z 0-9 . - _   (max 255 chars)
// Supabase uses keys like "sb-<host>-auth-token-code-verifier" which are valid,
// but we sanitize just in case and fall back to AsyncStorage on any error.
const sanitize = (key: string) => key.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    const k = sanitize(key);
    try {
      const val = await SecureStore.getItemAsync(k);
      if (val !== null) return val;
      // Fallback: check AsyncStorage in case it was stored there previously
      return AsyncStorage.getItem(k);
    } catch {
      return AsyncStorage.getItem(k);
    }
  },
  setItem: async (key: string, value: string) => {
    const k = sanitize(key);
    try {
      await SecureStore.setItemAsync(k, value);
    } catch {
      await AsyncStorage.setItem(k, value);
    }
  },
  removeItem: async (key: string) => {
    const k = sanitize(key);
    try {
      await SecureStore.deleteItemAsync(k);
    } catch {}
    try {
      await AsyncStorage.removeItem(k);
    } catch {}
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Module-level flag preventing concurrent PKCE exchanges.
let _pkceExchangeActive = false;

async function exchangeOAuthCode(url: string): Promise<Error | null> {
  if (_pkceExchangeActive) {
    await new Promise(r => setTimeout(r, 4000));
    const { data: { session } } = await supabase.auth.getSession();
    return session ? null : new Error('Sign in timed out. Please try again.');
  }
  _pkceExchangeActive = true;
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(url);
    return error ? new Error(error.message) : null;
  } finally {
    _pkceExchangeActive = false;
  }
}

// Handles both Supabase auth flows:
//   Implicit — tokens in hash fragment: kachingo://auth/callback#access_token=...
//   PKCE     — auth code in query:      kachingo://auth/callback?code=...
// Call this from every OAuth redirect handler instead of exchangeCodeForSession directly.
export async function handleOAuthRedirect(url: string): Promise<Error | null> {
  if (!url) return new Error('Empty redirect URL');

  if (url.includes('#access_token=')) {
    // Implicit flow — parse tokens from the hash fragment and set the session
    const hash = url.split('#')[1] ?? '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken) return new Error('No access token in redirect URL');
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken ?? '',
    });
    return error ? new Error(error.message) : null;
  }

  if (url.includes('code=')) {
    // PKCE flow — exchange auth code for session (semaphore prevents double-exchange)
    return exchangeOAuthCode(url);
  }

  return new Error('Unrecognised OAuth redirect URL');
}
