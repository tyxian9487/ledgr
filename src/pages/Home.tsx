import { useState } from 'react';
import { Plus, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GreenCard from '../components/home/GreenCard';
import Categories from '../components/home/Categories';
import ManualEntryModal from '../components/home/ManualEntryModal';
import { useApp } from '../context/AppContext';

export default function Home() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showEntry, setShowEntry] = useState(false);
  const { budget, getMonthExpenses, userProfile } = useApp();

  function handlePrev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function handleNext() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const hasBudget = budget.expectedIncome > 0 && budget.allocations.length > 0;
  const totalExpenses = getMonthExpenses(now.getFullYear(), now.getMonth());
  const totalBudget = hasBudget
    ? budget.allocations.reduce((s, a) => s + (budget.expectedIncome * a.percentage / 100), 0)
    : 0;
  const budgetUsedPct = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
  const isOverBudget = hasBudget && totalExpenses > totalBudget;
  const isOnTrack = hasBudget && !isOverBudget;

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Good {getGreeting()}</p>
          <h1 className="text-xl font-bold dark:text-white">My Finances</h1>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 overflow-hidden flex items-center justify-center active:scale-90 transition-transform"
        >
          {userProfile.avatar
            ? <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
            : <span className="text-green-700 dark:text-green-400 font-bold text-sm">{userProfile.name.charAt(0).toUpperCase()}</span>
          }
        </button>
      </div>

      {/* Green summary card */}
      <GreenCard year={year} month={month} onPrev={handlePrev} onNext={handleNext} />

      {/* Action buttons row */}
      <div className="mx-4 mt-4 space-y-3">
        {/* Add Transaction */}
        <button
          type="button"
          onClick={() => setShowEntry(true)}
          className="w-full flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3.5 shadow-sm border border-gray-50 dark:border-gray-800 active:scale-[0.98] transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <Plus size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Add Transaction</span>
          <span className="ml-auto text-xs text-gray-300 dark:text-gray-600">Tap to record</span>
        </button>

        {/* Budget Status Card */}
        <button
          type="button"
          onClick={() => navigate('/budget')}
          className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm active:scale-[0.98] transition-all border ${
            !hasBudget
              ? 'bg-white dark:bg-gray-900 border-gray-50 dark:border-gray-800'
              : isOverBudget
              ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40'
              : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/40'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            !hasBudget
              ? 'bg-gray-100 dark:bg-gray-800'
              : isOverBudget
              ? 'bg-red-500'
              : 'bg-green-600'
          }`}>
            <Target size={16} className="text-white" strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${
                !hasBudget
                  ? 'text-gray-600 dark:text-gray-300'
                  : isOverBudget
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {!hasBudget ? 'Set Budget & Goals' : isOverBudget ? 'Over Budget' : 'On Track'}
              </span>
              {hasBudget && (
                <span className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                  {budgetUsedPct.toFixed(0)}% used
                </span>
              )}
            </div>

            {hasBudget ? (
              <div className="mt-1.5">
                <div className="h-1.5 bg-white/60 dark:bg-gray-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    ${Math.round(totalExpenses).toLocaleString()} spent
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    ${Math.round(totalBudget).toLocaleString()} budget
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5 text-left">Tap to set financial goals</p>
            )}
          </div>

          {hasBudget ? (
            isOverBudget
              ? <TrendingDown size={18} className="text-red-400 flex-shrink-0" />
              : <TrendingUp size={18} className="text-green-500 flex-shrink-0" />
          ) : (
            <span className="ml-auto text-xs text-gray-300 dark:text-gray-600 flex-shrink-0">Set up</span>
          )}
        </button>
      </div>

      {/* Categories section */}
      <div className="mx-4 mt-5 mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Categories</h2>
      </div>

      <Categories year={year} month={month} />

      {showEntry && <ManualEntryModal onClose={() => setShowEntry(false)} />}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
