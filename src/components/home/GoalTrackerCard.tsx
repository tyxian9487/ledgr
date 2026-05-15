import { useState, useEffect } from 'react';
import { Activity, ChevronLeft, ChevronRight, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { iconMap } from './CategoryIcon';
import StatusCelebration from '../StatusCelebration';

interface Props {
  year: number;
  month: number;
}

interface GoalEntry {
  id: string;
  title: string;
  subtitle: string;
  iconKey: string;
  color: string;
  actualAmount: number;
  goalAmount: number;
  progress: number;
  isCustom: boolean;
}

function getMonthlyCustomProgress(savedAmount: number, targetAmount: number, durationDays: number, startDate: string) {
  const durationMonths = Math.max(1, Math.round(durationDays / 30));
  const monthlyTarget = targetAmount / durationMonths;
  const elapsedDays = (Date.now() - new Date(startDate).getTime()) / 86400000;
  const currentMonthIdx = Math.min(Math.floor(Math.max(0, elapsedDays) / 30), durationMonths - 1);
  const monthSaved = Math.max(0, Math.min(monthlyTarget, savedAmount - currentMonthIdx * monthlyTarget));
  return { monthlyTarget, monthSaved, currentMonthIdx, durationMonths };
}

export default function GoalTrackerCard({ year, month }: Props) {
  const navigate = useNavigate();
  const { budget, getMonthTransactions, formatCurrency, updateCustomGoal } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedGoals, setCelebratedGoals] = useState<Set<string>>(new Set());
  const [contribution, setContribution] = useState('');
  const [showContrib, setShowContrib] = useState(false);

  const savingsGoal = budget.savingsGoal;
  const txs = getMonthTransactions(year, month);
  const allGoals: GoalEntry[] = [];

  if (savingsGoal?.enabled) {
    const actualAmount = txs.filter(t => t.category === 'savings').reduce((sum, t) => sum + t.amount, 0);
    const goalAmount = savingsGoal.amount || 0;
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    allGoals.push({
      id: 'savings', title: 'Monthly Savings', subtitle: monthName,
      iconKey: 'PiggyBank', color: '#22c55e',
      actualAmount, goalAmount,
      progress: goalAmount > 0 ? Math.min((actualAmount / goalAmount) * 100, 100) : 0,
      isCustom: false,
    });
  }

  for (const goal of budget.customGoals ?? []) {
    const { monthlyTarget, monthSaved, currentMonthIdx, durationMonths } = getMonthlyCustomProgress(
      goal.savedAmount, goal.targetAmount, goal.durationDays, goal.startDate
    );
    allGoals.push({
      id: goal.id, title: goal.name,
      subtitle: `Month ${currentMonthIdx + 1} of ${durationMonths}`,
      iconKey: goal.icon, color: goal.color,
      actualAmount: monthSaved, goalAmount: monthlyTarget,
      progress: monthlyTarget > 0 ? Math.min((monthSaved / monthlyTarget) * 100, 100) : 0,
      isCustom: true,
    });
  }

  if (allGoals.length === 0) return null;

  const safeIdx = Math.min(currentIdx, allGoals.length - 1);
  const goal = allGoals[safeIdx];
  const isCompleted = goal.progress >= 100 && goal.goalAmount > 0;

  useEffect(() => {
    if (isCompleted) {
      const goalKey = `${year}-${month}-${goal.id}`;
      if (!celebratedGoals.has(goalKey)) {
        setCelebratedGoals(prev => new Set([...prev, goalKey]));
        setShowCelebration(true);
        if ('vibrate' in navigator) navigator.vibrate(200);
      }
    }
  }, [isCompleted, goal.id, year, month, celebratedGoals]);

  function prev() { setCurrentIdx(i => (i - 1 + allGoals.length) % allGoals.length); setShowContrib(false); }
  function next() { setCurrentIdx(i => (i + 1) % allGoals.length); setShowContrib(false); }

  function handleContribute() {
    const amt = parseFloat(contribution);
    if (!isNaN(amt) && amt > 0 && goal.isCustom) {
      const g = (budget.customGoals ?? []).find(g => g.id === goal.id);
      if (g) updateCustomGoal(goal.id, { savedAmount: g.savedAmount + amt });
      setContribution('');
      setShowContrib(false);
    }
  }

  const GoalIcon = iconMap[goal.iconKey] || PiggyBank;

  return (
    <>
      <div className="mx-4 mt-4 rounded-2xl glass p-4">
        <div className="flex items-center gap-3">
          {allGoals.length > 1 ? (
            <button type="button" onClick={prev}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0 opacity-60">
              <ChevronLeft size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: goal.color + '20' }}>
              <GoalIcon size={20} style={{ color: goal.color }} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {allGoals.length > 1 && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                style={{ background: goal.color + '20' }}>
                <GoalIcon size={16} style={{ color: goal.color }} />
              </div>
            )}

            <div className="flex items-center gap-1.5 mb-0.5">
              {goal.isCustom ? (
                <button type="button" onClick={() => navigate(`/goals/${goal.id}`)}
                  className="text-sm font-bold dark:text-white truncate text-left">
                  {goal.title}
                </button>
              ) : (
                <h3 className="text-sm font-bold dark:text-white truncate">{goal.title}</h3>
              )}
              <Activity size={13} className="opacity-50 flex-shrink-0" style={{ color: goal.color }} />
            </div>
            <p className="text-[11px] text-gray-400 mb-1.5">{goal.subtitle}</p>

            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${goal.progress}%`, background: goal.color }} />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatCurrency(goal.actualAmount)} / {formatCurrency(goal.goalAmount)}
              </span>
              <span className="text-xs font-semibold" style={{ color: goal.color }}>
                {goal.progress.toFixed(0)}%
              </span>
            </div>

            {goal.isCustom && (
              <div className="mt-2">
                {showContrib ? (
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="Amount" value={contribution}
                      onChange={e => setContribution(e.target.value)}
                      className="flex-1 text-xs px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none dark:text-white"
                      inputMode="decimal" />
                    <button type="button" onClick={handleContribute}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: goal.color }}>Add</button>
                    <button type="button" onClick={() => setShowContrib(false)}
                      className="px-2 py-1.5 rounded-xl text-xs text-gray-400 bg-gray-100 dark:bg-gray-800">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setShowContrib(true)}
                      className="text-xs font-semibold px-3 py-1 rounded-xl border border-dashed"
                      style={{ color: goal.color, borderColor: goal.color + '60' }}>
                      + Log savings
                    </button>
                    <button type="button" onClick={() => navigate(`/goals/${goal.id}`)}
                      className="text-xs text-gray-400">
                      See all months →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {allGoals.length > 1 && (
            <button type="button" onClick={next}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0 opacity-60">
              <ChevronRight size={14} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>

        {allGoals.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {allGoals.map((_, i) => (
              <button key={i} type="button" onClick={() => { setCurrentIdx(i); setShowContrib(false); }}
                className="rounded-full transition-all"
                style={{ width: i === safeIdx ? 16 : 6, height: 6, background: i === safeIdx ? goal.color : '#d1d5db' }} />
            ))}
          </div>
        )}
      </div>

      {showCelebration && (
        <StatusCelebration status="excellent" onClose={() => setShowCelebration(false)} />
      )}
    </>
  );
}
