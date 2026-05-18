import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext';
import { PurchasesProvider, usePurchases } from '../context/PurchasesContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ConsentBanner from '../components/ConsentBanner';
import { useColorScheme } from 'nativewind';

function NavigationGuard() {
  const { isAuthenticated, hasCompletedOnboarding } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PurchasesProvider>
          <AppProvider>
            <LanguageProvider>
              <DarkModeBridge />
              <EntitlementSyncBridge />
              <NavigationGuard />
              <ConsentBanner />
            </LanguageProvider>
          </AppProvider>
        </PurchasesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
