import type { Transaction, BudgetSettings } from '../types';

// ── Streaks ───────────────────────────────────────────────────────────────────

export function computeStreaks(transactions: Transaction[]): { current: number; best: number } {
  const now = new Date();
  const results: boolean[] = [];

  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const txs = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    });
    if (!txs.length) { results.push(false); continue; }
    const income   = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    results.push(income > 0 && expenses < income);
  }

  let current = 0;
  for (const ok of results) { if (ok) current++; else break; }

  let best = 0, run = 0;
  for (const ok of results) { run = ok ? run + 1 : 0; best = Math.max(best, run); }

  return { current, best };
}

// ── Badges ────────────────────────────────────────────────────────────────────

export interface BadgeParams {
  transactions: Transaction[];
  budget: BudgetSettings;
  score: number;
  bestStreak: number;
}

export interface BadgeDef {
  id: string;
  icon: string;
  label: string;
  description: string;
  check: (p: BadgeParams) => boolean;
}

function peakSavingRate(transactions: Transaction[]): number {
  const map = new Map<string, { inc: number; exp: number }>();
  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = map.get(key) ?? { inc: 0, exp: 0 };
    t.type === 'income' ? (m.inc += t.amount) : (m.exp += t.amount);
    map.set(key, m);
  });
  let best = 0;
  map.forEach(m => { if (m.inc > 0) best = Math.max(best, (m.inc - m.exp) / m.inc); });
  return best;
}

function manualCount(transactions: Transaction[]) {
  return transactions.filter(t => !t.id.includes('_auto_')).length;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first_transaction', icon: '🌱', label: 'First Steps',
    description: 'Logged your first transaction',
    check: ({ transactions }) => manualCount(transactions) >= 1,
  },
  {
    id: 'txn_10', icon: '📝', label: 'Record Keeper',
    description: 'Logged 10+ transactions',
    check: ({ transactions }) => manualCount(transactions) >= 10,
  },
  {
    id: 'txn_50', icon: '📊', label: 'Data Guru',
    description: 'Logged 50+ transactions',
    check: ({ transactions }) => manualCount(transactions) >= 50,
  },
  {
    id: 'budget_set', icon: '🎯', label: 'Budget Planner',
    description: 'Set up a monthly budget',
    check: ({ budget }) => budget.expectedIncome > 0,
  },
  {
    id: 'categories_5', icon: '🗂️', label: 'Diversified',
    description: 'Tracked expenses across 5+ categories',
    check: ({ transactions }) =>
      new Set(transactions.filter(t => t.type === 'expense').map(t => t.category)).size >= 5,
  },
  {
    id: 'saver_10', icon: '💰', label: 'Smart Saver',
    description: 'Saved 10%+ of income in a month',
    check: ({ transactions }) => peakSavingRate(transactions) >= 0.10,
  },
  {
    id: 'saver_20', icon: '🏦', label: 'Super Saver',
    description: 'Saved 20%+ of income in a month',
    check: ({ transactions }) => peakSavingRate(transactions) >= 0.20,
  },
  {
    id: 'streak_3', icon: '🔥', label: 'On a Roll',
    description: '3 consecutive months under budget',
    check: ({ bestStreak }) => bestStreak >= 3,
  },
  {
    id: 'streak_6', icon: '⚡', label: 'On Fire',
    description: '6 consecutive months under budget',
    check: ({ bestStreak }) => bestStreak >= 6,
  },
  {
    id: 'streak_12', icon: '💎', label: 'Unstoppable',
    description: '12 consecutive months under budget',
    check: ({ bestStreak }) => bestStreak >= 12,
  },
  {
    id: 'score_60', icon: '⭐', label: 'Getting There',
    description: 'Reached Fair financial health (60+)',
    check: ({ score }) => score >= 60,
  },
  {
    id: 'score_80', icon: '🌟', label: 'Star Performer',
    description: 'Reached Excellent health (80+)',
    check: ({ score }) => score >= 80,
  },
];

// ── Knowledge Base ────────────────────────────────────────────────────────────

export interface Tip {
  title: string;
  body: string;
  tag: 'critical' | 'fair' | 'excellent';
}

