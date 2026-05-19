import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect, Component } from 'react';
import { View, Text, ScrollView, useColorScheme as useSystemColorScheme, Linking } from 'react-native';
import { AppProvider, useApp } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext';
import { PurchasesProvider, usePurchases } from '../context/PurchasesContext';
import { TourProvider } from '../context/TourContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ConsentBanner from '../components/ConsentBanner';
import TourOverlay from '../components/TourOverlay';
import NotificationWatcher from '../components/NotificationWatcher';
import { useColorScheme } from 'nativewind';
import { supabase, exchangeOAuthCode } from '../utils/supabase';

// Shows JS errors on-screen in release builds so we can diagnose crashes
class AppErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#c00', padding: 24, paddingTop: 60 }}>
          <ScrollView>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              App crashed
            </Text>
            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 16 }}>
              {this.state.error.message}
            </Text>
            <Text style={{ color: '#ffcccc', fontSize: 11, fontFamily: 'monospace' }}>
              {this.state.error.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function NavigationGuard() {
  const { isAuthenticated, hasCompletedOnboarding } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 'auth' (no parens) is the OAuth callback folder — treat it like the auth group
    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'auth';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !hasCompletedOnboarding && segments[0] !== '(auth)') {
      router.replace('/(auth)/onboarding');
    } else if (isAuthenticated && hasCompletedOnboarding && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, hasCompletedOnboarding, segments, router]);

  return <Slot />;
}

function DarkModeBridge() {
  const systemScheme = useSystemColorScheme();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(systemScheme === 'dark' ? 'dark' : 'light');
  }, [systemScheme]);

  return null;
}

// Directly processes kachingo://auth/callback deep links via the Linking API.
// This is more reliable than relying on expo-router to navigate to auth/callback.tsx
// on Android — the OS fires the deep link intent after the Chrome Custom Tab closes,
// and the router may not navigate in time (or at all if the app returns from background).
function OAuthCallbackHandler() {
  useEffect(() => {
    const processUrl = async (url: string) => {
      if (!url.includes('auth/callback')) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return;
      const err = await exchangeOAuthCode(url);
      if (err) console.warn('[Auth] OAuthCallbackHandler exchange error:', err.message);
    };

    // Both cold-start and warm-start deep links are handled here.
    // exchangeOAuthCode uses a module-level flag so concurrent calls from
    // login.tsx or auth/callback.tsx are safely serialised — only one
    // actually calls exchangeCodeForSession; the others wait and return the
    // session that was established.
    Linking.getInitialURL().then(url => { if (url) processUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => processUrl(url));
    return () => sub.remove();
  }, []);

  return null;
}

// Keeps userProfile.plan in sync with the RevenueCat entitlement
function EntitlementSyncBridge() {
  const { isPro } = usePurchases();
  const { updateUserProfile } = useApp();

  useEffect(() => {
    updateUserProfile({ plan: isPro ? 'premium' : 'free' });
  }, [isPro]);

  return null;
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PurchasesProvider>
            <AppProvider>
              <TourProvider>
                <LanguageProvider>
                  <OAuthCallbackHandler />
                  <DarkModeBridge />
                  <EntitlementSyncBridge />
                  <NotificationWatcher />
                  <NavigationGuard />
                  <TourOverlay />
                  <ConsentBanner />
                </LanguageProvider>
              </TourProvider>
            </AppProvider>
          </PurchasesProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
