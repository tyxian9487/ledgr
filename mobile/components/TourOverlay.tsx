/**
 * TourOverlay — spotlight-based onboarding overlay
 *
 * ARCHITECTURE
 * ────────────
 * The spotlight is rendered inside a React Native Modal with
 * `statusBarTranslucent={true}`.  This means:
 *
 *   • Modal content origin  → (0, 0) = TOP OF SCREEN (behind status bar)
 *   • measureInWindow()     → (0, 0) = TOP OF SCREEN (because the app uses
 *                             StatusBar translucent={true}, so the RN root view
 *                             fills the entire window including the status bar)
 *
 * Both coordinate systems share the same origin, so the spotlight rect
 * produced by measureInWindow() can be placed directly in the Modal with no
 * manual offset correction.
 *
 * UX FLOW PER STEP
 * ────────────────
 *  1. Step activates → highlightRect = null
 *  2. Modal appears immediately with a FULL DIM backdrop (user sees dark screen)
 *  3. Behind the dim, useTourTarget() performs the instant scroll + stability poll
 *  4. Once measurement stabilises → highlightRect is set
 *  5. Backdrop fades OUT, spotlight (4-strip cutout + border) fades IN (200 ms)
 *  6. Card is always visible at the bottom (or floats near element if space allows)
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

// ─── Spotlight strips (dim everything except the highlighted rect) ────────────

const DIM = 'rgba(0,0,0,0.72)';

function SpotlightStrips({ rect }: { rect: HighlightRect }) {
  const { x, y, width: w, height: h } = rect;
  return (
    <>
      {/* top  */}
      <View style={{ position:'absolute', top:0, left:0, right:0, height:y,   backgroundColor:DIM }} pointerEvents="none" />
      {/* left */}
      <View style={{ position:'absolute', top:y, left:0, width:x,  height:h,  backgroundColor:DIM }} pointerEvents="none" />
      {/* right */}
      <View style={{ position:'absolute', top:y, left:x+w, right:0, height:h, backgroundColor:DIM }} pointerEvents="none" />
      {/* bottom */}
      <View style={{ position:'absolute', top:y+h, left:0, right:0, bottom:0, backgroundColor:DIM }} pointerEvents="none" />
    </>
  );
}

// ─── Floating card position (above or below the spotlit element) ──────────────

const CARD_EST_H = 220;
const CARD_GAP   = 12;

