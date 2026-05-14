import { useState, useEffect } from 'react';
import { ArrowRightLeft, PiggyBank, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusCelebration from './StatusCelebration';

interface Props {
  year: number;
  month: number;
}

type GoalType = 'savings' | 'investment';

export default function GoalTrackerCard({ year, month }: Props) {
  const { budget, getMonthTransactions } = useApp();
  const [currentGoal, setCurrentGoal] = useState<GoalType>('savings');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'excellent' | 'sustained' | 'critical'>('excellent');

  const savingsGoal = budget.savingsGoal;
  const investmentGoal = budget.investmentGoal;

  // Hide if both goals are disabled
  if ((!savingsGoal?.enabled && !investmentGoal?.enabled)) {
    return null;
  }

  const txs = getMonthTransactions(year, month);
  
  // Calculate actual savings/investment based on goal type
  let actualAmount = 0;
  if (currentGoal === 'savings') {
    // For savings, use transactions in savings category
    actualAmount = txs.filter(t => t.category === 'savings').reduce((sum, t) => sum + t.amount, 0);
  } else {
    // For investment, use transactions in investment category (assuming it exists)
    // If no investment category, fall back to net savings
    const investmentTxs = txs.filter(t => t.category === 'investment' || t.category === 'investments');
    actualAmount = investmentTxs.length > 0 
      ? investmentTxs.reduce((sum, t) => sum + t.amount, 0)
      : totalIncome - totalExpenses;
  }

  // Calculate progress
  const currentGoalData = currentGoal === 'savings' ? savingsGoal : investmentGoal;
  const goalAmount = currentGoalData?.amount || 0;
  const progress = goalAmount > 0 ? Math.min((actualAmount / goalAmount) * 100, 100) : 0;
  const isCompleted = progress >= 100;

  // Trigger celebration when goal is reached
  useEffect(() => {
    if (isCompleted && !showCelebration) {
      setCelebrationType('excellent');
      setShowCelebration(true);
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }
  }, [isCompleted, showCelebration]);

  const toggleGoal = () => {
    setCurrentGoal(current => current === 'savings' ? 'investment' : 'savings');
  };

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
  const goalTitle = `${monthName} ${currentGoal === 'savings' ? 'Savings' : 'Investment'} Goal`;
  const goalIcon = currentGoal === 'savings' ? PiggyBank : TrendingUp;
  const goalColor = currentGoal === 'savings' ? 'green' : 'purple';

  return (
    <>
      <div className="mx-4 mt-4 rounded-2xl glass p-4 flex items-center gap-4">
        {/* Goal Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          goalColor === 'green' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
        }`}>
          <goalIcon size={20} className={goalColor === 'green' ? 'text-green-600' : 'text-purple-600'} />
        </div>

        {/* Goal Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold dark:text-white truncate">{goalTitle}</h3>
          
          {/* Progress Bar */}
          <div className="mt-2 relative">
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  goalColor === 'green' 
                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                    : 'bg-gradient-to-r from-purple-400 to-purple-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ${actualAmount.toLocaleString()} / ${goalAmount.toLocaleString()}
              </span>
              <span className={`text-xs font-semibold ${
                goalColor === 'green' ? 'text-green-600' : 'text-purple-600'
              }`}>
                {progress.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        {(savingsGoal?.enabled && investmentGoal?.enabled) && (
          <button
            onClick={toggleGoal}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            title={`Switch to ${currentGoal === 'savings' ? 'Investment' : 'Savings'} Goal`}
          >
            <ArrowRightLeft size={14} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <StatusCelebration 
          status={celebrationType} 
          onClose={() => setShowCelebration(false)} 
        />
      )}
    </>
  );
}