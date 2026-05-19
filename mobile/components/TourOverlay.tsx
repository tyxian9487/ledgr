import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTour, TOUR_STEPS } from '../context/TourContext';
import { useApp } from '../context/AppContext';

const mascotImg = require('../assets/mascot.png');
const mapMascotImg = require('../assets/m_map.png');

const TAB_ROUTES: Record<string, string> = {
  home: '/(tabs)/',
  trends: '/(tabs)/trends',
  budget: '/(tabs)/budget',
  profile: '/(tabs)/profile',
};

function pathnameToTab(pathname: string): string {
  if (pathname.includes('budget')) return 'budget';
  if (pathname.includes('trends')) return 'trends';
  if (pathname.includes('profile')) return 'profile';
  return 'home';
}

export default function TourOverlay() {
  const { tourActive, tourStepIndex, currentStep, showOffer, acceptTour, declineTour, nextStep, skipTour } =
    useTour();
  const { isAuthenticated, hasCompletedOnboarding, darkMode } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const currentTab = pathnameToTab(pathname);

  const navigateToTab = useCallback(
    (tab: string) => {
      const route = TAB_ROUTES[tab];
      if (route) router.navigate(route as any);
    },
    [router],
  );

  const handleNext = useCallback(() => {
    nextStep(navigateToTab);
  }, [nextStep, navigateToTab]);

  // Never show tour until the user is fully signed in and past onboarding
  if (!isAuthenticated || !hasCompletedOnboarding) return null;

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  const onCorrectTab = currentStep?.tab === currentTab;
  const showTooltip = tourActive && onCorrectTab && !!currentStep;

  const bg = darkMode ? '#111827' : '#ffffff';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSecondary = darkMode ? '#9ca3af' : '#6b7280';
  const border = darkMode ? '#1f2937' : '#e5e7eb';
  const skipColor = darkMode ? '#6b7280' : '#9ca3af';

  return (
    <>
      {/* ── Quick Tour Offer ── */}
      <Modal visible={showOffer} transparent={false} animationType="fade" statusBarTranslucent>
        <View style={[s.offerRoot, { backgroundColor: bg }]}>
          <Image source={mapMascotImg} style={s.mascot} resizeMode="contain" />
          <Text style={[s.offerTitle, { color: textPrimary }]}>Quick tour?</Text>
          <Text style={[s.offerDesc, { color: textSecondary }]}>
            We'll walk you through Kachingo's key features in about 2 minutes. Skip anytime.
          </Text>
          <TouchableOpacity onPress={acceptTour} activeOpacity={0.85} style={s.primaryBtn}>
            <Text style={s.primaryBtnTxt}>Show me around →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={declineTour} activeOpacity={0.75} style={[s.secondaryBtn, { borderColor: border }]}>
            <Text style={[s.secondaryBtnTxt, { color: textSecondary }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Tour Tooltip ── */}
      <Modal
        visible={showTooltip}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={skipTour}
      >
        {/* Dark backdrop — tapping it skips tour */}
        <TouchableOpacity style={s.backdrop} onPress={skipTour} activeOpacity={1} />

        {/* Card */}
        <View style={[s.card, { backgroundColor: bg }]}>
          {/* Green gradient bar */}
          <View style={s.progressBar} />

          {/* Dots + counter */}
          <View style={s.dotsRow}>
            {TOUR_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  {
                    width: i === tourStepIndex ? 14 : 5,
                    backgroundColor:
                      i === tourStepIndex ? '#16a34a' : i < tourStepIndex ? '#86efac' : border,
                  },
                ]}
              />
            ))}
            <Text style={[s.counter, { color: textSecondary }]}>
              {tourStepIndex + 1} / {TOUR_STEPS.length}
            </Text>
          </View>

          <Text style={[s.title, { color: textPrimary }]}>{currentStep?.title}</Text>
          <Text style={[s.body, { color: textSecondary }]}>{currentStep?.body}</Text>

          <View style={s.actions}>
            <TouchableOpacity onPress={skipTour}>
              <Text style={[s.skipTxt, { color: skipColor }]}>Skip tour</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={s.nextBtn}>
              <Text style={s.nextTxt}>{isLastStep ? 'Finish 🎉' : 'Next →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  // ── Offer screen ──
  offerRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  mascot: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  offerTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  offerDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnTxt: {
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Tooltip ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    paddingBottom: 32,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#16a34a',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  counter: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 6,
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    paddingHorizontal: 16,
    marginBottom: 18,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  skipTxt: {
    fontSize: 13,
    fontWeight: '500',
  },
  nextBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  nextTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
