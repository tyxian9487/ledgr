import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, RefObject } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';

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
}

const TourContext = createContext<TourContextType>({
  tourActive: false, tourStepIndex: -1, currentStep: null,
  showOffer: false, highlightRect: null,
  setHighlightRect: () => {}, acceptTour: () => {}, declineTour: () => {},
  nextStep: () => {}, skipTour: () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const [tourActive,     setTourActive]     = useState(false);
  const [tourStepIndex,  setTourStepIndex]  = useState(-1);
  const [showOffer,      setShowOffer]      = useState(false);
  const [highlightRect,  setHighlightRect]  = useState<HighlightRect | null>(null);

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
 * HOW THE MEASUREMENT WORKS (full explanation for future debuggers)
 * ─────────────────────────────────────────────────────────────────
 *
 * 1. INSTANT SCROLL (`animated: false`)
 *    We scroll the parent ScrollView to the hardcoded `scrollY` position with
 *    NO animation. This eliminates the core race condition: previously, we used
 *    `animated: true` and waited a fixed 700 ms, but animated scrolls on Android
 *    have variable duration (200–600 ms). Measuring while the animation was still
 *    in progress returned the element's mid-animation position, not its final
 *    screen position.
 *
 *    With `animated: false`, the JS command is sent over the React Native bridge
 *    to the native UI thread. The scroll itself is synchronous on the native side,
 *    but the BRIDGE call is asynchronous — there is an inherent 1-3 frame delay
 *    before the native view processes the command.
 *
 * 2. DOUBLE requestAnimationFrame + 80 ms SETTLE
 *    - rAF 1: waits until the current JS frame finishes rendering
 *    - rAF 2: waits until the native layout pass triggered by the rAF 1 render commits
 *    - 80 ms: additional safety margin for Android's shadow-tree flush and the
 *      bridge async gap on slow/mid-range devices
 *
 * 3. STABILITY POLLING (the real fix for bridge async)
 *    After the initial settle, we measure the element twice with a 50 ms gap.
 *    If both measurements agree within 1 px (position hasn't changed), the scroll
 *    has settled and the measurement is trustworthy. If the positions differ, the
 *    scroll command hasn't completed yet — we wait another 50 ms and retry.
 *    Maximum polling window: 10 × 50 ms = 500 ms (never reached on a real device).
 *
 * 4. COORDINATE SYSTEM
 *    `measureInWindow()` returns coordinates in the SCREEN/WINDOW coordinate
 *    space (y=0 = top of screen, behind the status bar when translucent=true).
 *    The TourOverlay Modal uses `statusBarTranslucent={true}`, so the Modal
 *    content also starts at y=0 (screen top). Both coordinate systems share the
 *    same origin — no manual offset correction is required.
 *
 * 5. WHY NOT `measure()` (relative)?
 *    `measure()` returns position relative to the component's first non-absolute
 *    ancestor. This varies depending on how deep the element is nested, making
 *    it unreliable for an absolute overlay. `measureInWindow()` is unambiguous.
 */
export function useTourTarget(stepId: string, options: TourTargetOptions = {}) {
  const { currentStep, setHighlightRect } = useTour();
  const ref = useRef<View>(null);

  useEffect(() => {
    if (currentStep?.id !== stepId) return;

    let cancelled  = false;
    let raf1 = 0, raf2 = 0;
    let timer = 0;

    const initialScrollY = options.scrollY ?? 0;

    // ── 1. Instant scroll ─────────────────────────────────────────────────────
    if (options.scrollRef) {
      options.scrollRef.current?.scrollTo({ y: initialScrollY, animated: false });
    }

    // ── 2. Wait for bridge + layout ───────────────────────────────────────────
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        timer = setTimeout(() => {
          if (!cancelled) pollForStability(0, null);
        }, 80) as unknown as number;
      });
    });

    // ── 3. Stability-based measurement ────────────────────────────────────────
    // Measure twice 50 ms apart. If positions agree within 1 px, the scroll
    // command has been processed and the position is accurate.
    function pollForStability(attempt: number, prev: { x: number; y: number } | null) {
      if (cancelled) return;

      ref.current?.measureInWindow((x, y, w, h) => {
        if (cancelled) return;

        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log(
            `[Tour] ${stepId} attempt=${attempt}` +
            ` pos=(${x.toFixed(0)},${y.toFixed(0)})` +
            ` size=(${w.toFixed(0)}×${h.toFixed(0)})` +
            (prev ? ` drift=(${(x - prev.x).toFixed(1)},${(y - prev.y).toFixed(1)})` : '')
          );
        }

        // Element not laid out yet — retry
        if (w === 0 || h === 0) {
          if (attempt < 10) {
            timer = setTimeout(() => pollForStability(attempt + 1, null), 60) as unknown as number;
          }
          return;
        }

        // Check positional stability (did it move since last poll?)
        if (prev !== null) {
          const drift = Math.abs(x - prev.x) + Math.abs(y - prev.y);
          if (drift > 1 && attempt < 10) {
            // Still settling — wait and check again
            timer = setTimeout(() => pollForStability(attempt + 1, { x, y }), 50) as unknown as number;
            return;
          }
        } else {
          // First measurement — wait 50 ms then check if it moved
          timer = setTimeout(() => pollForStability(attempt + 1, { x, y }), 50) as unknown as number;
          return;
        }

        // ── 4. Extra scroll if element is covered by the tooltip card ─────────
        const screenH = Dimensions.get('window').height;
        const CARD_H  = 250; // estimated tooltip card height
        const MARGIN  = 12;

        if (options.scrollRef && (y + h + MARGIN) > (screenH - CARD_H)) {
          const extra = (y + h + MARGIN) - (screenH - CARD_H);
          options.scrollRef.current?.scrollTo({ y: initialScrollY + extra, animated: false });
          // Re-enter stability polling from scratch
          raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
              if (!cancelled) {
                timer = setTimeout(() => pollForStability(0, null), 80) as unknown as number;
              }
            });
          });
          return;
        }

        // ── 5. Commit the highlight rect ──────────────────────────────────────
        setHighlightRect({
          x:      Math.max(0, x - 4),
          y:      Math.max(0, y - 4),
          width:  w + 8,
          height: h + 8,
        });
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, [currentStep?.id, stepId, options.scrollRef, options.scrollY, setHighlightRect]);

  return ref;
}
