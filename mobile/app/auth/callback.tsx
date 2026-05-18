import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../utils/supabase';

// Handles the kachingo://auth/callback?code=... deep link from Supabase OAuth.
// On Android, WebBrowser.openAuthSessionAsync doesn't always intercept the
// custom-scheme redirect — Android routes it here via the intent system instead.
export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();

  useEffect(() => {
    async function exchange() {
      try {
        if (params.error) {
          console.warn('[Auth] OAuth error:', params.error, params.error_description);
          router.replace('/(auth)/login');
          return;
        }

        if (params.code) {
          // Build the full URL so Supabase can extract PKCE verifier + code
          const url = `kachingo://auth/callback?code=${params.code}`;
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.warn('[Auth] exchangeCodeForSession error:', error.message);
            router.replace('/(auth)/login');
            return;
          }
        }

        // NavigationGuard in _layout.tsx will redirect to (tabs) once auth state updates
        router.replace('/(tabs)');
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
