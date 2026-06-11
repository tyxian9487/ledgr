import { NativeModules, Platform } from 'react-native';
import { EXPENSE_CATEGORIES } from '../types';

export interface WidgetData {
  income: number;
  expenses: number;
  remaining: number;
  currencySymbol: string;
  slices: { color: string; percent: number; label: string }[];
  monthlySavings: { enabled: boolean; target: number; saved: number } | null;
  customGoal: { name: string; target: number; saved: number; color: string } | null;
  updatedAt: string;
}

/**
 * Writes current-month financial data to platform shared storage so home
 * screen widgets can read it (iOS App Group UserDefaults / Android SharedPrefs).
 * No-ops gracefully if the native bridge is unavailable (Expo Go, simulator).
 */
export function updateWidgetData(data: WidgetData) {
  try {
    const json = JSON.stringify(data);
    const mod = NativeModules.KachingoWidgetBridge;
    if (mod?.updateWidgetData) {
      mod.updateWidgetData(json);
    }
  } catch {}
}

export function buildWidgetData(params: {
  transactions: { type: string; category: string; amount: number; date: string }[];
  year: number;
  month: number;
  currencySymbol: string;
  savingsGoal?: { enabled: boolean; amount: number; mode: 'pct' | 'fixed' };
  expectedIncome: number;
  customGoals?: { name: string; targetAmount: number; savedAmount: number; color: string }[];
}): WidgetData {
  const { transactions, year, month, currencySymbol, savingsGoal, expectedIncome, customGoals } = params;

  const monthTxs = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const catTotals: Record<string, number> = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const slices = EXPENSE_CATEGORIES.filter(c => catTotals[c.id]).map(c => ({
    color: c.color,
    percent: expenses > 0 ? (catTotals[c.id] / expenses) * 100 : 0,
    label: c.label,
  }));

  let monthlySavings: WidgetData['monthlySavings'] = null;
  if (savingsGoal?.enabled) {
    const target = savingsGoal.mode === 'pct'
      ? expectedIncome * (savingsGoal.amount / 100)
      : savingsGoal.amount;
    monthlySavings = { enabled: true, target, saved: income - expenses };
  }

  const firstCustomGoal = customGoals?.[0] ?? null;
  const customGoal = firstCustomGoal
    ? { name: firstCustomGoal.name, target: firstCustomGoal.targetAmount, saved: firstCustomGoal.savedAmount, color: firstCustomGoal.color }
    : null;

  return {
    income,
    expenses,
    remaining: income - expenses,
    currencySymbol,
    slices,
    monthlySavings,
    customGoal,
    updatedAt: new Date().toISOString(),
  };
}
