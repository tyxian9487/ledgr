import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, PiggyBank } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { iconMap } from '../components/home/CategoryIcon';
import ManualEntryModal from '../components/home/ManualEntryModal';
import GoalCelebration from '../components/GoalCelebration';

const MS_PER_MONTH = 30 * 86400000;

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { budget, transactions, updateCustomGoal, formatCurrency } = useApp();

  const [showModal, setShowModal] = useState(false);

  const goal = budget.customGoals?.find(g => g.id === id);

  useEffect(() => {
    if (budget.customGoals !== undefined && !budget.customGoals.find(g => g.id === id)) {
      navigate('/budget');
    }
  }, [budget.customGoals, id, navigate]);

  if (!goal) return null;

  const GoalIcon = iconMap[goal.icon] || PiggyBank;

  const durationMonths = Math.max(1, Math.round(goal.durationDays / 30));
  // Normalize to local midnight so transactions logged on the same calendar day
  // as goal creation are always within Month 1 (avoids time-of-day mismatch).
  const startDateObj = new Date(goal.startDate);
  const startTime = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate()).getTime();
  const elapsedDays = (Date.now() - startTime) / 86400000;
  const currentMonthIdx = Math.min(Math.floor(Math.max(0, elapsedDays) / 30), durationMonths - 1);

  // All transactions credited to this goal
  const goalTxs = transactions.filter(t => t.linkedGoalId === goal.id);
  const hasTransactionData = goalTxs.length > 0;

  function getMonthSaved(monthIdx: number): number {
    const monthStart = startTime + monthIdx * MS_PER_MONTH;
    const monthEnd = startTime + (monthIdx + 1) * MS_PER_MONTH;
    return goalTxs
      .filter(t => {
        const d = new Date(t.date).getTime();
        return d >= monthStart && d < monthEnd;
      })
      .reduce((s, t) => s + t.amount, 0);
  }

  // Build per-month data with carry-forward deficit/surplus
  const baseMonthly = goal.targetAmount / durationMonths;

  interface MonthData {
    adjustedTarget: number;
    actualSaved: number;
    progress: number;
    isComplete: boolean;
    isDeficit: boolean;
  }

  const monthData: MonthData[] = [];
  let carryover = 0; // positive = surplus (saved ahead), negative = deficit (behind)

  for (let i = 0; i < durationMonths; i++) {
    const adjustedTarget = Math.max(0, baseMonthly - carryover);
    let actualSaved = 0;

    if (hasTransactionData) {
      actualSaved = getMonthSaved(i);
    } else {
      // Fallback for goals without linked transactions: mathematical distribution
      if (i < currentMonthIdx) {
        actualSaved = Math.min(adjustedTarget, baseMonthly); // assume on track
      } else if (i === currentMonthIdx) {
        const pastEstimate = Math.min(goal.savedAmount, i * baseMonthly);
        actualSaved = Math.max(0, goal.savedAmount - pastEstimate);
      }
    }

    const progress = adjustedTarget > 0 ? Math.min(1, actualSaved / adjustedTarget) : 1;
    const isPast = i < currentMonthIdx;
    const isComplete = isPast && actualSaved >= adjustedTarget;
    const isDeficit = isPast && hasTransactionData && actualSaved < adjustedTarget;

    monthData.push({ adjustedTarget, actualSaved, progress, isComplete, isDeficit });

    if (isPast && hasTransactionData) {
      carryover = actualSaved - adjustedTarget;
    }
  }

  const isGoalComplete = goal.savedAmount >= goal.targetAmount;
  const overallProgress = Math.min(1, goal.targetAmount > 0 ? goal.savedAmount / goal.targetAmount : 0);
  const showCelebration = isGoalComplete && !goal.completedAt && !goal.continueAfterComplete;

  function handleContinueSaving() {
    updateCustomGoal(goal!.id, { continueAfterComplete: true });
  }

  function handleMarkDone() {
    updateCustomGoal(goal!.id, { completedAt: new Date().toISOString() });
  }

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-950" style={{ height: '100dvh', overflowY: 'auto' }}>

      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-12 pb-5 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800"
        style={{ background: goal.color + '15' }}
      >
        <button
          type="button"
          onClick={() => navigate('/budget')}
          className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
        </button>

        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: goal.color + '25' }}
        >
          <GoalIcon size={22} color={goal.color} strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{goal.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {durationMonths} month{durationMonths !== 1 ? 's' : ''} · {formatCurrency(baseMonthly)}/mo base
          </p>
        </div>

        {goal.completedAt && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: goal.color }}>
            Done 🏆
          </span>
        )}
      </div>

      {/* Snake path */}
      <div className="flex flex-col items-center px-6 pt-8 pb-4 gap-0">
        {Array.from({ length: durationMonths }, (_, i) => {
          const m = monthData[i];
          const isCurrent = i === currentMonthIdx;
          const isFuture = i > currentMonthIdx;
          const circleSize = 72;
          const radius = (circleSize - 8) / 2;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference * (1 - m.progress);

          // Colour for each month type
          const ringColor = m.isDeficit ? '#f59e0b' : goal.color;

          return (
            <div key={i} className="flex flex-col items-center w-full max-w-xs">
              {i > 0 && (
                <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-200 dark:border-gray-700" />
              )}

              {/* Month circle */}
              <div className="relative flex items-center justify-center">
                {m.isComplete ? (
                  // Past month — fully hit target: green check
                  <div
                    className="flex items-center justify-center rounded-full shadow-md"
                    style={{ width: circleSize, height: circleSize, backgroundColor: goal.color }}
                  >
                    <Check size={28} color="white" strokeWidth={2.5} />
                  </div>
                ) : m.isDeficit ? (
                  // Past month — deficit: amber partial ring
                  <div
                    className="relative flex items-center justify-center"
                    style={{ width: circleSize, height: circleSize, filter: `drop-shadow(0 0 6px #f59e0b60)` }}
                  >
                    <svg width={circleSize} height={circleSize} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={circleSize / 2} cy={circleSize / 2} r={radius} fill="none" stroke="#f59e0b25" strokeWidth={6} />
                      <circle cx={circleSize / 2} cy={circleSize / 2} r={radius} fill="none" stroke="#f59e0b" strokeWidth={6}
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                    </svg>
                    <div className="relative flex flex-col items-center z-10">
                      <span className="text-xs font-bold leading-none text-amber-500">M{i + 1}</span>
                      <span className="text-[10px] text-gray-400 leading-none mt-0.5">-{formatCurrency(m.adjustedTarget - m.actualSaved)}</span>
                    </div>
                  </div>
                ) : isCurrent ? (
                  // Current month: goal-colour ring
                  <div
                    className="relative flex items-center justify-center"
                    style={{ width: circleSize, height: circleSize, filter: `drop-shadow(0 0 8px ${goal.color}60)` }}
                  >
                    <svg width={circleSize} height={circleSize} className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={circleSize / 2} cy={circleSize / 2} r={radius} fill="none" stroke={goal.color + '25'} strokeWidth={6} />
                      <circle cx={circleSize / 2} cy={circleSize / 2} r={radius} fill="none" stroke={goal.color} strokeWidth={6}
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                    </svg>
                    <div className="relative flex flex-col items-center z-10">
                      <span className="text-xs font-bold leading-none" style={{ color: goal.color }}>M{i + 1}</span>
                      <span className="text-[10px] text-gray-400 leading-none mt-0.5">{Math.round(m.progress * 100)}%</span>
                    </div>
                  </div>
                ) : (
                  // Future month: grey
                  <div
                    className="flex items-center justify-center rounded-full border-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    style={{ width: circleSize, height: circleSize }}
                  >
                    <span className="text-sm font-semibold text-gray-300 dark:text-gray-600">M{i + 1}</span>
                  </div>
                )}
              </div>

              {/* Month label + amounts */}
              <div className="mt-2 text-center">
                <p className={`text-sm font-semibold ${isFuture ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}`}>
                  Month {i + 1}
                </p>
                <p className={`text-xs mt-0.5 ${isFuture ? 'text-gray-300 dark:text-gray-600' : m.isDeficit ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {m.isComplete
                    ? `${formatCurrency(m.actualSaved)} ✓`
                    : isCurrent
                    ? `${formatCurrency(m.actualSaved)} / ${formatCurrency(m.adjustedTarget)}`
                    : isFuture
                    ? `~${formatCurrency(m.adjustedTarget)} needed`
                    : `${formatCurrency(m.actualSaved)} / ${formatCurrency(m.adjustedTarget)}`}
                </p>
                {m.isDeficit && (
                  <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    Deficit carried forward
                  </p>
                )}
              </div>

              {/* Log savings button for current month (or if continuing after complete) */}
              {(isCurrent && !goal.completedAt) && (
                <div className="mt-3 w-full max-w-[220px]">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1.5 w-full justify-center text-sm font-semibold py-2 rounded-xl border-2 border-dashed active:opacity-70 transition-opacity"
                    style={{ color: goal.color, borderColor: goal.color + '60' }}
                  >
                    🐖 Log savings
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Extra "add more" button when continuing after completion */}
        {goal.continueAfterComplete && !goal.completedAt && (
          <div className="mt-6 w-full max-w-xs">
            <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-200 dark:border-gray-700 mx-auto" />
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full py-3 rounded-2xl font-bold text-sm border-2 border-dashed active:opacity-70 transition-opacity"
              style={{ color: goal.color, borderColor: goal.color + '60' }}
            >
              🐖 Add more savings
            </button>
          </div>
        )}
      </div>

      {/* Bottom summary */}
      <div className="mx-4 mb-10 mt-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
        {isGoalComplete && (
          <p className="text-center text-base font-bold mb-4" style={{ color: goal.color }}>
            {goal.completedAt ? 'Goal complete 🏆' : goal.continueAfterComplete ? 'Goal achieved — still going 💪' : 'Goal complete! 🎉'}
          </p>
        )}

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total saved</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {formatCurrency(goal.savedAmount)}{' '}
            <span className="text-gray-400 dark:text-gray-500 font-normal">/ {formatCurrency(goal.targetAmount)}</span>
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, overallProgress * 100)}%`, backgroundColor: goal.color }}
          />
        </div>
        <p className="text-right text-xs mt-1.5 font-medium" style={{ color: goal.color }}>
          {Math.round(overallProgress * 100)}%
          {goal.savedAmount > goal.targetAmount && (
            <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
              (+{formatCurrency(goal.savedAmount - goal.targetAmount)})
            </span>
          )}
        </p>

        {/* Adjusted monthly target for current month */}
        {!isGoalComplete && monthData[currentMonthIdx] && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs text-gray-400">This month's target</span>
            <span className="text-sm font-bold" style={{ color: goal.color }}>
              {formatCurrency(monthData[currentMonthIdx].adjustedTarget)}
              {hasTransactionData && monthData[currentMonthIdx].adjustedTarget !== baseMonthly && (
                <span className="text-[10px] text-gray-400 font-normal ml-1">
                  (adjusted)
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {showModal && (
        <ManualEntryModal
          onClose={() => setShowModal(false)}
          prefill={{ type: 'expense', category: 'savings', linkedGoalId: goal.id }}
        />
      )}

      {showCelebration && (
        <GoalCelebration
          goalName={goal.name}
          totalAmount={goal.savedAmount}
          color={goal.color}
          onContinue={handleContinueSaving}
          onDone={handleMarkDone}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}
