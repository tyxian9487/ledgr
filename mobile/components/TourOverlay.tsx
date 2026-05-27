import { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTour, TOUR_STEPS } from '../context/TourContext';
import type { HighlightRect } from '../context/TourContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';

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

/**
 * Four-quadrant dim mask with a transparent cutout around `rect`.
 * Rendered inside the same absolute overlay as the card — same coordinate
 * space as measureInWindow, so no status-bar offset correction is needed.
 */
function Spotlight({ rect, onSkip }: { rect: HighlightRect; onSkip: () => void }) {
  const DIM = 'rgba(0,0,0,0.72)';
  return (
    <>
      {/* top strip */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: rect.y, backgroundColor: DIM }} pointerEvents="none" />
      {/* left strip beside cutout */}
      <View style={{ position: 'absolute', top: rect.y, left: 0, width: rect.x, height: rect.height, backgroundColor: DIM }} pointerEvents="none" />
      {/* right strip beside cutout */}
      <View style={{ position: 'absolute', top: rect.y, left: rect.x + rect.width, right: 0, height: rect.height, backgroundColor: DIM }} pointerEvents="none" />
      {/* bottom strip */}
      <View style={{ position: 'absolute', top: rect.y + rect.height, left: 0, right: 0, bottom: 0, backgroundColor: DIM }} pointerEvents="none" />
      {/* green highlight border */}
      <View
        style={{
          position: 'absolute',
          top: rect.y,
          left: rect.x,
          width: rect.width,
          height: rect.height,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#16a34a',
        }}
        pointerEvents="none"
      />
      {/* full-screen tap-to-skip — sits behind the card but covers the dim area */}
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onSkip} activeOpacity={0} />
    </>
  );
}

const CARD_GAP = 12;
const CARD_EST_H = 210;

function getFloatingPos(rect: HighlightRect): { top?: number; bottom?: number; left: number; right: number } | null {
  const { height: screenH } = Dimensions.get('window');
  const spaceAbove = rect.y - CARD_GAP;
  const spaceBelow = screenH - (rect.y + rect.height) - CARD_GAP;

  if (spaceAbove >= CARD_EST_H) {
    return { bottom: screenH - rect.y + CARD_GAP, left: 12, right: 12 };
  }
  if (spaceBelow >= CARD_EST_H) {
    return { top: rect.y + rect.height + CARD_GAP, left: 12, right: 12 };
  }
  return null;
}

export default function TourOverlay() {
  const {
    tourActive,
    tourStepIndex,
    currentStep,
    showOffer,
    highlightRect,
    acceptTour,
    declineTour,
    nextStep,
    skipTour,
  } = useTour();
  const { isAuthenticated, hasCompletedOnboarding, darkMode } = useApp();
  const { t } = useTranslation();
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

  // ── Spotlight fade-in ─────────────────────────────────────────────────────
  // MUST be before the early return so hook call count is always the same.
  // Reset to transparent on every step change; animate to opaque once
  // highlightRect is set (i.e. after measurement completes).
  const spotlightOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spotlightOpacity.setValue(0);
  }, [tourStepIndex, spotlightOpacity]);

  useEffect(() => {
    if (!highlightRect) {
      spotlightOpacity.setValue(0);
      return;
    }
    Animated.timing(spotlightOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [highlightRect, spotlightOpacity]);

  if (!isAuthenticated || !hasCompletedOnboarding) return null;

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;
  const onCorrectTab = currentStep?.tab === currentTab;
  const showTooltip = tourActive && onCorrectTab && !!currentStep;

  const bg = darkMode ? '#111827' : '#ffffff';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSecondary = darkMode ? '#9ca3af' : '#6b7280';
  const border = darkMode ? '#1f2937' : '#e5e7eb';
  const skipColor = darkMode ? '#6b7280' : '#9ca3af';

  const floatingPos = highlightRect ? getFloatingPos(highlightRect) : null;
  const isFloating = floatingPos !== null;

  return (
    <>
      {/* ── Quick Tour Offer (full-screen Modal is fine here — no coordinate matching needed) ── */}
      <Modal visible={showOffer} transparent={false} animationType="fade">
        <View style={[s.offerRoot, { backgroundColor: bg }]}>
          <Image source={mapMascotImg} style={s.mascot} resizeMode="contain" />
          <Text style={[s.offerTitle, { color: textPrimary }]}>{t('tour.title')}</Text>
          <Text style={[s.offerDesc, { color: textSecondary }]}>{t('tour.desc')}</Text>
          <TouchableOpacity onPress={acceptTour} activeOpacity={0.85} style={s.primaryBtn}>
            <Text style={s.primaryBtnTxt}>{t('tour.offer_start')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={declineTour} activeOpacity={0.75} style={[s.secondaryBtn, { borderColor: border }]}>
            <Text style={[s.secondaryBtnTxt, { color: textSecondary }]}>{t('tour.offer_skip')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/*
       * ── Tour Tooltip Overlay ──
       *
       * NOT a Modal — rendered as a plain absolute View in the same React Native
       * root as all app content. measureInWindow() and this overlay share the same
       * coordinate space, so the spotlight cutout aligns perfectly with the target
       * element on every Android device, regardless of status-bar height.
       *
       * The Animated.View for the dim/spotlight fades in after the measurement
       * completes, hiding the instant scroll jump from the user.
       */}
      {showTooltip && (
        /*
         * Single Animated.View for the entire overlay — both the spotlight dim
         * and the tooltip card fade in together once measurement is complete.
         * This hides the instant-scroll position jump from the user and prevents
         * the card from flashing over undimmed content.
         */
        <Animated.View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFillObject, s.overlayRoot, { opacity: spotlightOpacity }]}
        >
          {/* Dim mask + spotlight cutout */}
          {highlightRect ? (
            <Spotlight rect={highlightRect} onSkip={skipTour} />
          ) : (
            <TouchableOpacity
              style={[StyleSheet.absoluteFillObject, s.backdrop]}
              onPress={skipTour}
              activeOpacity={1}
            />
          )}

          {/* Tooltip card — floats near element when space allows, otherwise bottom sheet */}
          <View
            style={[
              s.card,
              isFloating ? s.cardFloating : s.cardBottom,
              isFloating ? (floatingPos as object) : undefined,
              { backgroundColor: bg },
            ]}
          >
            {/* Green progress bar at top of card */}
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
                        i === tourStepIndex
                          ? '#16a34a'
                          : i < tourStepIndex
                          ? '#86efac'
                          : border,
                    },
                  ]}
                />
              ))}
              <Text style={[s.counter, { color: textSecondary }]}>
                {tourStepIndex + 1} / {TOUR_STEPS.length}
              </Text>
            </View>

            <Text style={[s.title, { color: textPrimary }]}>
              {t((currentStep?.title ?? '') as any)}
            </Text>
            <Text style={[s.body, { color: textSecondary }]}>
              {t((currentStep?.body ?? '') as any)}
            </Text>

            <View style={s.actions}>
              <TouchableOpacity onPress={skipTour}>
                <Text style={[s.skipTxt, { color: skipColor }]}>{t('tour.skip')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={s.nextBtn}>
                <Text style={s.nextTxt}>
                  {isLastStep ? t('tour.finish') : t('tour.next')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
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

  // ── Absolute overlay root ──
  overlayRoot: {
    zIndex: 9999,
    elevation: 9999,
  },

  // ── Backdrop (no spotlight) ──
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // ── Tooltip card base ──
  card: {
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 10000,
  },
  // Bottom sheet variant
  cardBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    paddingBottom: 32,
  },
  // Floating tooltip variant
  cardFloating: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    paddingBottom: 16,
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
