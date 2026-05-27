import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, RefObject } from 'react';
import { Dimensions, InteractionManager, Platform, ScrollView, View } from 'react-native';

export interface HighlightRect { x: number; y: number; width: number; height: number; }

export interface TourStep {
  id: string;
  tab: 'home' | 'trends' | 'budget' | 'profile';
  title: string;
  body: string;
  isGuide?: boolean;
  guideTab?: 'home' | 'trends' | 'budget' | 'profile';
}

export const TOUR_STEPS: TourStep[] = [
  { id: 'home-green-card',  tab: 'home',    title: 'tour.home_green_card.title',  body: 'tour.home_green_card.body' },
  { id: 'home-stats',       tab: 'home',    title: 'tour.home_stats.title',        body: 'tour.home_stats.body' },
  { id: 'home-add-tx',      tab: 'home',    title: 'tour.home_add_tx.title',       body: 'tour.home_add_tx.body' },
  { id: 'home-capture',     tab: 'home',    title: 'tour.home_capture.title',      body: 'tour.home_capture.body' },
  { id: 'home-budget-btn',  tab: 'home',    title: 'tour.home_budget_btn.title',   body: 'tour.home_budget_btn.body' },
  { id: 'home-view-toggle', tab: 'home',    title: 'tour.home_view_toggle.title',  body: 'tour.home_view_toggle.body' },
  {
    id: 'guide-to-trends', tab: 'home',
    title: 'tour.guide_to_trends.title', body: 'tour.guide_to_trends.body',
    isGuide: true, guideTab: 'trends',
  },
  { id: 'trends-top',        tab: 'trends',  title: 'tour.trends_top.title',        body: 'tour.trends_top.body' },
  { id: 'trends-monthly',    tab: 'trends',  title: 'tour.trends_monthly.title',    body: 'tour.trends_monthly.body' },
  { id: 'trends-categories', tab: 'trends',  title: 'tour.trends_categories.title', body: 'tour.trends_categories.body' },
  { id: 'trends-income-vs',  tab: 'trends',  title: 'tour.trends_income_vs.title',  body: 'tour.trends_income_vs.body' },
  {
    id: 'guide-to-budget', tab: 'trends',
    title: 'tour.guide_to_budget.title', body: 'tour.guide_to_budget.body',
    isGuide: true, guideTab: 'budget',
  },
  { id: 'budget-income', tab: 'budget',  title: 'tour.budget_income.title', body: 'tour.budget_income.body' },
  { id: 'budget-goals',  tab: 'budget',  title: 'tour.budget_goals.title',  body: 'tour.budget_goals.body' },
  {
    id: 'guide-to-profile', tab: 'budget',
    title: 'tour.guide_to_profile.title', body: 'tour.guide_to_profile.body',
    isGuide: true, guideTab: 'profile',
  },
  { id: 'profile-streak',     tab: 'profile', title: 'tour.profile_streak.title',     body: 'tour.profile_streak.body' },
  { id: 'profile-assessment', tab: 'profile', title: 'tour.profile_assessment.title', body: 'tour.profile_assessment.body' },
];

const TOUR_STEP_KEY  = 'ledgr_tour_step';
const TOUR_DONE_KEY  = 'ledgr_tour_done';
const TOUR_OFFER_KEY = 'ledgr_tour_offer_seen';

interface TourContextType {
  tourActive: boolean;
  tourStepIndex: number;
  currentStep: TourStep | null;
  showOffer: boolean;
  highlightRect: HighlightRect | null;
  setHighlightRect: (rect: HighlightRect | null) => void;
  acceptTour: () => void;
  declineTour: () => void;
  nextStep: (navigateToTab?: (tab: string) => void) => void;
  skipTour: () => void;
  /**
   * Incremented by triggerMeasure(). useTourTarget includes this in its
   * dependency array so it re-runs whenever a tab screen signals "I am now
   * fully settled and layout is stable."  This is the primary mechanism for
   * re-measuring after cross-tab navigation: tab screens call triggerMeasure()
   * from useFocusEffect, which fires AFTER all animations (including Reanimated
   * UI-thread animations that are invisible to InteractionManager) complete.
   */
  measureTrigger: number;
  triggerMeasure: () => void;
}

