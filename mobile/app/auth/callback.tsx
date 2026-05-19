import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../utils/supabase';

// Required so that WebBrowser.openAuthSessionAsync on Android can detect that
// the OAuth redirect landed here and return { type: 'success' } to the caller.
WebBrowser.maybeCompleteAuthSession();

// Handles kachingo://auth/callback?code=...&state=... deep link on Android.
// WebBrowser.openAuthSessionAsync doesn't reliably intercept custom-scheme
// redirects on Android — the OS routes them here via the intent system.
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string; error_description?: string }>();

  useEffect(() => {
    // Wait until params are actually populated (can arrive async on Android)
    if (!params.code && !params.error) return;

    async function exchange() {
      try {
        if (params.error) {
          console.warn('[Auth] OAuth error:', params.error, params.error_description);
          router.replace('/(auth)/login');
          return;
        }

        if (params.code) {
          // OAuthCallbackHandler in _layout.tsx may have already processed this URL
          // via Linking.addEventListener — skip if a session already exists.
          const { data: { session } } = await supabase.auth.getSession();
          if (session) return;

          let callbackUrl = `kachingo://auth/callback?code=${encodeURIComponent(params.code)}`;
          if (params.state) callbackUrl += `&state=${encodeURIComponent(params.state)}`;

          const { error } = await supabase.auth.exchangeCodeForSession(callbackUrl);
          if (error) {
            console.warn('[Auth] exchangeCodeForSession error:', error.message);
            router.replace('/(auth)/login');
            return;
          }
          // Session established — NavigationGuard will redirect to (tabs) or onboarding.
        } else {
          router.replace('/(auth)/login');
        }
      } catch (e) {
        console.warn('[Auth] callback error:', e);
        router.replace('/(auth)/login');
      }
    }

    exchange();
  }, [params.code, params.error]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#052e16' }}>
      <ActivityIndicator size="large" color="#4ade80" />
    </View>
  );
}
