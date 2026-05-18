import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Minus, ChevronRight, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  shopping: '#ec4899',
  entertainment: '#8b5cf6',
  health: '#ef4444',
  housing: '#14b8a6',
  utilities: '#eab308',
  education: '#06b6d4',
  travel: '#f43f5e',
  personal: '#a855f7',
  subscriptions: '#64748b',
  insurance: '#0ea5e9',
  savings: '#22c55e',
  investment: '#15803d',
  investments: '#15803d',
  others: '#94a3b8',
};

const MAX_BAR_HEIGHT = 96;

// ─── Category Detail Modal ────────────────────────────────────────────────────

function CategoryModal({
  categoryId,
  onClose,
}: {
  categoryId: string;
  onClose: () => void;
}) {
  const { transactions, formatCurrency } = useApp();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  const color = CATEGORY_COLORS[categoryId] || '#94a3b8';
  const rawKey = ('cat.' + categoryId) as any;
  const label = (() => {
    const tr = t(rawKey);
    return tr !== rawKey ? tr : categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  })();

  const now = new Date();

  const catTxs = useMemo(
    () =>
      [...transactions.filter((tx) => tx.type === 'expense' && tx.category === categoryId)].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transactions, categoryId],
  );

  const last6 = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const val = catTxs
        .filter((tx) => {
          const td = new Date(tx.date);
          return td.getMonth() === m && td.getFullYear() === y;
        })
        .reduce((s, tx) => s + tx.amount, 0);
      return { label: MONTH_NAMES[m], value: val };
    });
  }, [catTxs]);

  const total = catTxs.reduce((s, tx) => s + tx.amount, 0);
  const nonZero = last6.filter((p) => p.value > 0);
  const avg = nonZero.length > 0 ? total / nonZero.length : 0;
  const maxBarVal = Math.max(...last6.map((p) => p.value), 1);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white dark:bg-gray-900">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: color + '30' }}>
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            </View>
            <View>
              <Text className="text-base font-bold text-gray-900 dark:text-white">{label}</Text>
              <Text className="text-xs text-gray-400">{t('trends.monthly')}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <X size={16} color={dark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Mini bar chart */}
          <View className="px-5 pt-5 pb-4">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {t('trends.monthly_overview')}
            </Text>
            <View className="flex-row items-end gap-2" style={{ height: MAX_BAR_HEIGHT + 28 }}>
              {last6.map((point, i) => {
                const heightPct = maxBarVal > 0 ? point.value / maxBarVal : 0;
                const barH = Math.max(heightPct * MAX_BAR_HEIGHT, point.value > 0 ? 4 : 0);
                const isLast = i === last6.length - 1;
                const barBg = isLast ? color : (dark ? color + '40' : color + '30');
                return (
                  <View key={point.label + i} className="flex-1 items-center gap-1">
                    {point.value > 0 && (
                      <Text className="text-[8px] text-gray-400" numberOfLines={1}>
                        {formatCurrency(point.value)}
                      </Text>
                    )}
                    <View className="flex-1 justify-end w-full">
                      <View
                        className="w-full rounded-t-sm"
                        style={{ height: barH, backgroundColor: barBg }}
                      />
                    </View>
                    <Text
                      className={`text-[9px] font-medium ${isLast ? '' : 'text-gray-400'}`}
                      style={isLast ? { color } : {}}
                    >
                      {point.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Stats row */}
          <View className="px-5 flex-row gap-3 mb-5">
            {[
              { label: t('common.total'), value: formatCurrency(total) },
              { label: t('trends.avg'), value: formatCurrency(avg) },
            ].map((s) => (
              <View key={s.label} className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                <Text className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{s.label}</Text>
                <Text className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Recent transactions */}
          <View className="px-5 pb-10">
            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {t('trends.recent')}
            </Text>
            {catTxs.length === 0 ? (
              <Text className="text-sm text-gray-400 py-4 text-center">{t('trends.no_txs')}</Text>
            ) : (
              catTxs.slice(0, 10).map((tx) => (
                <View
                  key={tx.id}
                  className="flex-row items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800"
                >
                  <View className="flex-1 min-w-0 mr-3">
                    <Text className="text-sm font-medium text-gray-900 dark:text-white" numberOfLines={1}>
                      {tx.description || label}
                    </Text>
                    <Text className="text-[11px] text-gray-400">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-red-500 flex-shrink-0">
                    -{formatCurrency(tx.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Trends Screen ────────────────────────────────────────────────────────────

export default function TrendsScreen() {
  const { transactions, formatCurrency } = useApp();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  const [view, setView] = useState<'spending' | 'income'>('spending');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCats, setShowAllCats] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const txs = transactions.filter((tx) => {
        const td = new Date(tx.date);
        return td.getMonth() === month && td.getFullYear() === year;
      });
      return {
        month,
        year,
        income: txs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
        expenses: txs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
        label: MONTH_NAMES[month],
      };
    });
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const yearTxs = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getFullYear() === currentYear && tx.type === 'expense';
    });
    const totals: Record<string, number> = {};
    yearTxs.forEach((tx) => {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [transactions, currentYear]);

  const totalExpensesThisYear = categoryTotals.reduce((s, [, v]) => s + v, 0);

  const currentMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const spendDiff = currentMonth.expenses - prevMonth.expenses;
  const spendPct = prevMonth.expenses > 0 ? Math.round(Math.abs(spendDiff / prevMonth.expenses) * 100) : 0;

  const bars = view === 'spending' ? monthlyData.map((m) => m.expenses) : monthlyData.map((m) => m.income);
  const maxBar = Math.max(...bars, 1);

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── Header ── */}
        <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-gray-900 dark:text-white">{t('trends.title')}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('trends.subtitle')}</Text>
          </View>
          <Image
            source={require('../../assets/m_magnifier.png')}
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
        </View>

        {/* ── Summary Cards ── */}
        <View className="px-4 mt-1 flex-row gap-3">
          {/* Spending card */}
          <View className="flex-1 bg-red-500 rounded-2xl p-4">
            <Text className="text-[10px] text-red-100 font-bold uppercase tracking-widest mb-1">
              {t('trends.this_month')}
            </Text>
            <Text className="text-2xl font-black text-white leading-tight">
              {formatCurrency(currentMonth.expenses)}
            </Text>
            <Text className="text-[11px] text-red-200 mt-0.5">{t('trends.spending')}</Text>
            {prevMonth.expenses > 0 && (
              <View className="flex-row items-center gap-1 mt-2">
                {spendDiff > 0 ? (
                  <TrendingUp size={11} color="rgba(254,226,226,0.9)" />
                ) : spendDiff < 0 ? (
                  <TrendingDown size={11} color="rgba(254,226,226,0.9)" />
                ) : (
                  <Minus size={11} color="rgba(254,226,226,0.9)" />
                )}
                <Text className="text-[10px] text-red-100 font-semibold">
                  {spendDiff === 0
                    ? t('trends.same')
                    : spendDiff > 0
                    ? t('trends.more_pct', { n: spendPct })
                    : t('trends.less_pct', { n: spendPct })}
                </Text>
              </View>
            )}
          </View>

          {/* Income card */}
          <View className="flex-1 bg-green-600 rounded-2xl p-4">
            <Text className="text-[10px] text-green-100 font-bold uppercase tracking-widest mb-1">
              {t('trends.this_month')}
            </Text>
            <Text className="text-2xl font-black text-white leading-tight">
              {formatCurrency(currentMonth.income)}
            </Text>
            <Text className="text-[11px] text-green-200 mt-0.5">{t('trends.income')}</Text>
            {currentMonth.income > 0 && (
              <View className="flex-row items-center gap-1 mt-2">
                {currentMonth.income >= currentMonth.expenses ? (
                  <TrendingUp size={11} color="rgba(220,252,231,0.9)" />
                ) : (
                  <TrendingDown size={11} color="rgba(220,252,231,0.9)" />
                )}
                <Text className="text-[10px] text-green-100 font-semibold">
                  {currentMonth.income >= currentMonth.expenses ? t('common.surplus') : t('common.deficit')}{' '}
                  {formatCurrency(Math.abs(currentMonth.income - currentMonth.expenses))}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Monthly Bar Chart ── */}
        <View className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-bold text-gray-900 dark:text-white">
              {t('trends.monthly_overview')}
            </Text>
            <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 gap-0.5">
              {(['spending', 'income'] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setView(v)}
                  className={`px-3 py-1 rounded-[10px] ${view === v ? 'bg-white dark:bg-gray-700' : ''}`}
                >
                  <Text
                    className={`text-[11px] font-semibold capitalize ${
                      view === v
                        ? 'text-gray-800 dark:text-white'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {v === 'spending' ? t('trends.spending') : t('trends.income')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bars */}
          <View className="flex-row items-end gap-2" style={{ height: MAX_BAR_HEIGHT + 28 }}>
            {monthlyData.map((m, i) => {
              const val = view === 'spending' ? m.expenses : m.income;
              const heightPct = maxBar > 0 ? val / maxBar : 0;
              const barH = Math.max(heightPct * MAX_BAR_HEIGHT, val > 0 ? 4 : 0);
              const isLast = i === monthlyData.length - 1;

              let barColor: string;
              if (view === 'spending') {
                barColor = isLast ? '#ef4444' : (dark ? 'rgba(239,68,68,0.25)' : '#fee2e2');
              } else {
                barColor = isLast ? '#16a34a' : (dark ? 'rgba(22,163,74,0.25)' : '#dcfce7');
              }

              return (
                <View key={`${m.year}-${m.month}`} className="flex-1 items-center gap-1">
                  {val > 0 && (
                    <Text className="text-[8px] text-gray-400 text-center" numberOfLines={1}>
                      {formatCurrency(val)}
                    </Text>
                  )}
                  <View className="flex-1 justify-end w-full">
                    <View
                      className="w-full rounded-t-lg"
                      style={{ height: barH, backgroundColor: barColor }}
                    />
                  </View>
                  <Text
                    className={`text-[10px] font-medium ${
                      isLast
                        ? view === 'spending'
                          ? 'text-red-500'
                          : 'text-green-500'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {m.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Category Breakdown ── */}
        <View className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
            <Text className="text-sm font-bold text-gray-900 dark:text-white">
              {t('common.categories')}
            </Text>
            <Text className="text-[11px] text-gray-400">
              {t('trends.year_explore', { year: currentYear })}
            </Text>
          </View>

          {categoryTotals.length === 0 ? (
            <Text className="text-sm text-gray-400 text-center py-6 px-5 pb-6">
              {t('trends.no_expense')}
            </Text>
          ) : (
            <>
              {(showAllCats ? categoryTotals : categoryTotals.slice(0, 5)).map(([id, amount]) => {
                const pct = totalExpensesThisYear > 0 ? (amount / totalExpensesThisYear) * 100 : 0;
                const color = CATEGORY_COLORS[id] || '#94a3b8';
                const ck = ('cat.' + id) as any;
                const catLabel = (() => {
                  const tr = t(ck);
                  return tr !== ck ? tr : id.charAt(0).toUpperCase() + id.slice(1);
                })();

                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setSelectedCategory(id)}
                    className="px-5 py-3 border-b border-gray-50 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800"
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <View className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <Text className="text-sm font-medium text-gray-900 dark:text-white">{catLabel}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[11px] text-gray-400">{pct.toFixed(0)}%</Text>
                        <Text className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(amount)}
                        </Text>
                        <ChevronRight size={13} color={dark ? '#4b5563' : '#d1d5db'} />
                      </View>
                    </View>
                    <View className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}

              {categoryTotals.length > 5 && (
                <TouchableOpacity
                  onPress={() => setShowAllCats((v) => !v)}
                  className="py-3.5 border-t border-gray-100 dark:border-gray-800 items-center"
                >
                  <Text className="text-[12px] font-semibold text-green-500">
                    {showAllCats
                      ? t('trends.show_less')
                      : t('trends.show_more', { n: categoryTotals.length - 5 })}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ── Income vs Expenses ── */}
        <View className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5">
          <Text className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            {t('trends.income_vs')}
          </Text>
          <View className="gap-3">
            {[...monthlyData].reverse().map((m) => {
              const maxVal = Math.max(m.income, m.expenses, 1);
              const surplus = m.income - m.expenses;
              return (
                <View key={`${m.year}-${m.month}`}>
                  <View className="flex-row items-center">
                    <Text className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 w-8">
                      {m.label}
                    </Text>
                    <View className="flex-1 mx-3 gap-1">
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        <View className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${(m.income / maxVal) * 100}%` }}
                          />
                        </View>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <View className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full bg-red-400"
                            style={{ width: `${(m.expenses / maxVal) * 100}%` }}
                          />
                        </View>
                      </View>
                    </View>
                    <Text
                      className={`text-[11px] font-bold w-16 text-right ${
                        surplus > 0 ? 'text-green-500' : surplus < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {surplus === 0
                        ? '–'
                        : `${surplus > 0 ? '+' : '-'}${formatCurrency(Math.abs(surplus))}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <View className="flex-row gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <Text className="text-[11px] text-gray-400">{t('common.income')}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <Text className="text-[11px] text-gray-400">{t('common.expenses')}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {selectedCategory && (
        <CategoryModal
          categoryId={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </SafeAreaView>
  );
}
