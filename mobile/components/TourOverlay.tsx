import { useCallback, useRef, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useRouter, usePathname } from 'expo-router';
import { useTour, TOUR_STEPS } from '../context/TourContext';
import type { HighlightRect } from '../context/TourContext';
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

// ─── SVG mask spotlight ───────────────────────────────────────────────────────
// Creates a proper transparent cutout in the dim overlay.  The SVG Mask
// concept: white pixels in the mask = opaque (show the dim), black pixels =
// transparent (reveal the underlying screen = the spotlight hole).

function SpotlightMask({ rect }: { rect: HighlightRect }) {
  const { width: W, height: H } = Dimensions.get('window');
  const { x, y, width: w, height: h } = rect;
  const rx = 16;
  return (
    <Svg
      style={StyleSheet.absoluteFillObject}
      width={W}
      height={H}
      pointerEvents="none"
    >
      <Defs>
        <Mask id="spotlight_mask" x="0" y="0" width={W} height={H}>
          {/* White = dim is visible here */}
          <Rect x={0} y={0} width={W} height={H} fill="white" />
          {/* Black = dim is transparent here (the spotlight cutout) */}
          <Rect x={x} y={y} width={w} height={h} rx={rx} fill="black" />
        </Mask>
      </Defs>
      {/* The dim overlay; the mask punches a hole for the spotlight */}
      <Rect
        x={0} y={0} width={W} height={H}
        fill="rgba(0,0,0,0.72)"
        mask="url(#spotlight_mask)"
      />
    </Svg>
  );
}

// ─── Debug overlay (always visible in DEV until alignment is confirmed) ───────

function DebugOverlay({ rect }: { rect: HighlightRect }) {
  const { width: W, height: H } = Dimensions.get('window');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { width: W, height: H }]}>
      {/* Yellow dashed border — the exact spotlight rect as committed */}
      <View
        style={{
          position:    'absolute',
          top:         rect.y - 2,
          left:        rect.x - 2,
          width:       rect.width  + 4,
          height:      rect.height + 4,
          borderWidth: 2,
          borderColor: '#facc15',
          borderStyle: 'dashed',
          borderRadius: 18,
        }}
      />
      {/* Coordinate chip */}
      <View
        style={{
          position:          'absolute',
          top:               rect.y + rect.height + 6,
          left:              rect.x,
          backgroundColor:   'rgba(0,0,0,0.85)',
          borderRadius:      4,
          paddingHorizontal: 6,
          paddingVertical:   3,
        }}
      >
        <Text
          style={{ color: '#facc15', fontSize: 9, fontFamily: 'monospace', lineHeight: 13 }}
        >
          {`(${rect.x.toFixed(0)}, ${rect.y.toFixed(0)})  ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}`}
        </Text>
      </View>
    </View>
  );
}

// ─── Floating card position ───────────────────────────────────────────────────

const CARD_EST_H = 220;
const CARD_GAP   = 12;

