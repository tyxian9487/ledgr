import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../utils/supabase';

// Handles kachingo://auth/callback?code=...&state=... deep link on Android.
// WebBrowser.openAuthSessionAsync doesn't reliably catch custom-scheme
// redirects on Android — the OS routes them here via the intent system.
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();

  useEffect(() => {
    async function exchange() {
      try {
        if (params.error) {
          console.warn('[Auth] OAuth error:', params.error, params.error_description);
          router.replace('/(auth)/login');
          return;
        }

        if (params.code) {
          // Reconstruct the full URL so Supabase can extract all PKCE params
          const qs = Object.entries(params)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');
          const fullUrl = `kachingo://auth/callback?${qs}`;
          const { error } = await supabase.auth.exchangeCodeForSession(fullUrl);
          if (error) {
            console.warn('[Auth] exchangeCodeForSession error:', error.message);
            router.replace('/(auth)/login');
            return;
          }
          // Don't navigate manually — NavigationGuard in _layout.tsx reacts to
          // the onAuthStateChange event and redirects to (tabs) automatically.
        } else {
          // No code and no error — nothing to do, go back to login
          router.replace('/(auth)/login');
        }
      } catch (e) {
        console.warn('[Auth] callback error:', e);
        router.replace('/(auth)/login');
      }
    }

    exchange();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  );
}
