import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface TourStep {
  id: string;
  page: string;
  selector: string;
  title: string;
  body: string;
  tooltipPos: 'top' | 'bottom';
  isGuide?: boolean;
  guideTo?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'home-green-card',
    page: '/',
    selector: '[data-tour="green-card"]',
    title: 'Your Financial Overview',
    body: 'This card shows your financial status and spending breakdown for the month. The status updates as you log transactions.',
    tooltipPos: 'bottom',
  },
  {
    id: 'home-stats',
    page: '/',
    selector: '[data-tour="stats-row"]',
    title: 'Income, Expenses & Balance',
    body: 'Track your total income, total expenses, and remaining balance at a glance right here.',
    tooltipPos: 'bottom',
  },
  {
    id: 'home-add-tx',
    page: '/',
    selector: '[data-tour="add-transaction"]',
    title: 'Add a Transaction',
    body: 'Tap here to log any income or expense. Select a category, add a note, and set a date to stay organised.',
    tooltipPos: 'bottom',
  },
  {
    id: 'home-capture',
    page: '/',
    selector: '[data-tour="nav-capture"]',
    title: 'Receipt Capture',
    body: 'Snap a photo of any receipt — AI will automatically extract the amount, merchant, and category for you.',
    tooltipPos: 'top',
  },
  {
    id: 'home-budget-btn',
    page: '/',
    selector: '[data-tour="budget-goals-btn"]',
    title: 'Budget & Goals',
    body: 'Set your monthly budget here. Once active, this shows whether you\'re on track or over budget.',
    tooltipPos: 'bottom',
  },
  {
    id: 'home-view-toggle',
    page: '/',
    selector: '[data-tour="view-toggle"]',
    title: 'Category & Date Views',
    body: 'Switch between viewing transactions by category or by date. In date view, the calendar icon lets you browse past months.',
    tooltipPos: 'bottom',
  },
  {
    id: 'guide-to-trends',
    page: '/',
    selector: '[data-tour="nav-trends"]',
    title: 'Explore Your Trends',
    body: 'Tap the Trends icon to see your spending patterns and insights over time.',
    tooltipPos: 'top',
    isGuide: true,
    guideTo: '/trends',
  },
  {
    id: 'trends-top',
    page: '/trends',
    selector: '[data-tour="trends-top"]',
    title: 'Income & Expense Summary',
    body: 'A quick look at your total income and expenses this month, and how they compare to last month.',
    tooltipPos: 'bottom',
  },
  {
    id: 'trends-monthly',
    page: '/trends',
    selector: '[data-tour="trends-monthly"]',
    title: 'Monthly Overview',
    body: 'This bar chart shows how your spending or income changes month by month — spot patterns at a glance.',
    tooltipPos: 'bottom',
  },
  {
    id: 'trends-categories',
    page: '/trends',
    selector: '[data-tour="trends-categories"]',
    title: 'Category Breakdown',
    body: 'See which categories you spend the most on this year. Tap any category to drill into its history.',
    tooltipPos: 'bottom',
  },
  {
    id: 'trends-income-vs',
    page: '/trends',
    selector: '[data-tour="trends-income-vs"]',
    title: 'Income vs Expenses',
    body: 'Compare income and expenses side by side month by month. A widening gap means you\'re saving more!',
    tooltipPos: 'bottom',
  },
  {
    id: 'guide-to-budget',
    page: '/trends',
    selector: '[data-tour="nav-budget"]',
    title: 'Set Your Budget',
    body: 'Tap the Budget icon to create your monthly spending plan and set savings goals.',
    tooltipPos: 'top',
    isGuide: true,
    guideTo: '/budget',
  },
  {
    id: 'budget-income',
    page: '/budget',
    selector: '[data-tour="budget-income"]',
    title: 'Expected Monthly Income',
    body: 'Enter your expected monthly income here. Kachingo uses this to calculate how much you can spend in each category.',
    tooltipPos: 'bottom',
  },
  {
    id: 'budget-goals',
    page: '/budget',
    selector: '[data-tour="budget-goals"]',
    title: 'Savings & Investment Goals',
    body: 'Set monthly savings and investment targets. These are allocated first — pay yourself before you spend.',
    tooltipPos: 'bottom',
  },
  {
    id: 'guide-to-profile',
    page: '/budget',
    selector: '[data-tour="nav-profile"]',
    title: 'Your Profile & Achievements',
    body: 'Tap the Profile icon to see your achievements, badges, and financial health score.',
    tooltipPos: 'top',
    isGuide: true,
    guideTo: '/profile',
  },
  {
    id: 'profile-streak',
    page: '/profile',
    selector: '[data-tour="profile-streak"]',
    title: 'Budget Streak',
    body: 'Stay under budget every month to grow your streak. Consistency is the single most important habit for financial health!',
    tooltipPos: 'bottom',
  },
  {
    id: 'profile-assessment',
    page: '/profile',
    selector: '[data-tour="profile-assessment"]',
    title: 'Financial Assessment',
    body: 'Your overall financial health score, calculated from your savings rate, budget adherence, and spending consistency.',
    tooltipPos: 'top',
  },
];

interface TourContextType {
  tourActive: boolean;
  tourStepIndex: number;
  currentStep: TourStep | null;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextType>({
  tourActive: false,
  tourStepIndex: -1,
  currentStep: null,
  startTour: () => {},
  nextStep: () => {},
  skipTour: () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const [tourActive, setTourActive] = useState(() => {
    const saved = localStorage.getItem('ledgr_tour_step');
    const done = localStorage.getItem('ledgr_tour_done');
    return !!saved && !done;
  });

  const [tourStepIndex, setTourStepIndex] = useState(() => {
    const saved = localStorage.getItem('ledgr_tour_step');
    return saved ? parseInt(saved, 10) : -1;
  });

  const currentStep = tourActive && tourStepIndex >= 0 && tourStepIndex < TOUR_STEPS.length
    ? TOUR_STEPS[tourStepIndex]
    : null;

  useEffect(() => {
    if (!tourActive || !currentStep?.isGuide) return;
    if (location.pathname === currentStep.guideTo) {
      const next = tourStepIndex + 1;
      setTourStepIndex(next);
      localStorage.setItem('ledgr_tour_step', String(next));
    }
  }, [location.pathname]);

  const startTour = useCallback(() => {
    setTourActive(true);
    setTourStepIndex(0);
    localStorage.setItem('ledgr_tour_step', '0');
    localStorage.removeItem('ledgr_tour_done');
  }, []);

  const nextStep = useCallback(() => {
    const next = tourStepIndex + 1;
    if (next >= TOUR_STEPS.length) {
      setTourActive(false);
      setTourStepIndex(-1);
      localStorage.setItem('ledgr_tour_done', '1');
      localStorage.removeItem('ledgr_tour_step');
    } else {
      setTourStepIndex(next);
      localStorage.setItem('ledgr_tour_step', String(next));
    }
  }, [tourStepIndex]);

  const skipTour = useCallback(() => {
    setTourActive(false);
    setTourStepIndex(-1);
    localStorage.setItem('ledgr_tour_done', '1');
    localStorage.removeItem('ledgr_tour_step');
  }, []);

  return (
    <TourContext.Provider value={{ tourActive, tourStepIndex, currentStep, startTour, nextStep, skipTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