function getFloatingPos(rect: HighlightRect) {
  const { height: screenH } = Dimensions.get('window');
  const spaceAbove = rect.y - CARD_GAP;
  const spaceBelow = screenH - (rect.y + rect.height) - CARD_GAP;
  if (spaceAbove >= CARD_EST_H) return { bottom: screenH - rect.y + CARD_GAP, left: 12, right: 12 };
  if (spaceBelow >= CARD_EST_H) return { top: rect.y + rect.height + CARD_GAP, left: 12, right: 12 };
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TourOverlay() {
  const {
    tourActive, tourStepIndex, currentStep, showOffer, highlightRect,
    acceptTour, declineTour, nextStep, skipTour,
  } = useTour();
  const { isAuthenticated, hasCompletedOnboarding, darkMode } = useApp();
  const { t }      = useTranslation();
  const router     = useRouter();
  const pathname   = usePathname();
  const currentTab = pathnameToTab(pathname);

  const navigateToTab = useCallback((tab: string) => {
    const route = TAB_ROUTES[tab];
    if (route) router.navigate(route as any);
  }, [router]);

  const handleNext = useCallback(() => nextStep(navigateToTab), [nextStep, navigateToTab]);

  // backdropOpacity: 1 = full dim (measuring), fades to 0 when spotlight appears
  // spotlightOpacity: 0 → 1 when rect is ready
  const backdropOpacity  = useRef(new Animated.Value(1)).current;
  const spotlightOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    backdropOpacity.setValue(1);
    spotlightOpacity.setValue(0);
  }, [tourStepIndex, backdropOpacity, spotlightOpacity]);

  useEffect(() => {
    if (!highlightRect) {
      backdropOpacity.setValue(1);
      spotlightOpacity.setValue(0);
      return;
    }
    if (__DEV__) {
      const { width: wW, height: wH } = Dimensions.get('window');
      console.log(
        `[TourOverlay] spotlight` +
        `  x=${highlightRect.x.toFixed(0)} y=${highlightRect.y.toFixed(0)}` +
        `  w=${highlightRect.width.toFixed(0)} h=${highlightRect.height.toFixed(0)}` +
        `  (window ${wW}×${wH})`
      );
    }
    Animated.parallel([
      Animated.timing(backdropOpacity,  { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(spotlightOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [highlightRect, backdropOpacity, spotlightOpacity]);

  if (!isAuthenticated || !hasCompletedOnboarding) return null;

  const isLastStep   = tourStepIndex === TOUR_STEPS.length - 1;
  const onCorrectTab = currentStep?.tab === currentTab;
  const showTooltip  = tourActive && onCorrectTab && !!currentStep;

  const bg          = darkMode ? '#111827' : '#ffffff';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSec     = darkMode ? '#9ca3af' : '#6b7280';
  const borderClr   = darkMode ? '#1f2937' : '#e5e7eb';
  const skipClr     = darkMode ? '#6b7280' : '#9ca3af';

  const floatingPos = highlightRect ? getFloatingPos(highlightRect) : null;
  const isFloating  = floatingPos !== null;

  return (
    <>
      {/* ── Tour offer (full-screen, no coordinate dependency) ── */}
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

      {/*
       * ── Tour spotlight Modal ──────────────────────────────────────────────────
       *
       * statusBarTranslucent={true} on Android makes the Modal origin y=0 equal
       * to the physical top of the screen, matching the coordinate space of
       * measureInWindow().  Without this, Android offsets the Modal by
       * StatusBar.currentHeight, causing the spotlight to appear too low.
       */}
      {showTooltip && (
        <Modal
          visible
          transparent
          statusBarTranslucent={true}
          animationType="none"
          onRequestClose={skipTour}
        >
          {/* Layer 1: Full-screen dim while measuring (fades out when rect ready) */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity, backgroundColor: 'rgba(0,0,0,0.72)' }]}
          />

          {/* Layer 2: SVG mask spotlight + optional debug overlay */}
          {highlightRect && (
            <Animated.View
              pointerEvents="box-none"
              style={[StyleSheet.absoluteFillObject, { opacity: spotlightOpacity }]}
            >
              {/* SVG mask creates a proper transparent hole — no strip artefacts */}
              <SpotlightMask rect={highlightRect} />

              {/* Green border around the spotlight cutout */}
              <View
                pointerEvents="none"
                style={{
                  position:     'absolute',
                  top:          highlightRect.y,
                  left:         highlightRect.x,
                  width:        highlightRect.width,
                  height:       highlightRect.height,
                  borderRadius: 16,
                  borderWidth:  2,
                  borderColor:  '#16a34a',
                }}
              />

              {/* Permanent DEV debug overlay — stays until alignment is confirmed */}
              {__DEV__ && <DebugOverlay rect={highlightRect} />}
            </Animated.View>
          )}

          {/* Layer 3: Full-screen tap-to-skip */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={skipTour}
            activeOpacity={0}
          />

          {/* Layer 4: Tooltip card */}
          <View
            style={[
              s.card,
              isFloating ? s.cardFloating : s.cardBottom,
              isFloating ? (floatingPos as object) : undefined,
              { backgroundColor: bg },
            ]}
          >
            <View style={s.progressBar} />

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

            <Text style={[s.title, { color: textPrimary }]}>
              {t((currentStep?.title ?? '') as any)}
            </Text>
            <Text style={[s.body, { color: textSec }]}>
              {t((currentStep?.body ?? '') as any)}
            </Text>

            <View style={s.actions}>
              <TouchableOpacity onPress={skipTour}>
                <Text style={[s.skipTxt, { color: skipClr }]}>{t('tour.skip')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={s.nextBtn}>
                <Text style={s.nextTxt}>
                  {isLastStep ? t('tour.finish') : t('tour.next')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  offerRoot: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  mascot: { width: 160, height: 160, marginBottom: 24 },
  offerTitle: {
    fontSize: 26, fontWeight: '800', marginBottom: 10, textAlign: 'center',
  },
  offerDesc: {
    fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1, borderRadius: 16, paddingVertical: 16,
    paddingHorizontal: 32, width: '100%', alignItems: 'center',
  },
  secondaryBtnTxt: { fontSize: 15, fontWeight: '500' },

  card: {
    position: 'absolute', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  cardBottom: {
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowOffset: { width: 0, height: -4 }, paddingBottom: 32,
  },
  cardFloating: {
    borderRadius: 20, shadowOffset: { width: 0, height: 4 }, paddingBottom: 16,
  },
  progressBar: { height: 4, backgroundColor: '#16a34a' },
  dotsRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 4, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  dot: { height: 5, borderRadius: 3 },
  counter: { fontSize: 10, fontWeight: '600', marginLeft: 'auto' },
  title: {
    fontSize: 15, fontWeight: '700', paddingHorizontal: 16, marginBottom: 6, lineHeight: 20,
  },
  body: { fontSize: 13, paddingHorizontal: 16, marginBottom: 18, lineHeight: 19 },
  actions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  skipTxt: { fontSize: 13, fontWeight: '500' },
  nextBtn: {
    backgroundColor: '#16a34a', borderRadius: 12, paddingVertical: 10,
    paddingHorizontal: 22,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  nextTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
