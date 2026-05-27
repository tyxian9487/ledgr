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
  {
    id: 'home-green-card',
    tab: 'home',
    title: 'tour.home_green_card.title',
    body: 'tour.home_green_card.body',
  },
  {
    id: 'home-stats',
    tab: 'home',
    title: 'tour.home_stats.title',
    body: 'tour.home_stats.body',
  },
  {
    id: 'home-add-tx',
    tab: 'home',
    title: 'tour.home_add_tx.title',
    body: 'tour.home_add_tx.body',
  },
  {
    id: 'home-capture',
    tab: 'home',
    title: 'tour.home_capture.title',
    body: 'tour.home_capture.body',
  },
  {
    id: 'home-budget-btn',
    tab: 'home',
    title: 'tour.home_budget_btn.title',
    body: 'tour.home_budget_btn.body',
  },
  {
    id: 'home-view-toggle',
    tab: 'home',
    title: 'tour.home_view_toggle.title',
    body: 'tour.home_view_toggle.body',
  },
  {
    id: 'guide-to-trends',
    tab: 'home',
    title: 'tour.guide_to_trends.title',
    body: 'tour.guide_to_trends.body',
    isGuide: true,
    guideTab: 'trends',
  },
  {
    id: 'trends-top',
    tab: 'trends',
    title: 'tour.trends_top.title',
    body: 'tour.trends_top.body',
  },
  {
    id: 'trends-monthly',
    tab: 'trends',
    title: 'tour.trends_monthly.title',
    body: 'tour.trends_monthly.body',
  },
  {
    id: 'trends-categories',
    tab: 'trends',
    title: 'tour.trends_categories.title',
    body: 'tour.trends_categories.body',
  },
  {
    id: 'trends-income-vs',
    tab: 'trends',
    title: 'tour.trends_income_vs.title',
    body: 'tour.trends_income_vs.body',
  },
  {
    id: 'guide-to-budget',
    tab: 'trends',
    title: 'tour.guide_to_budget.title',
    body: 'tour.guide_to_budget.body',
    isGuide: true,
    guideTab: 'budget',
  },
  {
    id: 'budget-income',
    tab: 'budget',
    title: 'tour.budget_income.title',
    body: 'tour.budget_income.body',
  },
  {
    id: 'budget-goals',
    tab: 'budget',
    title: 'tour.budget_goals.title',
    body: 'tour.budget_goals.body',
  },
  {
    id: 'guide-to-profile',
    tab: 'budget',
    title: 'tour.guide_to_profile.title',
    body: 'tour.guide_to_profile.body',
    isGuide: true,
    guideTab: 'profile',
  },
  {
    id: 'profile-streak',
    tab: 'profile',
    title: 'tour.profile_streak.title',
    body: 'tour.profile_streak.body',
  },
  {
    id: 'profile-assessment',
    tab: 'profile',
    title: 'tour.profile_assessment.title',
    body: 'tour.profile_assessment.body',
  },
];

const TOUR_STEP_KEY = 'ledgr_tour_step';
const TOUR_DONE_KEY = 'ledgr_tour_done';
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
  tourActive: false,
  tourStepIndex: -1,
  currentStep: null,
  showOffer: false,
  highlightRect: null,
  setHighlightRect: () => {},
  acceptTour: () => {},
  declineTour: () => {},
  nextStep: () => {},
  skipTour: () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(-1);
  const [showOffer, setShowOffer] = useState(false);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  useEffect(() => {
    async function load() {
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
    }
    load();
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

  const nextStep = useCallback(
    async (navigateToTab?: (tab: string) => void) => {
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
    },
    [tourStepIndex],
  );

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
    <TourContext.Provider
      value={{ tourActive, tourStepIndex, currentStep, showOffer, highlightRect, setHighlightRect, acceptTour, declineTour, nextStep, skipTour }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}

interface TourTargetOptions {
  scrollRef?: RefObject<ScrollView | null>;
  scrollY?: number;
}

/** Attach to a View that should be spotlit when the given tour step is active. */
export function useTourTarget(stepId: string, options: TourTargetOptions = {}) {
  const { currentStep, setHighlightRect } = useTour();
  const ref = useRef<View>(null);

  useEffect(() => {
    if (currentStep?.id !== stepId) return;

    let cancelled = false;
    let raf1 = 0, raf2 = 0;
    let retryTimer = 0;
    const initialScrollY = options.scrollY ?? 0;

    // ── Step 1: instant scroll (no animation) ───────────────────────────────
    // Using animated:false makes the scroll synchronous — no variable-duration
    // animation to race against. The user never sees the jump because the dim
    // overlay is already rendering while measurement is pending.
    if (options.scrollRef) {
      options.scrollRef.current?.scrollTo({ y: initialScrollY, animated: false });
    }

    // ── Step 2: wait for React + native layout to commit the new position ───
    // Two rAFs: (1) after current frame paints, (2) after new layout commits.
    // An extra 80 ms safety buffer handles Android's deferred shadow-tree flush
    // on older devices or long scroll distances.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        retryTimer = setTimeout(() => {
          if (!cancelled) doMeasure(0);
        }, 80) as unknown as number;
      });
    });

    // ── Step 3: measure with retry ──────────────────────────────────────────
    // Retries up to 10 × 60 ms if the element hasn't been laid out yet.
    function doMeasure(attempt: number) {
      if (cancelled) return;
      ref.current?.measureInWindow((x, y, w, h) => {
        if (cancelled) return;

        if ((w === 0 || h === 0) && attempt < 10) {
          retryTimer = setTimeout(() => doMeasure(attempt + 1), 60) as unknown as number;
          return;
        }
        if (w === 0 || h === 0) return; // element not on screen; give up

        // ── Step 4: additional scroll if element is too close to where the
        // tooltip card will appear (bottom ~240 px of screen) ───────────────
        const screenHeight = Dimensions.get('window').height;
        const TOOLTIP_H = 240;
        const MARGIN = 16;
        if (options.scrollRef && (y + h + MARGIN) > (screenHeight - TOOLTIP_H)) {
          const extra = (y + h + MARGIN) - (screenHeight - TOOLTIP_H);
          options.scrollRef.current?.scrollTo({
            y: initialScrollY + extra,
            animated: false,
          });
          // Re-measure after the additional scroll commits
          raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
              if (!cancelled) doMeasure(0);
            });
          });
          return;
        }

        setHighlightRect({
          x: Math.max(0, x - 4),
          y: Math.max(0, y - 4),
          width: w + 8,
          height: h + 8,
        });
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(retryTimer);
    };
  }, [currentStep?.id, stepId, options.scrollRef, options.scrollY, setHighlightRect]);

  return ref;
}
