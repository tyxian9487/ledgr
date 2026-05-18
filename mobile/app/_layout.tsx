import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect, Component } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AppProvider, useApp } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext';
import { PurchasesProvider, usePurchases } from '../context/PurchasesContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ConsentBanner from '../components/ConsentBanner';
import NotificationWatcher from '../components/NotificationWatcher';
import { useColorScheme } from 'nativewind';

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
  }, [isAuthenticated, hasCompletedOnboarding, segments]);

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
              <LanguageProvider>
                <DarkModeBridge />
                <EntitlementSyncBridge />
                <NotificationWatcher />
                <NavigationGuard />
                <ConsentBanner />
              </LanguageProvider>
            </AppProvider>
          </PurchasesProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