const TourContext = createContext<TourContextType>({
  tourActive: false, tourStepIndex: -1, currentStep: null,
  showOffer: false, highlightRect: null,
  setHighlightRect: () => {}, acceptTour: () => {}, declineTour: () => {},
  nextStep: () => {}, skipTour: () => {},
  measureTrigger: 0, triggerMeasure: () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const [tourActive,      setTourActive]     = useState(false);
  const [tourStepIndex,   setTourStepIndex]  = useState(-1);
  const [showOffer,       setShowOffer]      = useState(false);
  const [highlightRect,   setHighlightRect]  = useState<HighlightRect | null>(null);
  const [measureTrigger,  setMeasureTrigger] = useState(0);

  // Called by tab screens from useFocusEffect once their layout is settled.
  // Incrementing this counter causes useTourTarget (which lists it as a dep)
  // to re-run its measurement sequence — critical for cross-tab navigation
  // where the target screen's layout isn't ready when currentStep.id first
  // changes (Reanimated/UI-thread animations bypass InteractionManager).
  const triggerMeasure = useCallback(() => setMeasureTrigger(n => n + 1), []);

  useEffect(() => {
    (async () => {
      const [step, done, seen] = await Promise.all([
        AsyncStorage.getItem(TOUR_STEP_KEY),
        AsyncStorage.getItem(TOUR_DONE_KEY),
        AsyncStorage.getItem(TOUR_OFFER_KEY),
      ]);
      if (done) return;
      if (step !== null) {
        setTourActive(true);
        setTourStepIndex(parseInt(step, 10));
      } else if (!seen) {
        setShowOffer(true);
      }
    })();
  }, []);

  const currentStep =
    tourActive && tourStepIndex >= 0 && tourStepIndex < TOUR_STEPS.length
      ? TOUR_STEPS[tourStepIndex]
      : null;

  const acceptTour = useCallback(async () => {
    setShowOffer(false);
    setTourActive(true);
    setTourStepIndex(0);
    await Promise.all([
      AsyncStorage.setItem(TOUR_STEP_KEY, '0'),
      AsyncStorage.setItem(TOUR_OFFER_KEY, '1'),
      AsyncStorage.removeItem(TOUR_DONE_KEY),
    ]);
  }, []);

  const declineTour = useCallback(async () => {
    setShowOffer(false);
    await Promise.all([
      AsyncStorage.setItem(TOUR_OFFER_KEY, '1'),
      AsyncStorage.setItem(TOUR_DONE_KEY, '1'),
    ]);
  }, []);

  const nextStep = useCallback(async (navigateToTab?: (tab: string) => void) => {
    setHighlightRect(null);
    const step = TOUR_STEPS[tourStepIndex];
    if (step?.isGuide && step.guideTab && navigateToTab) {
      navigateToTab(step.guideTab);
    }
    const next = tourStepIndex + 1;
    if (next >= TOUR_STEPS.length) {
      setTourActive(false);
      setTourStepIndex(-1);
      await Promise.all([
        AsyncStorage.setItem(TOUR_DONE_KEY, '1'),
        AsyncStorage.removeItem(TOUR_STEP_KEY),
      ]);
    } else {
      setTourStepIndex(next);
      await AsyncStorage.setItem(TOUR_STEP_KEY, String(next));
    }
  }, [tourStepIndex]);

  const skipTour = useCallback(async () => {
    setHighlightRect(null);
    setTourActive(false);
    setTourStepIndex(-1);
    await Promise.all([
      AsyncStorage.setItem(TOUR_DONE_KEY, '1'),
      AsyncStorage.removeItem(TOUR_STEP_KEY),
    ]);
  }, []);

  return (
    <TourContext.Provider value={{
      tourActive, tourStepIndex, currentStep, showOffer, highlightRect,
      setHighlightRect, acceptTour, declineTour, nextStep, skipTour,
      measureTrigger, triggerMeasure,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// useTourTarget — attach to a View that should be spotlit during a given step
// ─────────────────────────────────────────────────────────────────────────────

interface TourTargetOptions {
  scrollRef?: RefObject<ScrollView | null>;
  scrollY?: number;
}

/**
 * HOW THE MEASUREMENT WORKS
 * ─────────────────────────
 *
 * PHASE 0 — InteractionManager gate
 *   React Navigation registers tab-switch gestures and animations as
 *   InteractionManager interactions.  By waiting for runAfterInteractions()
 *   before doing anything, we guarantee that the active tab's layout is
 *   fully committed before we attempt to measure.  This is the primary fix
 *   for misalignment after guide steps that navigate between tabs.
 *
 * PHASE 1 — Instant scroll  (animated: false)
 *   We scroll to the hard-coded scrollY with NO animation.  Animated scrolls
 *   on Android have variable durations (200–600 ms); measuring mid-animation
 *   gives the mid-animation position, not the final one.
 *   With animated:false the native command is synchronous on the native side
 *   but still crosses the JS→native bridge asynchronously (1–3 frames).
 *
 * PHASE 2 — Double rAF + platform-specific settle
 *   rAF 1: flush the current JS render cycle
 *   rAF 2: wait for the subsequent native layout pass
 *   settle: extra safety margin — 180 ms on Android (slower bridge + shadow
 *           tree), 80 ms on iOS.
 *
 * PHASE 3 — 2-consecutive-stable poll
 *   We require TWO consecutive measureInWindow() calls (50 ms apart) that
 *   agree within 1 px before committing.  A single stable pair is enough to
 *   survive bridge-batching artefacts.  Maximum poll window: 12 × 55 ms ≈
 *   660 ms (never hit on a real device for normal scroll depths).
 *
 * PHASE 4 — Tooltip-card overflow correction
 *   If the element's bottom edge would be hidden behind the floating tooltip
 *   card, we do a second instant scroll + fresh stability pass using
 *   *dedicated* RAF handles so the main raf1/raf2 variables are not corrupted.
 *
 * COORDINATE SYSTEM
 *   measureInWindow() returns window-space coords (y=0 = physical top of
 *   screen, behind the translucent status bar).  The tour Modal uses
 *   statusBarTranslucent={true}, so its origin is also y=0.  Both spaces
 *   are identical — no offset correction is needed.
 *
 * options ARE NOT in the dependency array.
 *   The values are always stable per-step (hardcoded numbers, stable useRef
 *   objects).  Listing them would add noise without benefit.  We capture
 *   them through optionsRef to guard against hypothetical future changes.
 */
export function useTourTarget(stepId: string, options: TourTargetOptions = {}) {
  const { currentStep, setHighlightRect, measureTrigger } = useTour();
  const ref        = useRef<View>(null);
  // Always keep the latest options available inside the effect without
  // re-running the effect when they change (they are constants in practice).
  const optionsRef = useRef<TourTargetOptions>(options);
  optionsRef.current = options;

  useEffect(() => {
    if (currentStep?.id !== stepId) return;

    // Clear any stale rect so the backdrop is shown while we re-measure.
    // This is a no-op for the initial step trigger (nextStep already clears it)
    // but matters when measureTrigger increments (re-measure after tab focus).
    setHighlightRect(null);

    let cancelled = false;

    // Handles for Phase 1/2
    let raf1 = 0, raf2 = 0, timer = 0;
    // Dedicated handles for Phase 4 extra-scroll — never share with Phase 1/2
    // to avoid corrupting the cleanup closure.
    let xRaf1 = 0, xRaf2 = 0, xTimer = 0;
    // InteractionManager cancellation token
    let interactionTask: { cancel(): void } | null = null;

    // Platform-aware settle time: Android's JS→native bridge and shadow-tree
    // flush are slower than iOS (especially on mid-range devices).
    const SETTLE_MS = Platform.OS === 'android' ? 180 : 80;
    const POLL_MS   = 55;

    if (__DEV__) {
      const win = Dimensions.get('window');
      console.log(
        `[Tour] ▶ step="${stepId}"` +
        `  platform=${Platform.OS}` +
        `  window=${win.width.toFixed(0)}×${win.height.toFixed(0)}` +
        `  settle=${SETTLE_MS}ms` +
        `  scrollY=${optionsRef.current.scrollY ?? 0}`
      );
    }

    // ── Phase 0: Wait for all pending interactions (tab transitions) ──────────
    interactionTask = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;

      const { scrollRef, scrollY: targetY = 0 } = optionsRef.current;

      // ── Phase 1: Instant scroll ───────────────────────────────────────────
      if (scrollRef?.current) {
        if (__DEV__) {
          scrollRef.current.measure((rx, ry, rw, rh, rpx, rpy) => {
            console.log(
              `[Tour]   ScrollView on screen:` +
              ` pageX=${rpx?.toFixed(0)} pageY=${rpy?.toFixed(0)}` +
              ` w=${rw?.toFixed(0)} h=${rh?.toFixed(0)}`
            );
          });
        }
        scrollRef.current.scrollTo({ y: targetY, animated: false });
      }

      // ── Phase 2: Double rAF + settle ─────────────────────────────────────
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (cancelled) return;
          timer = setTimeout(() => {
            if (!cancelled) pollForStability(0, null, 0);
          }, SETTLE_MS) as unknown as number;
        });
      });
    });

    // ── Phase 3: Stability-based measurement ─────────────────────────────────
    //
    // We require 2 consecutive stable samples (stableCount must reach 1)
    // before committing.  This guards against bridge-batching where two
    // quick measurements both return the pre-scroll position (false stable).
    function pollForStability(
      attempt:     number,
      prev:        { x: number; y: number } | null,
      stableCount: number,
    ) {
      if (cancelled) return;

      ref.current?.measureInWindow((x, y, w, h) => {
        if (cancelled) return;

        if (__DEV__) {
          const drift = prev
            ? (Math.abs(x - prev.x) + Math.abs(y - prev.y)).toFixed(1)
            : '—';
          console.log(
            `[Tour]   poll att=${attempt}` +
            `  pos=(${x.toFixed(0)},${y.toFixed(0)})` +
            `  size=(${w.toFixed(0)}×${h.toFixed(0)})` +
            `  drift=${drift}  stable=${stableCount}`
          );
        }

        // Not laid out yet — wait and retry
        if (w === 0 || h === 0) {
          if (attempt < 12) {
            timer = setTimeout(
              () => pollForStability(attempt + 1, null, 0),
              POLL_MS,
            ) as unknown as number;
          } else if (__DEV__) {
            console.warn(`[Tour] ✗ ${stepId}: element has zero size after 12 attempts`);
          }
          return;
        }

        // First measurement — record position, wait for next sample
        if (prev === null) {
          timer = setTimeout(
            () => pollForStability(attempt + 1, { x, y }, 0),
            POLL_MS,
          ) as unknown as number;
          return;
        }

        const drift = Math.abs(x - prev.x) + Math.abs(y - prev.y);

        if (drift > 1) {
          // Still moving — reset stable counter
          if (attempt < 12) {
            timer = setTimeout(
              () => pollForStability(attempt + 1, { x, y }, 0),
              POLL_MS,
            ) as unknown as number;
          }
          return;
        }

        // Position is stable in this sample; need one more to confirm
        if (stableCount < 1) {
          timer = setTimeout(
            () => pollForStability(attempt + 1, { x, y }, stableCount + 1),
            POLL_MS,
          ) as unknown as number;
          return;
        }

        // ── Phase 4: Extra scroll if element is hidden behind tooltip card ────
        const { height: screenH } = Dimensions.get('window');
        const CARD_H  = 250;
        const MARGIN  = 16;

        const { scrollRef: sRef, scrollY: baseY = 0 } = optionsRef.current;
        if (sRef?.current && (y + h + MARGIN) > (screenH - CARD_H)) {
          const overhang  = (y + h + MARGIN) - (screenH - CARD_H);
          const newScrollY = baseY + overhang;

          if (__DEV__) {
            console.log(
              `[Tour]   element obscured: overhang=${overhang.toFixed(0)}px` +
              ` → extra scroll to y=${newScrollY.toFixed(0)}`
            );
          }

          sRef.current.scrollTo({ y: newScrollY, animated: false });

          // Use DEDICATED handles so raf1/raf2 are not overwritten
          xRaf1 = requestAnimationFrame(() => {
            xRaf2 = requestAnimationFrame(() => {
              if (!cancelled) {
                xTimer = setTimeout(
                  () => pollForStability(0, null, 0),
                  SETTLE_MS,
                ) as unknown as number;
              }
            });
          });
          return;
        }

        // ── Phase 5: Commit ───────────────────────────────────────────────────
        const rect = {
          x:      Math.max(0, x - 4),
          y:      Math.max(0, y - 4),
          width:  w + 8,
          height: h + 8,
        };

        if (__DEV__) {
          console.log(
            `[Tour] ✓ "${stepId}" committed` +
            `  rect=(${rect.x.toFixed(0)},${rect.y.toFixed(0)})` +
            `  ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}` +
            `  attempts=${attempt + 1}`
          );
        }

        setHighlightRect(rect);
      });
    }

    return () => {
      cancelled = true;
      interactionTask?.cancel();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
      cancelAnimationFrame(xRaf1);
      cancelAnimationFrame(xRaf2);
      clearTimeout(xTimer);
    };
    // options intentionally omitted — captured via optionsRef.
    // measureTrigger IS included: tab screens increment it from useFocusEffect
    // once their layout is settled, causing a fresh measurement pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.id, stepId, setHighlightRect, measureTrigger]);

  return ref;
}
