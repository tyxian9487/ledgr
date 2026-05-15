import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Plus, PiggyBank } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { iconMap } from '../components/home/CategoryIcon';

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { budget, updateCustomGoal, formatCurrency, getCurrencySymbol } = useApp();

  const [contribution, setContribution] = useState('');
  const [showContribInput, setShowContribInput] = useState(false);

  const goal = budget.customGoals?.find(g => g.id === id);

  useEffect(() => {
    if (budget.customGoals !== undefined && !budget.customGoals.find(g => g.id === id)) {
      navigate('/budget');
    }
  }, [budget.customGoals, id, navigate]);

  if (!goal) return null;

  const GoalIcon = iconMap[goal.icon] || PiggyBank;

  const durationMonths = Math.max(1, Math.round(goal.durationDays / 30));
  const monthlyTarget = goal.targetAmount / durationMonths;
  const elapsedDays = (Date.now() - new Date(goal.startDate).getTime()) / 86400000;
  const currentMonthIdx = Math.min(Math.floor(elapsedDays / 30), durationMonths - 1);

  const isGoalComplete = goal.savedAmount >= goal.targetAmount;
  const overallProgress = Math.min(1, goal.savedAmount / goal.targetAmount);

  function handleAddContribution() {
    if (!goal) return;
    const amount = parseFloat(contribution);
    if (!amount || amount <= 0) return;
    updateCustomGoal(goal.id, { savedAmount: goal.savedAmount + amount });
    setContribution('');
    setShowContribInput(false);
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
            {durationMonths} month{durationMonths !== 1 ? 's' : ''} · {formatCurrency(monthlyTarget)}/mo
          </p>
        </div>
      </div>

      {/* Snake path */}
      <div className="flex flex-col items-center px-6 pt-8 pb-4 gap-0">
        {Array.from({ length: durationMonths }, (_, i) => {
          const monthStart = i * monthlyTarget;
          const monthEnd = (i + 1) * monthlyTarget;
          const isComplete = goal.savedAmount >= monthEnd;
          const isCurrent = !isComplete && i === currentMonthIdx;
          const isFuture = i > currentMonthIdx && !isComplete;
          const monthSaved = Math.max(0, Math.min(monthlyTarget, goal.savedAmount - monthStart));
          const progress = monthlyTarget > 0 ? monthSaved / monthlyTarget : 0;

          const circleSize = 72;
          const radius = (circleSize - 8) / 2;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference * (1 - progress);

          return (
            <div key={i} className="flex flex-col items-center w-full max-w-xs">
              {/* Connecting dashed line above (skip for first item) */}
              {i > 0 && (
                <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-200 dark:border-gray-700" />
              )}

              {/* Circle */}
              <div className="relative flex items-center justify-center">
                {isComplete ? (
                  /* Complete: filled circle with check */
                  <div
                    className="flex items-center justify-center rounded-full shadow-md"
                    style={{ width: circleSize, height: circleSize, backgroundColor: goal.color }}
                  >
                    <Check size={28} color="white" strokeWidth={2.5} />
                  </div>
                ) : isCurrent ? (
                  /* Current: SVG ring with partial fill + glow */
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      width: circleSize,
                      height: circleSize,
                      filter: `drop-shadow(0 0 8px ${goal.color}60)`,
                    }}
                  >
                    <svg
                      width={circleSize}
                      height={circleSize}
                      className="absolute inset-0"
                      style={{ transform: 'rotate(-90deg)' }}
                    >
                      {/* Background ring */}
                      <circle
                        cx={circleSize / 2}
                        cy={circleSize / 2}
                        r={radius}
                        fill="none"
                        stroke={goal.color + '25'}
                        strokeWidth={6}
                      />
                      {/* Progress arc */}
                      <circle
                        cx={circleSize / 2}
                        cy={circleSize / 2}
                        r={radius}
                        fill="none"
                        stroke={goal.color}
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div className="relative flex flex-col items-center justify-center z-10">
                      <span className="text-xs font-bold leading-none" style={{ color: goal.color }}>
                        M{i + 1}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none mt-0.5">
                        {Math.round(progress * 100)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Future: grey ring */
                  <div
                    className="flex items-center justify-center rounded-full border-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    style={{ width: circleSize, height: circleSize }}
                  >
                    <span className="text-sm font-semibold text-gray-300 dark:text-gray-600">
                      M{i + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Month label + amounts */}
              <div className="mt-2 text-center">
                <p className={`text-sm font-semibold ${isFuture ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}`}>
                  Month {i + 1}
                </p>
                <p className={`text-xs mt-0.5 ${isFuture ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-500'}`}>
                  {isComplete
                    ? formatCurrency(monthlyTarget)
                    : isCurrent
                    ? `${formatCurrency(monthSaved)} / ${formatCurrency(monthlyTarget)}`
                    : formatCurrency(monthlyTarget)}
                </p>
              </div>

              {/* Inline contribution input for current month */}
              {isCurrent && (
                <div className="mt-3 w-full max-w-[220px]">
                  {showContribInput ? (
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 px-3 py-2">
                      <span className="text-sm text-gray-400 dark:text-gray-500 font-semibold flex-shrink-0">
                        {getCurrencySymbol()}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={contribution}
                        onChange={e => setContribution(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 text-sm text-gray-800 dark:text-white bg-transparent outline-none min-w-0 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddContribution();
                          if (e.key === 'Escape') { setShowContribInput(false); setContribution(''); }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddContribution}
                        disabled={!parseFloat(contribution) || parseFloat(contribution) <= 0}
                        className="text-sm font-semibold px-3 py-1 rounded-lg text-white active:opacity-80 transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: goal.color }}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowContribInput(false); setContribution(''); }}
                        className="text-gray-400 dark:text-gray-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowContribInput(true)}
                      className="flex items-center gap-1.5 w-full justify-center text-sm font-semibold py-2 rounded-xl border-2 border-dashed active:opacity-70 transition-opacity"
                      style={{ color: goal.color, borderColor: goal.color + '60' }}
                    >
                      <Plus size={14} />
                      Log savings
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom summary */}
      <div className="mx-4 mb-10 mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
        {isGoalComplete && (
          <p className="text-center text-base font-bold text-gray-800 dark:text-white mb-4">
            Goal complete! 🎉
          </p>
        )}

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total saved</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-white">
            {formatCurrency(goal.savedAmount)}{' '}
            <span className="text-gray-400 dark:text-gray-500 font-normal">
              / {formatCurrency(goal.targetAmount)}
            </span>
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${overallProgress * 100}%`, backgroundColor: goal.color }}
          />
        </div>

        <p className="text-right text-xs mt-1.5 font-medium" style={{ color: goal.color }}>
          {Math.round(overallProgress * 100)}%
        </p>
      </div>
    </div>
  );
}
