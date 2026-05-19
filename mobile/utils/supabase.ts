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
