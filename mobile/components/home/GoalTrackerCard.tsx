import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, Activity } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { CategoryIconRaw } from './CategoryIcon';

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

function getMonthlyCustomProgress(
  savedAmount: number,
  targetAmount: number,
  durationDays: number,
  startDate: string,
) {
  const durationMonths = Math.max(1, Math.round(durationDays / 30));
  const monthlyTarget = targetAmount / durationMonths;
  const elapsedDays = (Date.now() - new Date(startDate).getTime()) / 86400000;
  const currentMonthIdx = Math.min(
    Math.floor(Math.max(0, elapsedDays) / 30),
    durationMonths - 1,
  );
  const monthSaved = Math.max(
    0,
    Math.min(monthlyTarget, savedAmount - currentMonthIdx * monthlyTarget),
  );
  return { monthlyTarget, monthSaved, currentMonthIdx, durationMonths };
}

export default function GoalTrackerCard({ year, month }: Props) {
  const router = useRouter();
  const { budget, getMonthTransactions, formatCurrency } = useApp();
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [celebratedGoals, setCelebratedGoals] = useState<Set<string>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);

  const savingsGoal = budget.savingsGoal;
  const txs = getMonthTransactions(year, month);
  const allGoals: GoalEntry[] = [];

  if (savingsGoal?.enabled) {
    const actualAmount = txs
      .filter(
        (tx) =>
          tx.category === 'savings' &&
          (!tx.linkedGoalId || tx.linkedGoalId === '__monthly__'),
      )
      .reduce((sum, tx) => sum + tx.amount, 0);
    const goalAmount = savingsGoal.amount || 0;
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    allGoals.push({
      id: 'savings',
      title: t('gtc.monthly'),
      subtitle: monthName,
      iconKey: 'PiggyBank',
      color: '#22c55e',
      actualAmount,
      goalAmount,
      progress: goalAmount > 0 ? Math.min((actualAmount / goalAmount) * 100, 100) : 0,
      isCustom: false,
    });
  }

  for (const goal of budget.customGoals ?? []) {
    const { monthlyTarget, monthSaved, currentMonthIdx, durationMonths } =
      getMonthlyCustomProgress(
        goal.savedAmount,
        goal.targetAmount,
        goal.durationDays,
        goal.startDate,
      );
    allGoals.push({
      id: goal.id,
      title: goal.name,
      subtitle: t('gtc.month_of', { x: currentMonthIdx + 1, y: durationMonths }),
      iconKey: goal.icon,
      color: goal.color,
      actualAmount: monthSaved,
      goalAmount: monthlyTarget,
      progress:
        monthlyTarget > 0 ? Math.min((monthSaved / monthlyTarget) * 100, 100) : 0,
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
        setCelebratedGoals((prev) => new Set([...prev, goalKey]));
      }
    }
  }, [isCompleted, goal.id, year, month]);

  return (
    <View className="mx-4 mt-3 rounded-2xl bg-white/10 p-3">
      {/* Goal selector dropdown — only when multiple goals */}
      {allGoals.length > 1 && (
        <View className="mb-2">
          <TouchableOpacity
            onPress={() => setShowDropdown((v) => !v)}
            className="flex-row items-center gap-1.5 w-full"
            activeOpacity={0.7}
          >
            <View
              className="w-5 h-5 rounded-md items-center justify-center flex-shrink-0"
              style={{ backgroundColor: goal.color + '25' }}
            >
              <CategoryIconRaw icon={goal.iconKey} color={goal.color} size={11} />
            </View>
            <Text className="text-[11px] font-bold dark:text-white flex-1" numberOfLines={1}>
              {goal.title}
            </Text>
            <ChevronDown
              size={12}
              color="#9ca3af"
              style={{ transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showDropdown && (
            <View className="mt-1 bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 z-20">
              {allGoals.map((g, i) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => {
                    setCurrentIdx(i);
                    setShowDropdown(false);
                  }}
                  className="flex-row items-center gap-2 px-3 py-2.5"
                  activeOpacity={0.7}
                >
                  <View
                    className="w-5 h-5 rounded-md items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: g.color + '25' }}
                  >
                    <CategoryIconRaw icon={g.iconKey} color={g.color} size={11} />
                  </View>
                  <Text
                    className="text-xs text-gray-700 dark:text-gray-200 flex-1"
                    numberOfLines={1}
                  >
                    {g.title}
                  </Text>
                  {i === safeIdx && (
                    <Text className="text-green-600 text-xs">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Goal body */}
      <View className="flex-row items-center gap-3">
        {allGoals.length === 1 && (
          <View
            className="w-8 h-8 rounded-xl items-center justify-center flex-shrink-0"
            style={{ backgroundColor: goal.color + '20' }}
          >
            <CategoryIconRaw icon={goal.iconKey} color={goal.color} size={16} />
          </View>
        )}

        <View className="flex-1 min-w-0">
          {allGoals.length === 1 && (
            <View className="flex-row items-center gap-1.5 mb-0.5">
              {goal.isCustom ? (
                <TouchableOpacity
                  onPress={() => router.push(`/goal/${goal.id}` as any)}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs font-bold dark:text-white" numberOfLines={1}>
                    {goal.title}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-xs font-bold dark:text-white" numberOfLines={1}>
                  {goal.title}
                </Text>
              )}
              <Activity size={11} color={goal.color} style={{ opacity: 0.5 }} />
            </View>
          )}

          <Text className="text-[10px] text-gray-400 mb-1">{goal.subtitle}</Text>

          {/* Progress bar */}
          <View className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
            />
          </View>

          <View className="flex-row justify-between items-center mt-0.5">
            <Text className="text-[11px] text-gray-500 dark:text-gray-400">
              {formatCurrency(goal.actualAmount)} / {formatCurrency(goal.goalAmount)}
            </Text>
            <Text className="text-[11px] font-semibold" style={{ color: goal.color }}>
              {goal.progress.toFixed(0)}%
            </Text>
          </View>

          {goal.isCustom && (
            <TouchableOpacity
              onPress={() => router.push(`/goal/${goal.id}` as any)}
              activeOpacity={0.7}
              className="mt-1.5"
            >
              <Text className="text-[10px] font-semibold" style={{ color: goal.color }}>
                {t('gtc.see_all')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
