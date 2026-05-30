/**
 * TourOverlay — contextual onboarding card (bottom-sheet style)
 *
 * The card is a position:absolute View at the root layout level (sibling to
 * the tab navigator) so it overlays tab content without Portal gymnastics.
 * Visual attention is directed purely by TourHighlight's animated glow border.
 * No background dim or blur overlay is applied.
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useTour, TOUR_STEPS } from '../context/TourContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';

const mapMascotImg = require('../assets/m_map.png');

const TAB_ROUTES: Record<string, string> = {
  home:    '/(tabs)/',
  trends:  '/(tabs)/trends',
  budget:  '/(tabs)/budget',
  profile: '/(tabs)/profile',
};

function pathnameToTab(p: string) {
  if (p.includes('budget'))  return 'budget';
  if (p.includes('trends'))  return 'trends';
  if (p.includes('profile')) return 'profile';
  return 'home';
}

// Steps whose highlighted element is near the bottom of the screen.
// For these we anchor the card at the TOP instead so it never overlaps.
const TOP_ANCHOR_STEPS = new Set([
  'home-capture',
  'trends-income-vs',
  'budget-custom-goal',
]);

// ─── Main component ───────────────────────────────────────────────────────────

export default function TourOverlay() {
  const {
    tourActive, tourStepIndex, currentStep, showOffer,
    acceptTour, declineTour, nextStep, skipTour,
  } = useTour();
  const { isAuthenticated, hasCompletedOnboarding, darkMode } = useApp();
  const { t }      = useTranslation();
  const router     = useRouter();
  const pathname   = usePathname();
  const insets     = useSafeAreaInsets();
  const currentTab = pathnameToTab(pathname);

  const navigateToTab = useCallback((tab: string) => {
    const route = TAB_ROUTES[tab];
    if (route) router.navigate(route as any);
  }, [router]);

  const handleNext = useCallback(() => nextStep(navigateToTab), [nextStep, navigateToTab]);

  // ── Card slide-up animation ─────────────────────────────────────────────────
  const cardY       = useRef(new Animated.Value(300)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const onCorrectTab = currentStep?.tab === currentTab;
  const showCard     = tourActive && onCorrectTab && !!currentStep;

  useEffect(() => {
    if (showCard) {
      Animated.parallel([
        Animated.spring(cardY,       { toValue: 0,   tension: 70, friction: 11, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1,   duration: 220,             useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(cardY,       { toValue: 240, duration: 220, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [showCard, tourStepIndex]);

  // ── Early return (after all hooks) ─────────────────────────────────────────
  if (!isAuthenticated || !hasCompletedOnboarding) return null;

  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;

  const bg          = darkMode ? '#111827' : '#ffffff';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSec     = darkMode ? '#9ca3af' : '#6b7280';
  const borderClr   = darkMode ? '#1f2937' : '#e5e7eb';
  const skipClr     = darkMode ? '#6b7280' : '#9ca3af';
  const cardBorder  = darkMode ? '#1f2937' : '#f0fdf4';

  return (
    <>
      {/* ── First-launch tour offer (full-screen modal, no coord dependency) ── */}
      <Modal visible={showOffer} transparent={false} animationType="fade">
        <View style={[s.offerRoot, { backgroundColor: bg }]}>
          <Image source={mapMascotImg} style={s.mascot} resizeMode="contain" />
          <Text style={[s.offerTitle, { color: textPrimary }]}>{t('tour.title')}</Text>
          <Text style={[s.offerDesc,  { color: textSec }]}>{t('tour.desc')}</Text>
          <TouchableOpacity onPress={acceptTour} activeOpacity={0.85} style={s.primaryBtn}>
            <Text style={s.primaryBtnTxt}>{t('tour.offer_start')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={declineTour} activeOpacity={0.75} style={[s.secondaryBtn, { borderColor: borderClr }]}>
            <Text style={[s.secondaryBtnTxt, { color: textSec }]}>{t('tour.offer_skip')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Onboarding card ──────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          s.card,
          TOP_ANCHOR_STEPS.has(currentStep?.id ?? '')
            ? { top: insets.top + 8 }
            : { bottom: 64 + insets.bottom },
          {
            backgroundColor: bg,
            borderColor:     cardBorder,
            opacity:         cardOpacity,
            transform:       [{ translateY: cardY }],
          },
        ]}
        pointerEvents={showCard ? 'box-none' : 'none'}
      >
        {/* Green accent bar */}
        <View style={s.accentBar} />

        {/* Progress dots + counter */}
        <View style={s.dotsRow}>
          {TOUR_STEPS.map((_, i) => (
            <View
              key={i}
              style={[s.dot, {
                width: i === tourStepIndex ? 14 : 5,
                backgroundColor:
                  i === tourStepIndex ? '#16a34a'
                  : i < tourStepIndex  ? '#86efac'
                  : borderClr,
              }]}
            />
          ))}
          <Text style={[s.counter, { color: textSec }]}>
            {tourStepIndex + 1} / {TOUR_STEPS.length}
          </Text>
        </View>

        {/* Step content */}
        <Text style={[s.title, { color: textPrimary }]}>
          {t((currentStep?.title ?? '') as any)}
        </Text>
        <Text style={[s.body, { color: textSec }]}>
          {t((currentStep?.body ?? '') as any)}
        </Text>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity onPress={skipTour} hitSlop={8}>
            <Text style={[s.skipTxt, { color: skipClr }]}>{t('tour.skip')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={s.nextBtn} activeOpacity={0.85}>
            <Text style={s.nextTxt}>
              {isLastStep ? t('tour.finish') : t('tour.next')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Offer screen ──
  offerRoot: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  mascot: { width: 160, height: 160, marginBottom: 24 },
  offerTitle: { fontSize: 26, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  offerDesc:  { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  primaryBtn: {
    backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnTxt:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn:   { borderWidth: 1, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  secondaryBtnTxt:{ fontSize: 15, fontWeight: '500' },

  // ── Tour card ──
  card: {
    position:    'absolute',
    left:         12,
    right:        12,
    borderRadius: 20,
    borderWidth:  1,
    overflow:    'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius:  16,
    elevation:     10,
    zIndex:        1000,
  },
  accentBar: { height: 4, backgroundColor: '#16a34a' },
  dotsRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 4, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  dot:     { height: 5, borderRadius: 3 },
  counter: { fontSize: 10, fontWeight: '600', marginLeft: 'auto' },
  title:   { fontSize: 15, fontWeight: '700', paddingHorizontal: 16, marginBottom: 5, lineHeight: 20 },
  body:    { fontSize: 13, paddingHorizontal: 16, marginBottom: 16, lineHeight: 19 },
  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 18,
  },
  skipTxt: { fontSize: 13, fontWeight: '500' },
  nextBtn: {
    backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 22,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  nextTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
