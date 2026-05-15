import { useState, useEffect } from 'react';
import { Activity, ChevronDown, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
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
  const { budget, getMonthTransactions, formatCurrency } = useApp();
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedGoals, setCelebratedGoals] = useState<Set<string>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);

  const savingsGoal = budget.savingsGoal;
  const txs = getMonthTransactions(year, month);
  const allGoals: GoalEntry[] = [];

  if (savingsGoal?.enabled) {
    const actualAmount = txs
      .filter(t => t.category === 'savings' && (!t.linkedGoalId || t.linkedGoalId === '__monthly__'))
      .reduce((sum, t) => sum + t.amount, 0);
    const goalAmount = savingsGoal.amount || 0;
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    allGoals.push({
      id: 'savings', title: t('gtc.monthly'), subtitle: monthName,
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
      subtitle: t('gtc.month_of', { x: currentMonthIdx + 1, y: durationMonths }),
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

  const GoalIcon = iconMap[goal.iconKey] || PiggyBank;

  return (
    <>
      <div className="mx-4 mt-3 rounded-2xl glass p-3">

        {/* Goal selector dropdown — only when multiple goals */}
        {allGoals.length > 1 && (
          <div className="relative mb-2">
            <button
              type="button"
              onClick={() => setShowDropdown(v => !v)}
              className="flex items-center gap-1.5 w-full"
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: goal.color + '25' }}>
                <GoalIcon size={11} style={{ color: goal.color }} />
              </div>
              <span className="text-[11px] font-bold dark:text-white truncate flex-1 text-left">{goal.title}</span>
              <ChevronDown size={12} className={`text-gray-400 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden z-20">
                {allGoals.map((g, i) => {
                  const GIcon = iconMap[g.iconKey] || PiggyBank;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => { setCurrentIdx(i); setShowDropdown(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: g.color + '25' }}>
                        <GIcon size={11} style={{ color: g.color }} />
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-200 flex-1 text-left truncate">{g.title}</span>
                      {i === safeIdx && <span className="text-green-600 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Goal body */}
        <div className="flex items-center gap-3">
          {allGoals.length === 1 && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: goal.color + '20' }}>
              <GoalIcon size={16} style={{ color: goal.color }} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {allGoals.length === 1 && (
              <div className="flex items-center gap-1.5 mb-0.5">
                {goal.isCustom ? (
                  <button type="button" onClick={() => navigate(`/goals/${goal.id}`)}
                    className="text-xs font-bold dark:text-white truncate text-left">
                    {goal.title}
                  </button>
                ) : (
                  <h3 className="text-xs font-bold dark:text-white truncate">{goal.title}</h3>
                )}
                <Activity size={11} className="opacity-50 flex-shrink-0" style={{ color: goal.color }} />
              </div>
            )}
            <p className="text-[10px] text-gray-400 mb-1">{goal.subtitle}</p>

            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${goal.progress}%`, background: goal.color }} />
            </div>
            <div className="flex justify-between items-center mt-0.5">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatCurrency(goal.actualAmount)} / {formatCurrency(goal.goalAmount)}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: goal.color }}>
                {goal.progress.toFixed(0)}%
              </span>
            </div>

            {goal.isCustom && (
              <button type="button" onClick={() => navigate(`/goals/${goal.id}`)}
                className="mt-1.5 text-[10px] font-semibold" style={{ color: goal.color }}>
                {t('gtc.see_all')}
              </button>
            )}
          </div>
        </div>
      </div>

      {showCelebration && (
        <StatusCelebration status="excellent" onClose={() => setShowCelebration(false)} />
      )}
    </>
  );
}
