import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
    title: 'Your Financial Overview',
    body: 'This card shows your financial status and spending breakdown for the month. The status updates as you log transactions.',
  },
  {
    id: 'home-stats',
    tab: 'home',
    title: 'Income, Expenses & Balance',
    body: 'Track your total income, total expenses, and remaining balance at a glance right here.',
  },
  {
    id: 'home-add-tx',
    tab: 'home',
    title: 'Add a Transaction',
    body: 'Tap "Add Transaction" to log any income or expense. Select a category, add a note, and set a date to stay organised.',
  },
  {
    id: 'home-capture',
    tab: 'home',
    title: 'Receipt Capture',
    body: 'Snap a photo of any receipt — AI will automatically extract the amount, merchant, and category for you.',
  },
  {
    id: 'home-budget-btn',
    tab: 'home',
    title: 'Budget & Goals',
    body: "Tap \"Set Budget & Goals\" to set your monthly budget. Once active, this shows whether you're on track or over budget.",
  },
  {
    id: 'home-view-toggle',
    tab: 'home',
    title: 'Category & Date Views',
    body: 'Switch between viewing transactions by category or by date. The calendar icon lets you browse past months.',
  },
  {
    id: 'guide-to-trends',
    tab: 'home',
    title: 'Explore Your Trends',
    body: "Next, let's see your spending patterns. Tap \"Next\" to head to the Trends tab.",
    isGuide: true,
    guideTab: 'trends',
  },
  {
    id: 'trends-top',
    tab: 'trends',
    title: 'Income & Expense Summary',
    body: 'A quick look at your total income and expenses this month, and how they compare to last month.',
  },
  {
    id: 'trends-monthly',
    tab: 'trends',
    title: 'Monthly Overview',
    body: 'This bar chart shows how your spending or income changes month by month — spot patterns at a glance.',
  },
  {
    id: 'trends-categories',
    tab: 'trends',
    title: 'Category Breakdown',
    body: 'See which categories you spend the most on this year. Tap any category to drill into its history.',
  },
  {
    id: 'trends-income-vs',
    tab: 'trends',
    title: 'Income vs Expenses',
    body: "Compare income and expenses side by side month by month. A widening gap means you're saving more!",
  },
  {
    id: 'guide-to-budget',
    tab: 'trends',
    title: 'Set Your Budget',
    body: "Next, let's set up your budget. Tap \"Next\" to head to the Budget tab.",
    isGuide: true,
    guideTab: 'budget',
  },
  {
    id: 'budget-income',
    tab: 'budget',
    title: 'Expected Monthly Income',
    body: 'Enter your expected monthly income here. Kachingo uses this to calculate how much you can spend in each category.',
  },
  {
    id: 'budget-goals',
    tab: 'budget',
    title: 'Goals',
    body: "Set your monthly savings target and track custom goals. Goals are deducted first — pay yourself before you spend.",
  },
  {
    id: 'guide-to-profile',
    tab: 'budget',
    title: 'Your Profile & Achievements',
    body: "Finally, let's check your profile. Tap \"Next\" to head to the Profile tab.",
    isGuide: true,
    guideTab: 'profile',
  },
  {
    id: 'profile-streak',
    tab: 'profile',
    title: 'Budget Streak',
    body: 'Stay under budget every month to grow your streak. Consistency is the single most important habit for financial health!',
  },
  {
    id: 'profile-assessment',
    tab: 'profile',
    title: 'Financial Assessment',
    body: "Your overall financial health score, calculated from your savings rate, budget adherence, and spending consistency. You're all set!",
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
  acceptTour: () => {},
  declineTour: () => {},
  nextStep: () => {},
  skipTour: () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(-1);
  const [showOffer, setShowOffer] = useState(false);

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
    setTourActive(false);
    setTourStepIndex(-1);
    await Promise.all([
      AsyncStorage.setItem(TOUR_DONE_KEY, '1'),
      AsyncStorage.removeItem(TOUR_STEP_KEY),
    ]);
  }, []);

  return (
    <TourContext.Provider
      value={{ tourActive, tourStepIndex, currentStep, showOffer, acceptTour, declineTour, nextStep, skipTour }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
