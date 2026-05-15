import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';

const STORAGE_KEY = 'ledgr_auto_savings_processed';

export default function AutoSavingsProcessor() {
  const { transactions, budget, addTransaction, updateCustomGoal, formatCurrency } = useApp();
  const processed = useRef(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (processed.current) return;
    // Wait until transactions have loaded from localStorage
    if (transactions.length === 0) return;

    processed.current = true;

    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonthKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

    if (localStorage.getItem(STORAGE_KEY) === prevMonthKey) return;

    // Calculate previous month's surplus
    const prevTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });

    const income = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    let surplus = income - expenses;

    localStorage.setItem(STORAGE_KEY, prevMonthKey);

    if (surplus <= 0) return;

    const savingsDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const allocations: { name: string; amount: number }[] = [];

    // 1. Fill active custom goals first (in order)
    const activeGoals = (budget.customGoals ?? []).filter(g => {
      if (g.completedAt) return false;
      const startMs = new Date(g.startDate).getTime();
      const endMs = startMs + g.durationDays * 86400000;
      return Date.now() <= endMs || g.continueAfterComplete;
    });

    for (const goal of activeGoals) {
      if (surplus <= 0.01) break;
      const needed = Math.max(0, goal.targetAmount - goal.savedAmount);
      if (needed <= 0) continue;
      const allocate = Math.min(needed, surplus);
      surplus -= allocate;

      addTransaction({
        type: 'expense',
        amount: allocate,
        category: 'savings',
        description: `Auto-saved for ${goal.name}`,
        date: savingsDate,
        isAutoDebit: false,
        linkedGoalId: goal.id,
      });
      updateCustomGoal(goal.id, { savedAmount: goal.savedAmount + allocate });
      allocations.push({ name: goal.name, amount: allocate });
    }

    // 2. Remaining surplus → monthly savings goal
    if (surplus > 0.01 && budget.savingsGoal?.enabled) {
      addTransaction({
        type: 'expense',
        amount: surplus,
        category: 'savings',
        description: 'Auto-saved to monthly goal',
        date: savingsDate,
        isAutoDebit: false,
        linkedGoalId: '__monthly__',
      });
      allocations.push({ name: 'Monthly Savings', amount: surplus });
    }

    if (allocations.length > 0) {
      const summary = allocations
        .map(a => `${formatCurrency(a.amount)} → ${a.name}`)
        .join(' · ');
      setToast(summary);
      setTimeout(() => setToast(null), 7000);
    }
  }, [transactions, budget, addTransaction, updateCustomGoal, formatCurrency]);

  if (!toast) return null;

  return createPortal(
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-32px)] max-w-[390px] animate-slide-up">
      <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl flex items-start gap-2.5">
        <span className="text-base flex-shrink-0 mt-0.5">🐖</span>
        <div>
          <p className="font-bold mb-0.5">Last month's surplus auto-saved!</p>
          <p className="text-gray-300 dark:text-gray-400 text-xs leading-relaxed">{toast}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
