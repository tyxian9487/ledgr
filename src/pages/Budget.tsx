import { useState } from 'react';
import { ChevronLeft, ChevronRight, Target, TrendingUp, Edit3, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function Budget() {
  const { getMonthIncome, getMonthExpenses, budgetGoals, updateBudgetGoals } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [editingSavings, setEditingSavings] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(false);
  const [savingsInput, setSavingsInput] = useState(String(budgetGoals.savingsGoal));
  const [investmentInput, setInvestmentInput] = useState(String(budgetGoals.investmentGoal));

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const income = getMonthIncome(year, month);
  const expenses = getMonthExpenses(year, month);
  const savings = budgetGoals.savingsGoal;
  const investment = budgetGoals.investmentGoal;
  const remaining = Math.max(0, income - expenses - savings - investment);

  const total = income > 0 ? income : 1;
  const expPct = Math.min(100, (expenses / total) * 100);
  const savPct = Math.min(100 - expPct, (savings / total) * 100);
  const invPct = Math.min(100 - expPct - savPct, (investment / total) * 100);
  const remPct = Math.max(0, 100 - expPct - savPct - invPct);

  function saveSavings() {
    const val = parseFloat(savingsInput);
    if (!isNaN(val) && val >= 0) updateBudgetGoals({ savingsGoal: val });
    setEditingSavings(false);
  }
  function saveInvestment() {
    const val = parseFloat(investmentInput);
    if (!isNaN(val) && val >= 0) updateBudgetGoals({ investmentGoal: val });
    setEditingInvestment(false);
  }

  const savingsPct = income > 0 ? Math.min(100, Math.round((savings / income) * 100)) : 0;
  const investmentPct = income > 0 ? Math.min(100, Math.round((investment / income) * 100)) : 0;

  return (
    <div className="pb-28 overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold dark:text-white">Budget</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Plan and track your monthly goals</p>
      </div>

      {/* Month navigator */}
      <div className="mx-4 mb-4 flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 shadow-sm border border-gray-50 dark:border-gray-800">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-90 transition-transform">
          <ChevronLeft size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
        <span className="font-semibold text-sm dark:text-white">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:scale-90 transition-transform">
          <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Income summary */}
      <div className="mx-4 mb-4 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-4 shadow-lg shadow-green-600/20">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-green-100" />
          <span className="text-xs text-green-100 font-semibold uppercase tracking-wide">Monthly Income</span>
        </div>
        <p className="text-3xl font-black text-white">${fmt(income)}</p>
        <p className="text-xs text-green-100 mt-1">
          {income > 0
            ? `$${fmt(remaining)} available after expenses & goals`
            : 'No income recorded this month'}
        </p>
      </div>

      {/* Budget Allocation Summary */}
      <div className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 text-left">Budget Allocation</h2>

        {/* Stacked bar */}
        <div className="h-5 rounded-full overflow-hidden flex mb-3">
          {expPct > 0 && (
            <div className="h-full bg-red-500 transition-all" style={{ width: `${expPct}%` }} />
          )}
          {savPct > 0 && (
            <div className="h-full bg-green-500 transition-all" style={{ width: `${savPct}%` }} />
          )}
          {invPct > 0 && (
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${invPct}%` }} />
          )}
          {remPct > 0 && (
            <div className="h-full bg-gray-200 dark:bg-gray-700 transition-all" style={{ width: `${remPct}%` }} />
          )}
          {income === 0 && (
            <div className="h-full w-full bg-gray-200 dark:bg-gray-700" />
          )}
        </div>

        {/* Legend — all left-aligned */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400 text-left">Expenses</span>
            </div>
            <span className="text-xs font-semibold dark:text-white">${fmt(expenses)} ({income > 0 ? Math.round(expPct) : 0}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400 text-left">Savings Goal</span>
            </div>
            <span className="text-xs font-semibold dark:text-white">${fmt(savings)} ({income > 0 ? Math.round(savPct) : 0}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400 text-left">Investment Goal</span>
            </div>
            <span className="text-xs font-semibold dark:text-white">${fmt(investment)} ({income > 0 ? Math.round(invPct) : 0}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400 text-left">Remaining</span>
            </div>
            <span className="text-xs font-semibold dark:text-white">${fmt(remaining)} ({income > 0 ? Math.round(remPct) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="mx-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 text-left">Monthly Goals</h2>

        <div className="space-y-3">
          {/* Savings Goal card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
            <div className="flex items-start justify-between mb-2">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <Target size={14} className="text-green-600" />
                  <span className="text-sm font-bold dark:text-white text-left">Savings Goal</span>
                </div>
                <p className="text-xs text-gray-400 text-left">Money set aside each month for savings</p>
              </div>
              {editingSavings ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    value={savingsInput}
                    onChange={e => setSavingsInput(e.target.value)}
                    className="w-20 text-sm font-bold border-b-2 border-green-600 bg-transparent dark:text-white outline-none text-right"
                    autoFocus
                    onBlur={saveSavings}
                    onKeyDown={e => e.key === 'Enter' && saveSavings()}
                    inputMode="decimal"
                  />
                  <button onClick={saveSavings} className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setSavingsInput(String(budgetGoals.savingsGoal)); setEditingSavings(true); }}
                  className="flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <span className="text-lg font-black text-green-600">${fmt(savings)}</span>
                  <Edit3 size={13} className="text-gray-400" />
                </button>
              )}
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${savingsPct}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 text-left">{savingsPct}% of monthly income</p>
          </div>

          {/* Investment Goal card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
            <div className="flex items-start justify-between mb-2">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <TrendingUp size={14} className="text-blue-500" />
                  <span className="text-sm font-bold dark:text-white text-left">Investment Goal</span>
                </div>
                <p className="text-xs text-gray-400 text-left">Monthly amount allocated for investments</p>
              </div>
              {editingInvestment ? (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    value={investmentInput}
                    onChange={e => setInvestmentInput(e.target.value)}
                    className="w-20 text-sm font-bold border-b-2 border-blue-500 bg-transparent dark:text-white outline-none text-right"
                    autoFocus
                    onBlur={saveInvestment}
                    onKeyDown={e => e.key === 'Enter' && saveInvestment()}
                    inputMode="decimal"
                  />
                  <button onClick={saveInvestment} className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setInvestmentInput(String(budgetGoals.investmentGoal)); setEditingInvestment(true); }}
                  className="flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <span className="text-lg font-black text-blue-500">${fmt(investment)}</span>
                  <Edit3 size={13} className="text-gray-400" />
                </button>
              )}
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${investmentPct}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 text-left">{investmentPct}% of monthly income</p>
          </div>
        </div>
      </div>

      {/* 50/30/20 tip */}
      <div className="mx-4 mb-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30">
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5 text-left">50/30/20 Rule</p>
        <div className="space-y-1">
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 text-left"><span className="font-semibold">50%</span> — Needs (rent, food, utilities)</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 text-left"><span className="font-semibold">30%</span> — Wants (dining, entertainment)</p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 text-left"><span className="font-semibold">20%</span> — Savings &amp; investments</p>
        </div>
      </div>
    </div>
  );
}
