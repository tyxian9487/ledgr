import '../global.css';
import * as Sentry from '@sentry/react-native';
import { Slot, useRouter, useSegments } from 'expo-router';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({ dsn: SENTRY_DSN, enableNativeCrashHandling: true });
}
import React, { useEffect, useState, Component } from 'react';
import { View, Text, ScrollView, Linking, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
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
import { supabase, handleOAuthRedirect } from '../utils/supabase';
import {
  loadNotifPrefs,
  requestInitialNotificationPermission,
  syncNotificationSettings,
  getTranslationFunction,
} from '../utils/notifications';

// ── Global crash capture ───────────────────────────────────────────────────────
// Catches JS errors that bypass React's error boundary (async, event handlers)
const CRASH_STORAGE_KEY = 'kachingo_last_crash';
const NATIVE_CRASH_PATH = (FileSystem.documentDirectory ?? '') + 'kachingo_native_crash.txt';
let _globalCrashMsg = '';

function installGlobalErrorHandler() {
  const ErrUtils = (global as any).ErrorUtils;
  if (!ErrUtils) return;
  const prev = ErrUtils.getGlobalHandler?.();
  ErrUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
    const msg = `[${isFatal ? 'FATAL' : 'non-fatal'}] ${error?.message ?? 'unknown'}\n\n${error?.stack ?? ''}`;
    _globalCrashMsg = msg;
    // Persist so it survives a full app restart
    AsyncStorage.setItem(CRASH_STORAGE_KEY, msg).catch(() => {});
    prev?.(error, isFatal);
  });
}
installGlobalErrorHandler();

// ── Error boundary + debug screen ─────────────────────────────────────────────
interface EBState { reactError: Error | null; globalMsg: string; prevCrash: string; resetKey: number }

class AppErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { reactError: null, globalMsg: '', prevCrash: '', resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { reactError: error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (SENTRY_DSN) {
      Sentry.captureException(error, { contexts: { react: { componentStack: info.componentStack } } });
    }
  }

  private async loadNativeCrash() {
    try {
      const info = await FileSystem.getInfoAsync(NATIVE_CRASH_PATH);
      if (!info.exists) return;
      const content = await FileSystem.readAsStringAsync(NATIVE_CRASH_PATH);
      await FileSystem.deleteAsync(NATIVE_CRASH_PATH, { idempotent: true });
      const msg = '[NATIVE/JVM CRASH]\n' + content;
      await AsyncStorage.setItem(CRASH_STORAGE_KEY, msg);
      this.setState({ prevCrash: msg });
    } catch (_) {}
  }

  componentDidMount() {
    // Load any crash from previous session
    AsyncStorage.getItem(CRASH_STORAGE_KEY).then(v => {
      if (v) this.setState({ prevCrash: v });
    }).catch(() => {});

    // Check for native (JVM) crash written before JS started
    this.loadNativeCrash();

    // Poll for global JS errors caught outside the React tree
    const id = setInterval(() => {
      if (_globalCrashMsg && _globalCrashMsg !== this.state.globalMsg) {
        this.setState({ globalMsg: _globalCrashMsg });
      }
    }, 500);
    (this as any)._pollId = id;
  }

  componentWillUnmount() {
    clearInterval((this as any)._pollId);
  }

  render() {
    const { reactError, globalMsg, prevCrash } = this.state;
    const crash = reactError
      ? `[REACT RENDER]\n${reactError.message}\n\n${reactError.stack ?? ''}`
      : globalMsg || '';

    if (crash) {
      return (
        <View style={{ flex: 1, backgroundColor: '#7f1d1d', padding: 20, paddingTop: 56 }}>
          <ScrollView>
            <Text style={{ color: '#fef2f2', fontSize: 17, fontWeight: 'bold', marginBottom: 8 }}>
              💥 Crash detected
            </Text>
            <Text style={{ color: '#fca5a5', fontSize: 11, fontFamily: 'monospace', marginBottom: 20 }}>
              {crash}
            </Text>
            {prevCrash && prevCrash !== crash && (
              <>
                <Text style={{ color: '#fef2f2', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                  Previous session crash:
                </Text>
                <Text style={{ color: '#fca5a5', fontSize: 10, fontFamily: 'monospace', marginBottom: 20 }}>
                  {prevCrash}
                </Text>
              </>
            )}
            <TouchableOpacity
              onPress={() => {
                AsyncStorage.removeItem(CRASH_STORAGE_KEY).catch(() => {});
                _globalCrashMsg = '';
                this.setState(prev => ({ reactError: null, globalMsg: '', prevCrash: '', resetKey: prev.resetKey + 1 }));
              }}
              style={{ backgroundColor: '#dc2626', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Dismiss & retry</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    // No active crash — show previous session crash as a non-blocking banner
    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
        {prevCrash ? (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1c1917', padding: 12, maxHeight: 180 }}>
            <ScrollView style={{ maxHeight: 120 }}>
              <Text style={{ color: '#fca5a5', fontSize: 10, fontFamily: 'monospace' }}>
                ⚠️ Last crash: {prevCrash}
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => {
                AsyncStorage.removeItem(CRASH_STORAGE_KEY).catch(() => {});
                this.setState({ prevCrash: '' });
              }}
              style={{ marginTop: 6 }}
            >
              <Text style={{ color: '#a3a3a3', fontSize: 11, textAlign: 'right' }}>Dismiss ✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </React.Fragment>
    );
  }
}

function NavigationGuard() {
  const { isAuthenticated, isAuthInitialized, hasCompletedOnboarding } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthInitialized) return;
    // 'auth' (no parens) is the OAuth callback folder — treat it like the auth group
    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'auth';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && !hasCompletedOnboarding && segments[0] !== '(auth)') {
      router.replace('/(auth)/onboarding');
    } else if (isAuthenticated && hasCompletedOnboarding && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isAuthInitialized, hasCompletedOnboarding, segments, router]);

  return <Slot />;
}

function DarkModeBridge() {
  const { darkMode } = useApp();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
      const err = await handleOAuthRedirect(url);
      if (err) console.warn('[Auth] OAuthCallbackHandler exchange error:', err.message);
    };

    // Both cold-start and warm-start deep links are handled here.
    // handleOAuthRedirect detects implicit flow (#access_token=) vs PKCE (?code=)
    // and routes to setSession or exchangeCodeForSession accordingly.
    Linking.getInitialURL().then(url => { if (url) processUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => processUrl(url));
    return () => sub.remove();
  }, []);

  return null;
}

function NotificationPermissionRequester() {
  const { isAuthenticated, hasCompletedOnboarding } = useApp();

  useEffect(() => {
    if (!isAuthenticated || !hasCompletedOnboarding) return;
    import('expo-notifications').then(Notifications => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    });
    requestInitialNotificationPermission().catch(() => {});
    (async () => {
      const prefs = await loadNotifPrefs();
      const t = await getTranslationFunction();
      await syncNotificationSettings(prefs, t);
    })().catch(() => {});
  }, [isAuthenticated, hasCompletedOnboarding]);

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
                  <NotificationPermissionRequester />
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
