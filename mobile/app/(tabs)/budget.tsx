import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PiggyBank,
  ToggleLeft,
  ToggleRight,
  Plus,
  X,
  Home,
  UtensilsCrossed,
  Car,
  Heart,
  Zap,
  Tv,
  ShoppingBag,
  RefreshCw,
  Sparkles,
  MoreHorizontal,
  Minus,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { BudgetAllocation } from '../../types';

// ─── Budget Groups ────────────────────────────────────────────────────────────

interface BudgetGroup {
  label: string;
  color: string;
  categoryId: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

const BUDGET_GROUPS: BudgetGroup[] = [
  { label: 'Housing',        color: '#14b8a6', categoryId: 'housing',       Icon: Home },
  { label: 'Food & Dining',  color: '#f97316', categoryId: 'food',          Icon: UtensilsCrossed },
  { label: 'Transport',      color: '#3b82f6', categoryId: 'transport',     Icon: Car },
  { label: 'Health',         color: '#ef4444', categoryId: 'health',        Icon: Heart },
  { label: 'Utilities',      color: '#eab308', categoryId: 'utilities',     Icon: Zap },
  { label: 'Entertainment',  color: '#8b5cf6', categoryId: 'entertainment', Icon: Tv },
  { label: 'Shopping',       color: '#ec4899', categoryId: 'shopping',      Icon: ShoppingBag },
  { label: 'Subscriptions',  color: '#64748b', categoryId: 'subscriptions', Icon: RefreshCw },
  { label: 'Personal',       color: '#a855f7', categoryId: 'personal',      Icon: Sparkles },
  { label: 'Other',          color: '#94a3b8', categoryId: 'others',        Icon: MoreHorizontal },
];

function analyzeAllocations(income: number): BudgetAllocation[] {
  let plan: { id: string; pct: number }[];
  if (income >= 8000) {
    plan = [
      { id: 'housing', pct: 20 }, { id: 'food', pct: 10 }, { id: 'transport', pct: 5 },
      { id: 'health', pct: 5 },   { id: 'utilities', pct: 4 }, { id: 'entertainment', pct: 8 },
      { id: 'shopping', pct: 8 }, { id: 'subscriptions', pct: 3 }, { id: 'personal', pct: 5 },
      { id: 'others', pct: 7 },
    ];
  } else if (income >= 4000) {
    plan = [
      { id: 'housing', pct: 25 }, { id: 'food', pct: 15 }, { id: 'transport', pct: 5 },
      { id: 'health', pct: 5 },   { id: 'utilities', pct: 5 }, { id: 'entertainment', pct: 8 },
      { id: 'shopping', pct: 7 }, { id: 'subscriptions', pct: 3 }, { id: 'personal', pct: 5 },
      { id: 'others', pct: 7 },
    ];
  } else {
    plan = [
      { id: 'housing', pct: 30 }, { id: 'food', pct: 20 }, { id: 'transport', pct: 8 },
      { id: 'health', pct: 5 },   { id: 'utilities', pct: 8 }, { id: 'entertainment', pct: 5 },
      { id: 'shopping', pct: 5 }, { id: 'subscriptions', pct: 2 }, { id: 'personal', pct: 4 },
      { id: 'others', pct: 3 },
    ];
  }
  const total = plan.reduce((s, x) => s + x.pct, 0) || 1;
  return BUDGET_GROUPS.map((g) => {
    const item = plan.find((p) => p.id === g.categoryId);
    return {
      categoryId: g.categoryId,
      label: g.label,
      color: g.color,
      percentage: item ? Math.round((item.pct / total) * 100) : 0,
    };
  });
}

// ─── Budget Screen ────────────────────────────────────────────────────────────

export default function BudgetScreen() {
  const { t } = useTranslation();
  const {
    budget, updateBudget, getMonthTransactions, getMonthIncome,
    formatCurrency, getCurrencySymbol, removeCustomGoal,
  } = useApp();

  const now = new Date();
  const actualIncome = getMonthIncome(now.getFullYear(), now.getMonth());

  const [activeTab, setActiveTab] = useState<'goals' | 'budget'>('goals');
  const [incomeInput, setIncomeInput] = useState(
    budget.expectedIncome > 0 ? String(budget.expectedIncome) : actualIncome > 0 ? String(Math.round(actualIncome)) : '',
  );
  const [savingsEnabled, setSavingsEnabled] = useState(budget.savingsGoal?.enabled ?? false);
  const [savingsMode, setSavingsMode] = useState<'pct' | 'fixed'>(budget.savingsGoal?.mode ?? 'pct');
  const [savingsValue, setSavingsValue] = useState(() => {
    if (!budget.savingsGoal) return '';
    const inc = budget.expectedIncome || 1;
    return budget.savingsGoal.mode === 'pct'
      ? String(Math.round((budget.savingsGoal.amount / inc) * 100))
      : String(Math.round(budget.savingsGoal.amount));
  });
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(
    budget.allocations.length > 0
      ? budget.allocations
      : BUDGET_GROUPS.map((g) => ({ categoryId: g.categoryId, label: g.label, color: g.color, percentage: 0 })),
  );
  const [analyzed, setAnalyzed] = useState(budget.allocations.length > 0);
  const [saved, setSaved] = useState(false);

  const income = parseFloat(incomeInput) || 0;
  const savingsAmt = income > 0 && savingsValue
    ? savingsMode === 'pct' ? income * (parseFloat(savingsValue) / 100) : parseFloat(savingsValue)
    : 0;
  const customGoalMonthly = (budget.customGoals ?? []).reduce((sum, g) => {
    const months = Math.max(1, Math.round(g.durationDays / 30));
    return sum + g.targetAmount / months;
  }, 0);
  const netIncome = Math.max(0, income - savingsAmt - customGoalMonthly);
  const totalPct = allocations.reduce((s, a) => s + a.percentage, 0);

  const txs = getMonthTransactions(now.getFullYear(), now.getMonth());
  const actualByCategory: Record<string, number> = {};
  txs.forEach((tx) => {
    if (tx.type === 'expense') {
      actualByCategory[tx.category] = (actualByCategory[tx.category] || 0) + tx.amount;
    }
  });

  function handleAnalyze() {
    if (income <= 0) return;
    const result = analyzeAllocations(netIncome > 0 ? netIncome : income);
    setAllocations(result);
    setAnalyzed(true);
  }

  function adjustPct(idx: number, delta: number) {
    setAllocations((prev) =>
      prev.map((a, i) => i === idx ? { ...a, percentage: Math.max(0, Math.min(100, a.percentage + delta)) } : a),
    );
  }

  const handleSave = useCallback(() => {
    const savingsGoal = savingsEnabled && savingsValue ? {
      enabled: true,
      amount: savingsMode === 'pct' ? income * (parseFloat(savingsValue) / 100) : parseFloat(savingsValue),
      mode: savingsMode,
    } : undefined;
    updateBudget({ expectedIncome: income, allocations, savingsGoal, customGoals: budget.customGoals });
    setSaved(true);
  }, [income, allocations, savingsEnabled, savingsValue, savingsMode, updateBudget, budget.customGoals]);

  const activeGoalCount = (savingsEnabled ? 1 : 0) + (budget.customGoals?.length ?? 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-5 pt-2 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">{t('budget.title')}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">{t('budget.subtitle')}</Text>
      </View>

      {/* Tab bar */}
      <View className="bg-white border-b border-gray-100 flex-row px-5">
        {(['goals', 'budget'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 py-3.5 items-center relative"
          >
            <View className="flex-row items-center gap-1">
              <Text className={`text-sm font-bold ${activeTab === tab ? 'text-green-600' : 'text-gray-400'}`}>
                {tab === 'goals' ? t('budget.goals') : t('budget.budget')}
              </Text>
              {tab === 'goals' && activeGoalCount > 0 && (
                <View className="w-4 h-4 rounded-full bg-green-600 items-center justify-center">
                  <Text className="text-white text-[10px] font-black">{activeGoalCount}</Text>
                </View>
              )}
            </View>
            {activeTab === tab && (
              <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── GOALS TAB ── */}
        {activeTab === 'goals' && (
          <>
            {/* Monthly Savings Goal toggle */}
            <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-4">
              <View className="px-5 py-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <PiggyBank size={16} color="#22c55e" />
                    <Text className="text-sm font-semibold text-gray-900">{t('budget.monthly_savings')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSavingsEnabled((v) => !v)}>
                    {savingsEnabled
                      ? <ToggleRight size={28} color="#22c55e" />
                      : <ToggleLeft size={28} color="#d1d5db" />}
                  </TouchableOpacity>
                </View>

                {savingsEnabled && (
                  <>
                    {/* Mode toggle */}
                    <View className="flex-row gap-2 mb-3">
                      {(['pct', 'fixed'] as const).map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setSavingsMode(m)}
                          className={`flex-1 py-1.5 rounded-xl items-center ${savingsMode === m ? 'bg-green-600' : 'bg-gray-100'}`}
                        >
                          <Text className={`text-xs font-bold ${savingsMode === m ? 'text-white' : 'text-gray-400'}`}>
                            {m === 'pct' ? t('budget.pct_income') : `${t('budget.fixed')} ${getCurrencySymbol()}`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Value input */}
                    <View className="flex-row items-center border border-gray-100 rounded-xl px-3 py-2 gap-2 bg-gray-50">
                      <Text className="text-gray-400 text-sm">{savingsMode === 'pct' ? '%' : getCurrencySymbol()}</Text>
                      <TextInput
                        className="flex-1 text-sm font-bold text-gray-900"
                        placeholder={savingsMode === 'pct' ? '20' : '1000'}
                        placeholderTextColor="#d1d5db"
                        keyboardType="decimal-pad"
                        value={savingsValue}
                        onChangeText={setSavingsValue}
                      />
                    </View>
                    {savingsAmt > 0 && (
                      <Text className="text-xs text-green-600 font-semibold mt-1.5 text-right">
                        = {formatCurrency(savingsAmt)} / mo
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Custom goals */}
            {(budget.customGoals ?? []).map((goal) => {
              const durationMonths = Math.max(1, Math.round(goal.durationDays / 30));
              const monthlyTarget = goal.targetAmount / durationMonths;
              const elapsedDays = (Date.now() - new Date(goal.startDate).getTime()) / 86400000;
              const currentMonthIdx = Math.min(Math.floor(Math.max(0, elapsedDays) / 30), durationMonths - 1);
              const monthSaved = Math.max(0, Math.min(monthlyTarget, goal.savedAmount - currentMonthIdx * monthlyTarget));
              const totalPctGoal = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
              const monthPct = monthlyTarget > 0 ? Math.min(100, (monthSaved / monthlyTarget) * 100) : 0;

              return (
                <View key={goal.id} className="bg-white rounded-3xl border border-gray-100 p-5 mb-4">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View
                      className="w-10 h-10 rounded-2xl items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: goal.color + '20' }}
                    >
                      <PiggyBank size={18} color={goal.color} />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>{goal.name}</Text>
                      <Text className="text-xs text-gray-400">
                        {t('budget.month_of', { x: currentMonthIdx + 1, y: durationMonths })} · {formatCurrency(monthlyTarget)}{t('common.per_month')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeCustomGoal(goal.id)} className="p-1">
                      <X size={14} color="#d1d5db" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-between mb-1.5">
                    <Text className="text-xs text-gray-400">{t('trends.this_month')}</Text>
                    <Text className="text-xs font-semibold" style={{ color: goal.color }}>
                      {formatCurrency(monthSaved)} / {formatCurrency(monthlyTarget)}
                    </Text>
                  </View>
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${monthPct}%`, backgroundColor: goal.color }}
                    />
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-gray-400">Total: {formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)}</Text>
                    <Text className="text-xs font-medium text-gray-500">{Math.round(totalPctGoal)}%</Text>
                  </View>
                </View>
              );
            })}

            {/* Add Goal placeholder */}
            <TouchableOpacity className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-200 flex-row items-center justify-center gap-2 mb-4">
              <Plus size={16} color="#9ca3af" />
              <Text className="text-sm font-semibold text-gray-400">{t('budget.add_goal')}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── BUDGET TAB ── */}
        {activeTab === 'budget' && (
          <>
            {/* Income input */}
            <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-4">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                {t('budget.expected_income')}
              </Text>
              {actualIncome > 0 && !budget.expectedIncome && (
                <Text className="text-xs text-green-600 mb-2 font-medium">
                  {t('budget.auto_filled', { month: now.toLocaleString('default', { month: 'long' }) })}
                </Text>
              )}
              <View className="flex-row items-center border-2 border-gray-100 rounded-2xl px-4 py-3 bg-gray-50 gap-2 mb-4">
                <Text className="text-gray-400 font-semibold text-lg">{getCurrencySymbol()}</Text>
                <TextInput
                  className="flex-1 text-xl font-bold text-gray-900"
                  placeholder="e.g. 5000"
                  placeholderTextColor="#d1d5db"
                  keyboardType="decimal-pad"
                  value={incomeInput}
                  onChangeText={setIncomeInput}
                />
              </View>

              <TouchableOpacity
                onPress={handleAnalyze}
                disabled={income <= 0}
                className={`py-3.5 rounded-2xl items-center flex-row justify-center gap-2 ${income > 0 ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <Sparkles size={16} color={income > 0 ? 'white' : '#9ca3af'} />
                <Text className={`font-bold ${income > 0 ? 'text-white' : 'text-gray-400'}`}>
                  {t('budget.analyze_ai')}
                </Text>
              </TouchableOpacity>
              {income <= 0 && (
                <Text className="text-xs text-amber-500 font-medium mt-2">{t('budget.enter_income')}</Text>
              )}
              {analyzed && income > 0 && (
                <Text className="text-xs text-green-600 font-medium mt-2">
                  ✓ {t('budget.allocation_generated')}
                </Text>
              )}
            </View>

            {/* Savings summary row when goals exist */}
            {(savingsEnabled && savingsAmt > 0 || customGoalMonthly > 0) && income > 0 && (
              <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('budget.active_goals')}</Text>
                  <View className="bg-green-100 rounded-full px-2 py-0.5">
                    <Text className="text-xs font-bold text-green-700">
                      {t('budget.x_active', { n: activeGoalCount })}
                    </Text>
                  </View>
                </View>
                {savingsEnabled && savingsAmt > 0 && (
                  <View className="flex-row items-center justify-between py-2.5 border-b border-gray-50">
                    <View className="flex-row items-center gap-2.5">
                      <View className="w-7 h-7 rounded-xl items-center justify-center" style={{ backgroundColor: '#22c55e20' }}>
                        <PiggyBank size={13} color="#22c55e" />
                      </View>
                      <Text className="text-sm text-gray-600">{t('budget.monthly_savings')}</Text>
                    </View>
                    <Text className="text-sm font-semibold text-gray-700">−{formatCurrency(savingsAmt)}/mo</Text>
                  </View>
                )}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 mt-1">
                  <Text className="text-sm font-bold text-gray-700">{t('budget.spendable')}</Text>
                  <View className="flex-row items-baseline gap-1">
                    <Text className="text-base font-black text-green-600">{formatCurrency(netIncome)}</Text>
                    <Text className="text-xs text-gray-400">/ {formatCurrency(income)}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Allocation list */}
            {analyzed && (
              <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-4">
                <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t('budget.allocation')}
                  </Text>
                  <View className={`px-2 py-0.5 rounded-full ${Math.abs(totalPct - 100) < 1 ? 'bg-green-100' : 'bg-orange-100'}`}>
                    <Text className={`text-xs font-bold ${Math.abs(totalPct - 100) < 1 ? 'text-green-700' : 'text-orange-600'}`}>
                      {totalPct.toFixed(0)}{t('budget.pct_allocated')}
                    </Text>
                  </View>
                </View>

                {allocations.map((alloc, idx) => {
                  const group = BUDGET_GROUPS[idx];
                  if (!group) return null;
                  const { Icon } = group;
                  const budgetAmt = netIncome > 0 ? Math.round(netIncome * alloc.percentage / 100) : 0;
                  const actual = actualByCategory[alloc.categoryId] || 0;
                  const over = actual > budgetAmt && budgetAmt > 0;
                  const spentPct = budgetAmt > 0 ? Math.min(100, (actual / budgetAmt) * 100) : 0;

                  return (
                    <View key={alloc.categoryId} className="border-b border-gray-50 last:border-0 px-5 py-3.5">
                      <View className="flex-row items-center gap-3">
                        <View
                          className="w-7 h-7 rounded-xl items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: alloc.color + '20' }}
                        >
                          <Icon size={14} color={alloc.color} />
                        </View>
                        <View className="flex-1 min-w-0">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-sm font-medium text-gray-800">{alloc.label}</Text>
                            <View className="flex-row items-center gap-2">
                              <Text className="text-sm font-bold" style={{ color: alloc.color }}>{alloc.percentage}%</Text>
                              {budgetAmt > 0 && (
                                <Text className="text-xs text-gray-400">{formatCurrency(budgetAmt)}</Text>
                              )}
                            </View>
                          </View>
                          {budgetAmt > 0 && (
                            <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <View
                                className="h-full rounded-full"
                                style={{ width: `${spentPct}%`, backgroundColor: over ? '#ef4444' : alloc.color }}
                              />
                            </View>
                          )}
                        </View>
                        {/* +/- controls */}
                        <View className="flex-row items-center gap-1 ml-2">
                          <TouchableOpacity
                            onPress={() => adjustPct(idx, -1)}
                            className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center"
                          >
                            <Minus size={10} color="#6b7280" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => adjustPct(idx, 1)}
                            className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center"
                          >
                            <Plus size={10} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Save button */}
            {analyzed && (
              <TouchableOpacity
                onPress={handleSave}
                className="bg-green-600 rounded-2xl py-4 items-center mb-6 shadow-md"
              >
                <Text className="text-white font-bold text-base">
                  {saved ? '✓ ' : ''}{t('budget.save_plan')}
                </Text>
              </TouchableOpacity>
            )}

            {/* This month summary */}
            {analyzed && income > 0 && (
              <View className="bg-white rounded-3xl p-5 border border-gray-100 mb-4">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('budget.this_month')}
                </Text>
                {allocations.filter((a) => a.percentage > 0 && (actualByCategory[a.categoryId] ?? 0) > 0).length === 0 ? (
                  <Text className="text-xs text-gray-400 py-2">{t('budget.no_expense')}</Text>
                ) : (
                  allocations
                    .filter((a) => a.percentage > 0 && (actualByCategory[a.categoryId] ?? 0) > 0)
                    .map((a) => {
                      const budgetAmt = Math.round(netIncome * a.percentage / 100);
                      const actual = actualByCategory[a.categoryId] || 0;
                      const pct = budgetAmt > 0 ? Math.min(130, (actual / budgetAmt) * 100) : 0;
                      const over = actual > budgetAmt;
                      return (
                        <View key={a.categoryId} className="mb-3">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-xs font-medium text-gray-800">{a.label}</Text>
                            <Text className={`text-xs font-bold ${over ? 'text-red-500' : 'text-green-600'}`}>
                              {formatCurrency(actual)} / {formatCurrency(budgetAmt)}
                            </Text>
                          </View>
                          <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <View
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: over ? '#f87171' : a.color }}
                            />
                          </View>
                        </View>
                      );
                    })
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