export const TIPS: Tip[] = [
  // Critical (0–59)
  {
    tag: 'critical',
    title: 'Track every purchase for 7 days',
    body: 'Awareness is the first step to change. For one week, log every single purchase — coffee, snacks, rides. Most people are surprised by what they find once it\'s written down.',
  },
  {
    tag: 'critical',
    title: 'The 24-hour rule',
    body: 'Before any non-essential purchase over a small threshold, wait 24 hours. Most impulse urges fade on their own. This one habit can cut unplanned spending by up to 20%.',
  },
  {
    tag: 'critical',
    title: 'Find one subscription to cancel',
    body: 'Check your bank statement for recurring charges. Cancel the service you use least — you\'ll rarely notice it\'s gone, but you will notice the money staying in your account.',
  },
  {
    tag: 'critical',
    title: 'Cook 3 more meals at home this week',
    body: 'Food is often the largest discretionary expense. Home-cooked meals typically cost 60–70% less than eating out. Start with just 3 extra home meals this week.',
  },
  {
    tag: 'critical',
    title: 'Set a weekly spending limit',
    body: 'At the start of each week, decide the maximum you\'ll spend on "wants." Treat it as a hard cap, not a suggestion. Use ledgr\'s categories to track against it daily.',
  },
  // Fair (60–79)
  {
    tag: 'fair',
    title: 'Build a 1-month emergency fund first',
    body: 'Before thinking about investing, save 1 full month of expenses in a separate account you won\'t touch. This safety net stops one bad week from spiralling into debt.',
  },
  {
    tag: 'fair',
    title: 'Automate savings on payday',
    body: 'Set up an automatic transfer to savings the moment you\'re paid. "Pay yourself first" removes willpower from the equation — the money is gone before you can spend it.',
  },
  {
    tag: 'fair',
    title: 'Try the 50 / 30 / 20 rule',
    body: '50% of take-home pay to needs, 30% to wants, 20% to savings and debt. If your wants slice is crowding out savings, that\'s your target to trim.',
  },
  {
    tag: 'fair',
    title: 'Negotiate one regular bill',
    body: 'Phone, internet, and insurance providers routinely offer better rates to customers who ask. A 10-minute call can cut a bill by 15–20% — often just by mentioning a competitor\'s price.',
  },
  {
    tag: 'fair',
    title: 'Review your top spending category',
    body: 'Open the Trends page and find your biggest expense category this month. Ask: what\'s one specific change that would reduce it by 10%? Small, targeted cuts beat vague intentions.',
  },
  // Excellent (80–100)
  {
    tag: 'excellent',
    title: 'Grow your emergency fund to 6 months',
    body: 'You\'re doing great. The next resilience milestone is 6 months of living expenses in an accessible, low-risk account. This protects you through job loss or a major unexpected cost.',
  },
  {
    tag: 'excellent',
    title: 'Put your surplus to work',
    body: 'Money sitting idle in a current account loses real value to inflation every year. Low-cost index funds or ETFs have historically grown wealth significantly over 10+ year horizons.',
  },
  {
    tag: 'excellent',
    title: 'Maximise tax-advantaged accounts',
    body: 'Retirement accounts, ISAs, 401(k)s, CPFs — these accounts offer tax benefits that compound dramatically over decades. Max them out before investing in taxable accounts.',
  },
  {
    tag: 'excellent',
    title: 'Review your insurance annually',
    body: 'As your wealth grows, your coverage needs change. Over-insuring wastes money; under-insuring hides risk. Schedule a 30-minute insurance review every year.',
  },
  {
    tag: 'excellent',
    title: 'Make "Future Me" a monthly ritual',
    body: 'Each month, log one transaction labelled "Future Me" — an extra loan payment, an index fund top-up, or a savings boost. Naming it makes it feel real and keeps momentum going.',
  },
];

export function tipsForScore(score: number): Tip[] {
  if (score < 60) return TIPS.filter(t => t.tag === 'critical');
  if (score < 80) return TIPS.filter(t => t.tag === 'fair');
  return TIPS.filter(t => t.tag === 'excellent');
}
