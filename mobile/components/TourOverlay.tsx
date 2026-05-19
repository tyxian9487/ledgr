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

const mascotImg = require('../assets/mascot.png');

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

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  const onCorrectTab = currentStep?.tab === currentTab;
  const showTooltip = tourActive && onCorrectTab && !!currentStep;

  return (
    <>
      {/* ── Quick Tour Offer ── */}
      <Modal visible={showOffer} transparent={false} animationType="fade" statusBarTranslucent>
        <View style={s.offerRoot}>
          <Image source={mascotImg} style={s.mascot} resizeMode="contain" />
          <Text style={s.offerTitle}>Quick tour?</Text>
          <Text style={s.offerDesc}>
            We'll walk you through Kachingo's key features in about 2 minutes. Skip anytime.
          </Text>
          <TouchableOpacity onPress={acceptTour} activeOpacity={0.85} style={s.primaryBtn}>
            <Text style={s.primaryBtnTxt}>Show me around →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={declineTour} activeOpacity={0.75} style={s.secondaryBtn}>
            <Text style={s.secondaryBtnTxt}>Skip for now</Text>
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
        <View style={s.card}>
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
                      i === tourStepIndex ? '#16a34a' : i < tourStepIndex ? '#86efac' : '#e5e7eb',
                  },
                ]}
              />
            ))}
            <Text style={s.counter}>
              {tourStepIndex + 1} / {TOUR_STEPS.length}
            </Text>
          </View>

          <Text style={s.title}>{currentStep?.title}</Text>
          <Text style={s.body}>{currentStep?.body}</Text>

          <View style={s.actions}>
            <TouchableOpacity onPress={skipTour}>
              <Text style={s.skipTxt}>Skip tour</Text>
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
    backgroundColor: '#fff',
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
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  offerDesc: {
    fontSize: 15,
    color: '#6b7280',
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
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnTxt: {
    color: '#6b7280',
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
    backgroundColor: '#fff',
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
    color: '#9ca3af',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 6,
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    color: '#6b7280',
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
    color: '#9ca3af',
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
