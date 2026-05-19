import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Plus, Target, Search, SlidersHorizontal, TrendingUp, TrendingDown, X,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Transaction } from '../../types';
import GreenCard from '../../components/home/GreenCard';
import GoalTrackerCard from '../../components/home/GoalTrackerCard';
import ManualEntryModal from '../../components/home/ManualEntryModal';
import { CategoryIconRaw } from '../../components/home/CategoryIcon';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): 'home.greeting_morning' | 'home.greeting_afternoon' | 'home.greeting_evening' | 'home.greeting_night' {
  const h = new Date().getHours();
  if (h < 12) return 'home.greeting_morning';
  if (h < 17) return 'home.greeting_afternoon';
  if (h < 21) return 'home.greeting_evening';
  return 'home.greeting_night';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(txs: Transaction[]): { dateLabel: string; items: Transaction[] }[] {
  const map: Record<string, Transaction[]> = {};
  const sorted = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const tx of sorted) {
    const label = formatDate(tx.date);
    if (!map[label]) map[label] = [];
    map[label].push(tx);
  }
  return Object.entries(map).map(([dateLabel, items]) => ({ dateLabel, items }));
}

// ─── Transaction Item ─────────────────────────────────────────────────────────

function TransactionItem({ tx, formatCurrency }: { tx: Transaction; formatCurrency: (n: number) => string }) {
  const cat = ALL_CATEGORIES.find((c) => c.id === tx.category);
  const isIncome = tx.type === 'income';
  return (
    <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl mb-2 border border-gray-50 dark:border-gray-700">
      <View className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
        style={{ backgroundColor: (cat?.color ?? '#94a3b8') + '20' }}>
        <CategoryIconRaw icon={cat?.icon ?? 'MoreHorizontal'} color={cat?.color ?? '#94a3b8'} size={16} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
          {tx.description || cat?.label || tx.category}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">{cat?.label} · {formatDate(tx.date)}</Text>
      </View>
      <Text className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-green-500' : 'text-red-400'}`}>
        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
      </Text>
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const now = new Date();
  const {
    transactions, budget, formatCurrency,
    getMonthTransactions, getMonthExpenses, userProfile,
  } = useApp();
  const { t } = useTranslation();

  const [showEntry, setShowEntry] = useState(false);
  const [entryPrefill, setEntryPrefill] = useState<{ type?: 'expense' | 'income'; amount?: number; category?: string; description?: string } | undefined>(undefined);
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  // Consume pending receipt left by the camera capture screen
  useFocusEffect(useCallback(() => {
    const PENDING_KEY = 'kachingo_pending_receipt';
    AsyncStorage.getItem(PENDING_KEY).then(raw => {
      if (!raw) return;
      AsyncStorage.removeItem(PENDING_KEY);
      try {
        const data = JSON.parse(raw);
        setEntryPrefill(data);
        setShowEntry(true);
      } catch {}
    });
  }, []));

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthTxs = useMemo(
    () => getMonthTransactions(viewYear, viewMonth),
    [transactions, viewYear, viewMonth],
  );

  // Budget status for current real month
  const hasBudget = budget.expectedIncome > 0 && budget.allocations.length > 0;
  const currentMonthExpenses = getMonthExpenses(now.getFullYear(), now.getMonth());
  const totalBudget = hasBudget
    ? budget.allocations.reduce((s, a) => s + (budget.expectedIncome * a.percentage / 100), 0)
    : 0;
  const budgetUsedPct = totalBudget > 0 ? (currentMonthExpenses / totalBudget) * 100 : 0;
  const isOverBudget = hasBudget && currentMonthExpenses > totalBudget;

  // Search across ALL transactions
  const q = searchQuery.trim().toLowerCase();
  const searchResults: Transaction[] = useMemo(() => {
    if (!q) return [];
    return transactions.filter(tx => {
      const catLabel = ALL_CATEGORIES.find(c => c.id === tx.category)?.label.toLowerCase() ?? '';
      return (
        tx.description.toLowerCase().includes(q) ||
        catLabel.includes(q) ||
        String(tx.amount).includes(q)
      );
    });
  }, [transactions, q]);

  const activeFilterCount =
    (filterType !== 'all' ? 1 : 0) +
    (filterMin ? 1 : 0) +
    (filterMax ? 1 : 0) +
    (filterCategory ? 1 : 0);

  const filteredTxs = useMemo(() => {
    let list = monthTxs;
    if (filterType !== 'all') list = list.filter(tx => tx.type === filterType);
    if (filterMin) list = list.filter(tx => tx.amount >= parseFloat(filterMin));
    if (filterMax) list = list.filter(tx => tx.amount <= parseFloat(filterMax));
    if (filterCategory) list = list.filter(tx => tx.category === filterCategory);
    return list;
  }, [monthTxs, filterType, filterMin, filterMax, filterCategory]);

  const grouped = useMemo(() => groupByDate(filteredTxs), [filteredTxs]);

  function clearFilters() {
    setFilterType('all');
    setFilterMin('');
    setFilterMax('');
    setFilterCategory('');
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-400 dark:text-gray-500 font-medium">{t(getGreeting())}</Text>
            <Text className="text-xl font-black text-gray-900 dark:text-white">{t('home.my_finances')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
            className="w-9 h-9 rounded-full bg-green-600 items-center justify-center"
          >
            <Text className="text-white font-bold text-sm">
              {(userProfile.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Green Summary Card ── */}
        <GreenCard
          year={viewYear}
          month={viewMonth}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onYearChange={setViewYear}
        />

        {/* ── Goal Tracker Card ── */}
        <GoalTrackerCard year={viewYear} month={viewMonth} />

        {/* ── Action buttons ── */}
        <View className="mx-4 mt-4 gap-y-3">
          <View className="flex-row gap-3">
            {/* Add Transaction */}
            <TouchableOpacity
              onPress={() => setShowEntry(true)}
              activeOpacity={0.8}
              className="flex-1 bg-gray-900 dark:bg-gray-800 rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5"
            >
              <View className="w-7 h-7 rounded-full bg-green-600 items-center justify-center">
                <Plus size={15} color="white" strokeWidth={2.5} />
              </View>
              <Text className="text-white text-sm font-semibold flex-shrink flex-1" numberOfLines={1}>
                {t('home.add_transaction')}
              </Text>
            </TouchableOpacity>

            {/* Budget status */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/budget')}
              activeOpacity={0.8}
              className={`flex-1 rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5 ${
                !hasBudget
                  ? 'bg-gray-900 dark:bg-gray-800'
                  : isOverBudget
                  ? 'bg-red-950/80 dark:bg-red-900/30'
                  : 'bg-green-950/80 dark:bg-green-900/30'
              }`}
            >
              <View className={`w-7 h-7 rounded-full items-center justify-center ${
                !hasBudget ? 'bg-gray-600' : isOverBudget ? 'bg-red-500' : 'bg-green-600'
              }`}>
                <Target size={14} color="white" strokeWidth={2.5} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className={`text-sm font-semibold leading-tight ${
                  !hasBudget ? 'text-white'
                    : isOverBudget ? 'text-red-400'
                    : 'text-green-400'
                }`} numberOfLines={1}>
                  {!hasBudget
                    ? t('home.set_budget')
                    : isOverBudget
                    ? t('home.over_budget')
                    : t('home.on_track')}
                </Text>
                {hasBudget && (
                  <Text className={`text-[11px] font-semibold mt-0.5 ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
                    {budgetUsedPct.toFixed(0)}{t('home.pct_used')}
                  </Text>
                )}
              </View>
              {hasBudget && (
                isOverBudget
                  ? <TrendingDown size={14} color="#f87171" />
                  : <TrendingUp size={14} color="#22c55e" />
              )}
            </TouchableOpacity>
          </View>

          {/* Search + Filter row */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => { setShowSearch(s => !s); if (showFilter) setShowFilter(false); }}
              activeOpacity={0.8}
              className={`flex-1 rounded-2xl px-4 py-3 flex-row items-center gap-2 ${
                showSearch
                  ? 'bg-green-600'
                  : 'bg-gray-900 dark:bg-gray-800'
              }`}
            >
              <Search size={15} color={showSearch ? 'white' : '#9ca3af'} />
              <Text className={`text-sm font-semibold ${showSearch ? 'text-white' : 'text-gray-300'}`}>
                {t('common.search')}
              </Text>
              {showSearch && q ? (
                <Text className="ml-auto text-white/80 text-xs">{searchResults.length}</Text>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setShowFilter(f => !f); if (showSearch) setShowSearch(false); }}
              activeOpacity={0.8}
              className={`flex-1 rounded-2xl px-4 py-3 flex-row items-center gap-2 ${
                showFilter
                  ? 'bg-green-600'
                  : 'bg-gray-900 dark:bg-gray-800'
              }`}
            >
              <SlidersHorizontal size={15} color={showFilter ? 'white' : (activeFilterCount > 0 ? '#22c55e' : '#9ca3af')} />
              <Text className={`text-sm font-semibold ${showFilter ? 'text-white' : (activeFilterCount > 0 ? 'text-green-500' : 'text-gray-300')}`}>
                {t('home.filter')}
              </Text>
              {activeFilterCount > 0 && (
                <View className={`ml-auto w-5 h-5 rounded-full items-center justify-center ${showFilter ? 'bg-white' : 'bg-green-600'}`}>
                  <Text className={`text-[10px] font-bold ${showFilter ? 'text-green-600' : 'text-white'}`}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search panel ── */}
        {showSearch && (
          <View className="mx-4 mt-2 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <View className="flex-row items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 mb-3">
              <Search size={14} color="#9ca3af" />
              <TextInput
                className="flex-1 text-sm text-gray-900 dark:text-white"
                placeholder={t('home.search_placeholder')}
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {q ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={14} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>

            {!q && (
              <Text className="text-xs text-gray-400 text-center">{t('home.search_desc')}</Text>
            )}

            {q && searchResults.length === 0 && (
              <Text className="text-xs text-gray-400 text-center py-1">{t('home.no_transactions')}</Text>
            )}

            {searchResults.length > 0 && (
              <View className="gap-1.5" style={{ maxHeight: 220 }}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {searchResults.map(tx => {
                    const cat = ALL_CATEGORIES.find(c => c.id === tx.category);
                    return (
                      <View key={tx.id} className="flex-row items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 mb-1.5">
                        <View className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color ?? '#9ca3af' }} />
                        <View className="flex-1 min-w-0">
                          <Text className="text-xs font-medium text-gray-900 dark:text-white" numberOfLines={1}>
                            {tx.description || cat?.label}
                          </Text>
                          <Text className="text-[10px] text-gray-400">{cat?.label} · {formatDate(tx.date)}</Text>
                        </View>
                        <Text className={`text-xs font-bold flex-shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* ── Filter panel ── */}
        {showFilter && (
          <View className="mx-4 mt-2 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 gap-4">
            {/* Type */}
            <View>
              <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('common.type')}</Text>
              <View className="flex-row gap-2">
                {(['all', 'income', 'expense'] as const).map(ft => (
                  <TouchableOpacity key={ft} onPress={() => setFilterType(ft)}
                    className={`flex-1 py-2 rounded-xl items-center ${filterType === ft ? 'bg-green-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Text className={`text-xs font-bold ${filterType === ft ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {ft === 'all' ? t('common.all') : ft === 'income' ? t('common.income') : t('common.expense')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount range */}
            <View>
              <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('home.amount_range')}</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700"
                  placeholder={t('home.filter_min')}
                  placeholderTextColor="#9ca3af"
                  value={filterMin}
                  onChangeText={setFilterMin}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700"
                  placeholder={t('home.filter_max')}
                  placeholderTextColor="#9ca3af"
                  value={filterMax}
                  onChangeText={setFilterMax}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Category */}
            <View>
              <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('common.categories')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setFilterCategory('')}
                    className={`px-3 py-1.5 rounded-xl ${filterCategory === '' ? 'bg-green-600' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    <Text className={`text-xs font-semibold ${filterCategory === '' ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {t('home.all_categories')}
                    </Text>
                  </TouchableOpacity>
                  {ALL_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setFilterCategory(cat.id === filterCategory ? '' : cat.id)}
                      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl ${filterCategory === cat.id ? '' : 'bg-gray-100 dark:bg-gray-800'}`}
                      style={filterCategory === cat.id ? { backgroundColor: cat.color + '25', borderWidth: 1, borderColor: cat.color } : {}}
                    >
                      <CategoryIconRaw icon={cat.icon} color={filterCategory === cat.id ? cat.color : '#9ca3af'} size={11} />
                      <Text
                        className={`text-xs font-semibold ${filterCategory === cat.id ? '' : 'text-gray-500 dark:text-gray-400'}`}
                        style={filterCategory === cat.id ? { color: cat.color } : {}}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearFilters}
                className="py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 items-center">
                <Text className="text-xs font-semibold text-red-500 dark:text-red-400">
                  {t('home.clear_n_filters', { n: activeFilterCount, s: activeFilterCount !== 1 ? 's' : '' })}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Transactions header ── */}
        <View className="mx-4 mt-5 mb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-gray-900 dark:text-white">
            {activeFilterCount > 0 ? t('home.filtered') : t('common.categories')}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-xs font-semibold text-green-600">{t('home.clear')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Transaction List ── */}
        <View className="mx-4 mb-32">
          {grouped.length === 0 ? (
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-8 items-center">
              <Text className="text-gray-400 text-sm">{t('home.no_transactions')}</Text>
            </View>
          ) : (
            grouped.map(({ dateLabel, items }) => (
              <View key={dateLabel} className="mb-4">
                <Text className="text-xs font-semibold text-gray-400 mb-2 ml-1">{dateLabel}</Text>
                {items.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} formatCurrency={formatCurrency} />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ManualEntryModal
        visible={showEntry}
        onClose={() => { setShowEntry(false); setEntryPrefill(undefined); }}
        prefill={entryPrefill}
      />
    </SafeAreaView>
  );
}
