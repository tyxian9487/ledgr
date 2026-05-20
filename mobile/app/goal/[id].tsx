import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, Trash2 } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { CategoryIconRaw } from '../../components/home/CategoryIcon';
import ManualEntryModal from '../../components/home/ManualEntryModal';
import GoalCelebration from '../../components/GoalCelebration';
import { durationMonthsFromDays, goalMonthIndex, goalMonthWindow } from '../../utils/goals';

interface MonthData {
  adjustedTarget: number;
  actualSaved: number;
  progress: number;
  isComplete: boolean;
  isDeficit: boolean;
}

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { budget, transactions, updateCustomGoal, formatCurrency, removeCustomGoal } = useApp();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const goal = budget.customGoals?.find(g => g.id === id);

  if (!goal) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950 items-center justify-center" edges={['top']}>
        <Text className="dark:text-white">{t('goal.not_found')}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-green-600">{t('goal.go_back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const durationMonths = durationMonthsFromDays(goal.durationDays);
  const currentMonthIdx = goalMonthIndex(goal.startDate, durationMonths);

  const goalTxs = transactions.filter(t => t.linkedGoalId === goal.id);
  const hasTransactionData = goalTxs.length > 0;

  function getMonthSaved(monthIdx: number): number {
    const { start, end } = goalMonthWindow(goal.startDate, monthIdx);
    const monthStart = start.getTime();
    const monthEnd = end.getTime();
    return goalTxs
      .filter(t => {
        const d = new Date(t.date).getTime();
        return d >= monthStart && d < monthEnd;
      })
      .reduce((s, t) => s + t.amount, 0);
  }

  const baseMonthly = goal.targetAmount / durationMonths;
  const monthData: MonthData[] = [];
  let carryover = 0;

  for (let i = 0; i < durationMonths; i++) {
    const adjustedTarget = Math.max(0, baseMonthly - carryover);
    let actualSaved = 0;
    if (hasTransactionData) {
      actualSaved = getMonthSaved(i);
    } else {
      if (i < currentMonthIdx) {
        actualSaved = Math.min(adjustedTarget, baseMonthly);
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
    if (isPast && hasTransactionData) carryover = actualSaved - adjustedTarget;
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
  function handleDelete() {
    setShowDeleteConfirm(false);
    removeCustomGoal(goal!.id);
    router.back();
  }

  const CIRCLE_SIZE = 72;
  const radius = (CIRCLE_SIZE - 8) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      {/* Header */}
      <View
        className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800"
        style={{ backgroundColor: goal.color + '15' }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow-sm items-center justify-center"
        >
          <ArrowLeft size={18} color="#6b7280" />
        </TouchableOpacity>

        <View className="w-10 h-10 rounded-2xl items-center justify-center flex-shrink-0" style={{ backgroundColor: goal.color + '25' }}>
          <CategoryIconRaw icon={goal.icon} color={goal.color} size={20} />
        </View>

        <View className="flex-1 min-w-0">
          <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>{goal.name}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {durationMonths} {durationMonths !== 1 ? t('common.months') : t('common.month')} · {formatCurrency(baseMonthly)}{t('common.per_month')} {t('goal.base')}
          </Text>
        </View>

        {goal.completedAt ? (
          <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: goal.color }}>
            <Text className="text-xs font-bold text-white">{t('goal.done_badge')}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center"
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Snake path */}
        <View className="items-center px-6 pt-8 pb-4">
          {Array.from({ length: durationMonths }, (_, i) => {
            const m = monthData[i];
            const isCurrent = i === currentMonthIdx;
            const isFuture = i > currentMonthIdx;
            const strokeDashoffset = circumference * (1 - m.progress);
            const ringColor = m.isDeficit ? '#f59e0b' : goal.color;

            return (
              <View key={i} className="items-center w-full max-w-xs">
                {i > 0 && (
                  <View className="w-0.5 h-6 border-l-2 border-dashed border-gray-200 dark:border-gray-700" />
                )}

                <View className="relative items-center justify-center">
                  {m.isComplete ? (
                    <View
                      className="items-center justify-center rounded-full"
                      style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, backgroundColor: goal.color }}
                    >
                      <Check size={28} color="white" strokeWidth={2.5} />
                    </View>
                  ) : m.isDeficit ? (
                    <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
                      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ position: 'absolute' }}>
                        <Circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={radius} fill="none" stroke="#f59e0b25" strokeWidth={6} />
                        <Circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={radius} fill="none" stroke="#f59e0b" strokeWidth={6}
                          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                          transform={`rotate(-90, ${CIRCLE_SIZE/2}, ${CIRCLE_SIZE/2})`} />
                      </Svg>
                      <View className="absolute inset-0 items-center justify-center">
                        <Text className="text-xs font-bold text-amber-500 leading-none">M{i + 1}</Text>
                        <Text className="text-[10px] text-gray-400 leading-none mt-0.5">-{formatCurrency(m.adjustedTarget - m.actualSaved)}</Text>
                      </View>
                    </View>
                  ) : isCurrent ? (
                    <View style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
                      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ position: 'absolute' }}>
                        <Circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={radius} fill="none" stroke={goal.color + '25'} strokeWidth={6} />
                        <Circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={radius} fill="none" stroke={goal.color} strokeWidth={6}
                          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                          transform={`rotate(-90, ${CIRCLE_SIZE/2}, ${CIRCLE_SIZE/2})`} />
                      </Svg>
                      <View className="absolute inset-0 items-center justify-center">
                        <Text className="text-xs font-bold leading-none" style={{ color: goal.color }}>M{i + 1}</Text>
                        <Text className="text-[10px] text-gray-400 leading-none mt-0.5">{Math.round(m.progress * 100)}%</Text>
                      </View>
                    </View>
                  ) : (
                    <View
                      className="items-center justify-center rounded-full border-4 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                      style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
                    >
                      <Text className="text-sm font-semibold text-gray-300 dark:text-gray-600">M{i + 1}</Text>
                    </View>
                  )}
                </View>

                <View className="mt-2 items-center">
                  <Text className={`text-sm font-semibold ${isFuture ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}`}>
                    {t('goal.month_label', { n: i + 1 })}
                  </Text>
                  <Text className={`text-xs mt-0.5 ${isFuture ? 'text-gray-300 dark:text-gray-600' : m.isDeficit ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {m.isComplete
                      ? `${formatCurrency(m.actualSaved)} ✓`
                      : isCurrent
                      ? `${formatCurrency(m.actualSaved)} / ${formatCurrency(m.adjustedTarget)}`
                      : isFuture
                      ? `~${formatCurrency(m.adjustedTarget)} needed`
                      : `${formatCurrency(m.actualSaved)} / ${formatCurrency(m.adjustedTarget)}`}
                  </Text>
                  {m.isDeficit && (
                    <Text className="text-[10px] text-amber-400 font-semibold mt-0.5">{t('goal.deficit')}</Text>
                  )}
                </View>

                {isCurrent && !goal.completedAt && (
                  <View className="mt-3 w-full max-w-[220px]">
                    <TouchableOpacity
                      onPress={() => setShowModal(true)}
                      className="flex-row items-center justify-center gap-1.5 w-full py-2 rounded-xl border-2 border-dashed"
                      style={{ borderColor: goal.color + '60' }}
                    >
                      <Text style={{ color: goal.color }} className="text-sm font-semibold">🐖 {t('goal.log')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}

          {/* Add more after completion */}
          {goal.continueAfterComplete && !goal.completedAt && (
            <View className="mt-6 w-full max-w-xs">
              <View className="w-0.5 h-6 border-l-2 border-dashed border-gray-200 dark:border-gray-700 self-center" />
              <TouchableOpacity
                onPress={() => setShowModal(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed items-center"
                style={{ borderColor: goal.color + '60' }}
              >
                <Text style={{ color: goal.color }} className="font-bold text-sm">🐖 {t('goal.add_more')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom summary card */}
        <View className="mx-4 mb-10 mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          {isGoalComplete && (
            <Text className="text-center text-base font-bold mb-4" style={{ color: goal.color }}>
              {goal.completedAt ? t('goal.complete_trophy') : goal.continueAfterComplete ? t('goal.still_going') : t('goal.complete')}
            </Text>
          )}

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm text-gray-500 dark:text-gray-400">{t('goal.total_saved')}</Text>
            <Text className="text-sm font-semibold text-gray-800 dark:text-white">
              {formatCurrency(goal.savedAmount)}{' '}
              <Text className="text-gray-400 font-normal">/ {formatCurrency(goal.targetAmount)}</Text>
            </Text>
          </View>

          <View className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, overallProgress * 100)}%`, backgroundColor: goal.color }}
            />
          </View>
          <Text className="text-right text-xs mt-1.5 font-medium" style={{ color: goal.color }}>
            {Math.round(overallProgress * 100)}%
            {goal.savedAmount > goal.targetAmount && (
              <Text className="text-gray-400 font-normal"> (+{formatCurrency(goal.savedAmount - goal.targetAmount)})</Text>
            )}
          </Text>

          {/* Adjusted monthly target */}
          {!isGoalComplete && monthData[currentMonthIdx] && (
            <View className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex-row justify-between items-center">
              <Text className="text-xs text-gray-400">{t('goal.this_month_target')}</Text>
              <Text className="text-sm font-bold" style={{ color: goal.color }}>
                {formatCurrency(monthData[currentMonthIdx].adjustedTarget)}
                {hasTransactionData && monthData[currentMonthIdx].adjustedTarget !== baseMonthly && (
                  <Text className="text-[10px] text-gray-400 font-normal"> ({t('goal.adjusted')})</Text>
                )}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Log savings modal */}
      <ManualEntryModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        prefill={{ type: 'expense', category: 'savings', linkedGoalId: goal.id }}
      />

      {/* Goal celebration */}
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

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-2">{t('goal.delete_title')}</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {t('goal.delete_confirm', { name: goal.name })}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 items-center">
                <Text className="font-semibold text-gray-600 dark:text-gray-300">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} className="flex-1 py-3 rounded-xl bg-red-500 items-center">
                <Text className="font-semibold text-white">{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
