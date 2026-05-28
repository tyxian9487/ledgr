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
  /**
   * The raw measureInWindow() result — stored separately so the debug overlay
   * can show it alongside the padded highlightRect without re-measuring.
   * null until the first successful measurement for the current step.
   */
  rawMeasureRect: HighlightRect | null;
  setRawMeasureRect: (rect: HighlightRect | null) => void;
  acceptTour: () => void;
  declineTour: () => void;
  nextStep: (navigateToTab?: (tab: string) => void) => void;
  skipTour: () => void;
  /** Incremented by triggerMeasure() — forces useTourTarget to re-run its full measurement sequence. */
  measureTrigger: number;
  triggerMeasure: () => void;
  /**
   * Registers a lightweight re-measure callback for the currently active tour
   * target. Called by useTourTarget; cleared on step change or unmount.
   * Tab screens' onScroll handlers invoke remeasure() to keep the spotlight
   * position correct while the user (or the tour code) scrolls.
   */
  registerScrollRemeasure: (fn: (() => void) | null) => void;
  /** Invoke the currently registered scroll-remeasure callback. */
  remeasure: () => void;
}

const TourContext = createContext<TourContextType>({
  tourActive: false, tourStepIndex: -1, currentStep: null,
  showOffer: false, highlightRect: null, setHighlightRect: () => {},
  rawMeasureRect: null, setRawMeasureRect: () => {},
  acceptTour: () => {}, declineTour: () => {},
  nextStep: () => {}, skipTour: () => {},
  measureTrigger: 0, triggerMeasure: () => {},
  registerScrollRemeasure: () => {}, remeasure: () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const [tourActive,      setTourActive]     = useState(false);
  const [tourStepIndex,   setTourStepIndex]  = useState(-1);
  const [showOffer,       setShowOffer]      = useState(false);
  const [highlightRect,   setHighlightRect]  = useState<HighlightRect | null>(null);
  const [rawMeasureRect,  setRawMeasureRect] = useState<HighlightRect | null>(null);
  const [measureTrigger,  setMeasureTrigger] = useState(0);

  const triggerMeasure = useCallback(() => setMeasureTrigger(n => n + 1), []);

  // Holds the active step's lightweight "re-measure on scroll" callback.
  const scrollRemeasureCb = useRef<(() => void) | null>(null);
  const registerScrollRemeasure = useCallback((fn: (() => void) | null) => {
    scrollRemeasureCb.current = fn;
  }, []);
  const remeasure = useCallback(() => {
    scrollRemeasureCb.current?.();
  }, []);

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
      setHighlightRect, rawMeasureRect, setRawMeasureRect,
      acceptTour, declineTour, nextStep, skipTour,
      measureTrigger, triggerMeasure,
      registerScrollRemeasure, remeasure,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}

// ─────────────────────────────────────────────────────────────────────────────
// useTourTarget — attach to a native View that should be spotlit during a step
// ─────────────────────────────────────────────────────────────────────────────

interface TourTargetOptions {
  scrollRef?: RefObject<ScrollView | null>;
  scrollY?: number;
}

/**
 * MEASUREMENT ARCHITECTURE
 * ─────────────────────────
 *
 * All coordinates come from measureInWindow() which returns window-space coords
 * (y=0 = physical screen top, behind the translucent status bar).  The tour
 * Modal uses statusBarTranslucent={true} so its origin is also (0,0).  Both
 * coordinate systems are identical — no manual offset correction is needed.
 *
 * The ref MUST be attached to a native View with collapsable={false}.  Attaching
 * to TouchableOpacity or other composite components can produce wrong native
 * node handles on Android.
 *
 * PHASE 0 — InteractionManager gate
 *   Waits for tab-switch animations registered with InteractionManager to finish.
 *
 * PHASE 1 — Instant scroll  (animated: false)
 *   Scrolls to the target position synchronously on the native side.
 *
 * PHASE 2 — Double rAF + platform-specific settle
 *   rAF1 flushes JS cycle, rAF2 waits for the native layout pass, then a
 *   settle delay allows the native scroll to commit (180 ms Android, 80 ms iOS).
 *
 * PHASE 3 — 2-consecutive-stable poll
 *   Requires two measureInWindow() readings within 1 px of each other before
 *   committing the rect.  Guards against bridge-batching artefacts.
 *
 * PHASE 4 — Tooltip-card overflow correction
 *   Extra scroll if the element is hidden behind the floating card.
 *
 * PHASE 5 — Commit + register quick-remeasure
 *   Sets highlightRect and registers a lightweight remeasure callback so that
 *   tab screens can call remeasure() from their onScroll handlers to keep the
 *   spotlight aligned during scroll without re-running the full settling sequence.
 */
export function useTourTarget(stepId: string, options: TourTargetOptions = {}) {
  const {
    currentStep, setHighlightRect, setRawMeasureRect, measureTrigger,
    registerScrollRemeasure,
  } = useTour();

  const ref        = useRef<View>(null);
  const optionsRef = useRef<TourTargetOptions>(options);
  optionsRef.current = options;

  useEffect(() => {
    // Only the active step's useTourTarget runs the measurement sequence.
    // We deliberately do NOT clear registerScrollRemeasure here for the
    // non-active case — that would wipe the active step's registration.
    if (currentStep?.id !== stepId) return;

    setHighlightRect(null);
    setRawMeasureRect(null);

    let cancelled = false;
    let raf1 = 0, raf2 = 0, timer = 0;
    let xRaf1 = 0, xRaf2 = 0, xTimer = 0;
    let interactionTask: { cancel(): void } | null = null;

    const SETTLE_MS = Platform.OS === 'android' ? 180 : 80;
    const POLL_MS   = 55;

    // Lightweight re-measure called on every scroll event — no settling needed
    // because the view is already laid out; we just need its new window position.
    const quickMeasure = () => {
      if (cancelled) return;
      ref.current?.measureInWindow((x, y, w, h) => {
        if (cancelled || w === 0 || h === 0) return;
        setRawMeasureRect({ x, y, width: w, height: h });
        setHighlightRect({
          x:      Math.max(0, x - 4),
          y:      Math.max(0, y - 4),
          width:  w + 8,
          height: h + 8,
        });
      });
    };
    registerScrollRemeasure(quickMeasure);

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

    // ── Phase 0: Wait for pending tab-switch animations ───────────────────────
    interactionTask = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;

      const { scrollRef, scrollY: targetY = 0 } = optionsRef.current;

      // ── Phase 1: Instant scroll ───────────────────────────────────────────
      if (scrollRef?.current) {
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

        if (w === 0 || h === 0) {
          if (attempt < 12) {
            timer = setTimeout(
              () => pollForStability(attempt + 1, null, 0),
              POLL_MS,
            ) as unknown as number;
          } else if (__DEV__) {
            console.warn(`[Tour] ✗ ${stepId}: zero-size after 12 attempts`);
          }
          return;
        }

        if (prev === null) {
          timer = setTimeout(
            () => pollForStability(attempt + 1, { x, y }, 0),
            POLL_MS,
          ) as unknown as number;
          return;
        }

        const drift = Math.abs(x - prev.x) + Math.abs(y - prev.y);

        if (drift > 1) {
          if (attempt < 12) {
            timer = setTimeout(
              () => pollForStability(attempt + 1, { x, y }, 0),
              POLL_MS,
            ) as unknown as number;
          }
          return;
        }

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
          const overhang   = (y + h + MARGIN) - (screenH - CARD_H);
          const newScrollY = baseY + overhang;

          if (__DEV__) {
            console.log(
              `[Tour]   obscured: overhang=${overhang.toFixed(0)} → extra scroll y=${newScrollY.toFixed(0)}`
            );
          }

          sRef.current.scrollTo({ y: newScrollY, animated: false });

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
        const rawRect = { x, y, width: w, height: h };
        const rect = {
          x:      Math.max(0, x - 4),
          y:      Math.max(0, y - 4),
          width:  w + 8,
          height: h + 8,
        };

        if (__DEV__) {
          console.log(
            `[Tour] ✓ "${stepId}" committed` +
            `  raw=(${x.toFixed(0)},${y.toFixed(0)}) ${w.toFixed(0)}×${h.toFixed(0)}` +
            `  padded=(${rect.x.toFixed(0)},${rect.y.toFixed(0)}) ${rect.width.toFixed(0)}×${rect.height.toFixed(0)}` +
            `  attempts=${attempt + 1}`
          );
        }

        setRawMeasureRect(rawRect);
        setHighlightRect(rect);
      });
    }

    return () => {
      cancelled = true;
      registerScrollRemeasure(null);
      setRawMeasureRect(null);
      interactionTask?.cancel();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
      cancelAnimationFrame(xRaf1);
      cancelAnimationFrame(xRaf2);
      clearTimeout(xTimer);
    };
    // options intentionally omitted — captured via optionsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.id, stepId, setHighlightRect, setRawMeasureRect, measureTrigger, registerScrollRemeasure]);

  return ref;
}