function getFloatingPos(rect: HighlightRect) {
  const { height: screenH } = Dimensions.get('window');
  const spaceAbove = rect.y - CARD_GAP;
  const spaceBelow = screenH - (rect.y + rect.height) - CARD_GAP;
  if (spaceAbove >= CARD_EST_H) return { bottom: screenH - rect.y + CARD_GAP, left: 12, right: 12 };
  if (spaceBelow >= CARD_EST_H) return { top: rect.y + rect.height + CARD_GAP,  left: 12, right: 12 };
  return null; // fall back to bottom sheet
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TourOverlay() {
  const {
    tourActive, tourStepIndex, currentStep, showOffer, highlightRect,
    acceptTour, declineTour, nextStep, skipTour,
  } = useTour();
  const { isAuthenticated, hasCompletedOnboarding, darkMode } = useApp();
  const { t }       = useTranslation();
  const router      = useRouter();
  const pathname    = usePathname();
  const currentTab  = pathnameToTab(pathname);

  const navigateToTab = useCallback((tab: string) => {
    const route = TAB_ROUTES[tab];
    if (route) router.navigate(route as any);
  }, [router]);

  const handleNext = useCallback(() => nextStep(navigateToTab), [nextStep, navigateToTab]);

  // ── Animation values ────────────────────────────────────────────────────────
  // MUST be declared before any conditional return (Rules of Hooks).
  //
  // backdropOpacity  → full-screen dim; 1 while measuring, fades to 0 once
  //                    the spotlight strips take over
  // spotlightOpacity → spotlight strips + border + (optionally) card float;
  //                    0 while measuring, fades to 1 once rect is known
  const backdropOpacity  = useRef(new Animated.Value(1)).current;
  const spotlightOpacity = useRef(new Animated.Value(0)).current;

  // ── Modal coordinate-space calibration ───────────────────────────────────────
  // A 1×1 View placed at (top:0, left:0) inside the Modal lets us verify that
  // the Modal's origin aligns with the app window's origin.  With
  // statusBarTranslucent={true} both should be (0,0).  On some Android
  // versions this flag doesn't work as expected, producing a y-offset equal
  // to StatusBar.currentHeight; the calibration detects and corrects this.
  const calibRef        = useRef<View>(null);
  const [modalOffset, setModalOffset] = useState({ x: 0, y: 0 });

  // Reset animations every time the step changes (new measurement pending)
  useEffect(() => {
    backdropOpacity.setValue(1);
    spotlightOpacity.setValue(0);
  }, [tourStepIndex, backdropOpacity, spotlightOpacity]);

  // Cross-fade: backdrop fades OUT while spotlight fades IN once rect is known.
  // Also logs the committed rect in DEV so you can cross-check it against the
  // console output from useTourTarget's stability poll.
  useEffect(() => {
    if (!highlightRect) {
      backdropOpacity.setValue(1);
      spotlightOpacity.setValue(0);
      return;
    }
    if (__DEV__) {
      const { width: wW, height: wH } = require('react-native').Dimensions.get('window');
      console.log(
        `[TourOverlay] rendering spotlight` +
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

  // ── Early return (after all hooks) ──────────────────────────────────────────
  if (!isAuthenticated || !hasCompletedOnboarding) return null;

  const isLastStep    = tourStepIndex === TOUR_STEPS.length - 1;
  const onCorrectTab  = currentStep?.tab === currentTab;
  const showTooltip   = tourActive && onCorrectTab && !!currentStep;

  // Theme
  const bg          = darkMode ? '#111827' : '#ffffff';
  const textPrimary = darkMode ? '#f9fafb' : '#111827';
  const textSec     = darkMode ? '#9ca3af' : '#6b7280';
  const borderClr   = darkMode ? '#1f2937' : '#e5e7eb';
  const skipClr     = darkMode ? '#6b7280' : '#9ca3af';

  // Apply calibration offset: if Modal origin is not at (0,0) in window space
  // (e.g. statusBarTranslucent didn't work on this Android build), shift the
  // spotlight coordinates so they land in the right place.
  const correctedRect: typeof highlightRect = highlightRect
    ? {
        x:      highlightRect.x      - modalOffset.x,
        y:      highlightRect.y      - modalOffset.y,
        width:  highlightRect.width,
        height: highlightRect.height,
      }
    : null;

  const floatingPos = correctedRect ? getFloatingPos(correctedRect) : null;
  const isFloating  = floatingPos !== null;

  return (
    <>
      {/* ── Quick Tour Offer (full-screen, no coordinate dependency) ── */}
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
       * ── Tour spotlight Modal ──────────────────────────────────────────────
       *
       * statusBarTranslucent={true} is REQUIRED on Android so that the Modal's
       * coordinate system starts at y=0 (top of screen, behind the status bar),
       * matching the coordinates returned by measureInWindow().  Without this
       * flag, Android places the Modal window below the status bar, creating a
       * systematic y-offset equal to StatusBar.currentHeight.
       *
       * animationType="none" prevents the built-in slide/fade between steps —
       * we handle all transitions ourselves with the Animated values above.
       */}
      {showTooltip && (
        <Modal
          visible
          transparent
          statusBarTranslucent={true}
          animationType="none"
          onRequestClose={skipTour}
        >
          {/*
           * Layer 1: Full-screen dim backdrop
           * Visible immediately when the step activates (opacity = 1).
           * Fades to 0 once the spotlight strips take over.
           * pointerEvents="none" so it doesn't block the skip handler below.
           */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity, backgroundColor: DIM }]}
          />

          {/*
           * Layer 2: Spotlight strips + highlight border
           * Fades in (opacity 0→1) once measureInWindow() has settled.
           * pointerEvents="box-none" so the Spotlight's children can receive
           * taps (the skip TouchableOpacity inside it).
           */}
          {/*
           * ── Calibration View ─────────────────────────────────────────────────
           * Invisible 1×1 View anchored to the Modal's top-left corner.
           * measureInWindow() on this View gives us the Modal origin in window
           * space.  With statusBarTranslucent={true} we expect (0,0); any
           * non-zero result is subtracted from the spotlight coordinates.
           */}
          <View
            ref={calibRef}
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1 }}
            onLayout={() => {
              calibRef.current?.measureInWindow((cx, cy) => {
                if (Math.abs(cx - modalOffset.x) > 0.5 || Math.abs(cy - modalOffset.y) > 0.5) {
                  if (__DEV__) {
                    console.log(
                      `[TourOverlay] Modal origin calibration:` +
                      `  platform=${Platform.OS}` +
                      `  origin=(${cx.toFixed(1)},${cy.toFixed(1)})` +
                      `  (expected 0,0 — diff will be subtracted from spotlight)`
                    );
                  }
                  setModalOffset({ x: cx, y: cy });
                }
              });
            }}
          />

          {correctedRect && (
            <Animated.View
              pointerEvents="box-none"
              style={[StyleSheet.absoluteFillObject, { opacity: spotlightOpacity }]}
            >
              <SpotlightStrips rect={correctedRect} />
              {/* Green highlight border around the target element */}
              <View
                pointerEvents="none"
                style={{
                  position:    'absolute',
                  top:         correctedRect.y,
                  left:        correctedRect.x,
                  width:       correctedRect.width,
                  height:      correctedRect.height,
                  borderRadius: 16,
                  borderWidth:  2,
                  borderColor:  '#16a34a',
                }}
              />

              {/*
               * ── DEV ONLY: Debug border + coordinate readout ────────────────
               *
               * Yellow dashed border shows the corrected rect so you can verify
               * alignment.  The chip shows both raw and corrected coords so you
               * can see the calibration offset at a glance.
               */}
              {__DEV__ && (
                <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                  {/* Dashed yellow outline — corrected measurement boundary */}
                  <View
                    style={{
                      position:    'absolute',
                      top:         correctedRect.y - 3,
                      left:        correctedRect.x - 3,
                      width:       correctedRect.width  + 6,
                      height:      correctedRect.height + 6,
                      borderWidth: 2,
                      borderColor: '#facc15',
                      borderStyle: 'dashed',
                      borderRadius: 18,
                    }}
                  />
                  {/* Coordinate chip */}
                  <View
                    style={{
                      position:        'absolute',
                      top:             correctedRect.y + correctedRect.height + 8,
                      left:            correctedRect.x,
                      backgroundColor: 'rgba(0,0,0,0.82)',
                      borderRadius:    4,
                      paddingHorizontal: 6,
                      paddingVertical:   3,
                      flexDirection:   'row',
                      gap:             6,
                    }}
                  >
                    <Text
                      style={{
                        color:      '#facc15',
                        fontSize:   9,
                        fontFamily: 'monospace',
                        lineHeight: 13,
                      }}
                    >
                      {`raw=(${highlightRect!.x.toFixed(0)},${highlightRect!.y.toFixed(0)}) ` +
                       `off=(${modalOffset.x.toFixed(0)},${modalOffset.y.toFixed(0)}) ` +
                       `fin=(${correctedRect.x.toFixed(0)},${correctedRect.y.toFixed(0)}) ` +
                       `${correctedRect.width.toFixed(0)}×${correctedRect.height.toFixed(0)}`}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/*
           * Layer 3: Full-screen tap-to-skip touchable
           * Sits above the backdrop/strips but below the card.
           * Allows tapping anywhere on the dim area to skip the tour.
           */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={skipTour}
            activeOpacity={0}
          />

          {/*
           * Layer 4: Tooltip card
           * Rendered on top of everything else in the Modal.
           * Floats near the element when there is enough space; otherwise
           * snaps to the bottom as a sheet.
           */}
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
  // ── Offer screen ──
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

  // ── Tooltip card ──
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
