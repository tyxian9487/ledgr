import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus, Search, SlidersHorizontal, Target, ChevronLeft, ChevronRight,
  ChevronDown, Share2, LayoutGrid, CalendarDays, X, Check,
  UtensilsCrossed, Car, ShoppingBag, Tv, Heart, Home, Zap,
  GraduationCap, Plane, Sparkles, RefreshCw, Shield, PiggyBank,
  TrendingUp, MoreHorizontal, Briefcase, Laptop, Building2, Gift,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Transaction } from '../../types';

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  UtensilsCrossed, Car, ShoppingBag, Tv, Heart, Home, Zap, GraduationCap,
  Plane, Sparkles, RefreshCw, Shield, PiggyBank, TrendingUp,
  MoreHorizontal, Briefcase, Laptop, Building2, Gift, Plus,
};

function CategoryIcon({ iconName, color, size = 18 }: { iconName: string; color: string; size?: number }) {
  const Icon = ICON_MAP[iconName] ?? MoreHorizontal;
  return <Icon size={size} color={color} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

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

// ─── Manual Entry Modal ───────────────────────────────────────────────────────

function ManualEntryModal({ onClose }: { onClose: () => void }) {
  const { addTransaction, expenseCategories, incomeCategories, formatCurrency } = useApp();
  const { t } = useTranslation();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  function handleConfirm() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Enter a valid amount'); return; }
    if (!category) { setError('Select a category'); return; }
    addTransaction({ type, amount: amt, category, description: description.trim(), date: new Date().toISOString(), isAutoDebit: false });
    onClose();
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="bg-white dark:bg-gray-800 px-5 pt-6 pb-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center">
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-gray-900 dark:text-white">{t('tx.new')}</Text>
          <View className="w-8" />
        </View>
        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
          <View className="flex-row bg-gray-100 dark:bg-gray-700 rounded-2xl p-1 mb-5">
            {(['expense', 'income'] as const).map((tp) => (
              <TouchableOpacity key={tp} onPress={() => { setType(tp); setCategory(''); }}
                className={`flex-1 py-2.5 rounded-xl items-center ${type === tp ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}>
                <Text className={`text-sm font-bold capitalize ${type === tp ? (tp === 'expense' ? 'text-red-500' : 'text-green-600') : 'text-gray-400'}`}>
                  {tp === 'expense' ? t('common.expense') : t('common.income')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 mb-4 border border-gray-100 dark:border-gray-700 flex-row items-center gap-2">
            <Text className="text-gray-400 text-lg font-semibold">$</Text>
            <TextInput className="flex-1 text-2xl font-bold text-gray-900 dark:text-white" placeholder="0.00"
              placeholderTextColor="#d1d5db" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          </View>
          <View className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 mb-4 border border-gray-100 dark:border-gray-700">
            <TextInput className="text-sm text-gray-700 dark:text-gray-200" placeholder={t('tx.add_note')}
              placeholderTextColor="#9ca3af" value={description} onChangeText={setDescription} />
          </View>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('common.categories')}</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} onPress={() => setCategory(cat.id)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${category === cat.id ? 'border-transparent' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
                style={category === cat.id ? { backgroundColor: cat.color + '20', borderColor: cat.color } : {}}>
                <CategoryIcon iconName={cat.icon} color={category === cat.id ? cat.color : '#9ca3af'} size={13} />
                <Text className={`text-xs font-semibold ${category === cat.id ? '' : 'text-gray-500'}`}
                  style={category === cat.id ? { color: cat.color } : {}}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {error !== '' && <Text className="text-xs text-red-500 font-medium mb-3">{error}</Text>}
        </ScrollView>
        <View className="px-5 pb-8 pt-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <TouchableOpacity onPress={handleConfirm} className="bg-green-600 rounded-2xl py-4 items-center flex-row justify-center gap-2">
            <Check size={16} color="white" />
            <Text className="text-white font-bold text-base">{t('tx.confirm')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Transaction Item ─────────────────────────────────────────────────────────

function TransactionItem({ tx, formatCurrency }: { tx: Transaction; formatCurrency: (n: number) => string }) {
  const cat = ALL_CATEGORIES.find((c) => c.id === tx.category);
  const isIncome = tx.type === 'income';
  return (
    <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl mb-2 border border-gray-50 dark:border-gray-700">
      <View className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
        style={{ backgroundColor: (cat?.color ?? '#94a3b8') + '20' }}>
        <CategoryIcon iconName={cat?.icon ?? 'MoreHorizontal'} color={cat?.color ?? '#94a3b8'} size={16} />
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
  const { transactions, formatCurrency, getMonthTransactions, getMonthIncome, getMonthExpenses, userProfile } = useApp();
  const { t } = useTranslation();

  const [showEntry, setShowEntry] = useState(false);
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [listView, setListView] = useState<'list' | 'calendar'>('list');

  const monthTxs = useMemo(() => getMonthTransactions(viewYear, viewMonth), [transactions, viewYear, viewMonth]);
  const totalIncome = useMemo(() => getMonthIncome(viewYear, viewMonth), [transactions, viewYear, viewMonth]);
  const totalExpenses = useMemo(() => getMonthExpenses(viewYear, viewMonth), [transactions, viewYear, viewMonth]);
  const surplus = totalIncome - totalExpenses;

  // Financial health score (year-to-date savings rate)
  const score = useMemo(() => {
    const yearTxs = transactions.filter(tx => new Date(tx.date).getFullYear() === viewYear);
    const yi = yearTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const ye = yearTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    return yi > 0 ? Math.min(100, Math.max(0, Math.round(100 - (ye / yi) * 100))) : 50;
  }, [transactions, viewYear]);

  const scoreLabel = score >= 90 ? t('profile.excellent_health')
    : score >= 80 ? t('profile.managing_well')
    : score >= 60 ? t('profile.fair_health')
    : t('profile.needs_improvement');
  const scoreDisplay = score >= 90 ? '90+' : String(score);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString(undefined, { month: 'long' });

  const filteredTxs = useMemo(() => {
    if (filterType === 'all') return monthTxs;
    return monthTxs.filter(tx => tx.type === filterType);
  }, [monthTxs, filterType]);

  const grouped = useMemo(() => groupByDate(filteredTxs), [filteredTxs]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My finances this month: Income ${formatCurrency(totalIncome)}, Expenses ${formatCurrency(totalExpenses)}, Surplus ${formatCurrency(surplus)}. Financial health: ${scoreDisplay} (${scoreLabel})`,
      });
    } catch (_) {}
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-400 dark:text-gray-500 font-medium">{t(getGreeting())}</Text>
            <Text className="text-xl font-black text-gray-900 dark:text-white">{t('home.my_finances')}</Text>
          </View>
          <View className="w-9 h-9 rounded-full bg-green-600 items-center justify-center">
            <Text className="text-white font-bold text-sm">
              {(userProfile.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Green Summary Card ── */}
        <View className="mx-4 mt-2 bg-green-600 rounded-3xl p-4">

          {/* Date navigation row */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="bg-white/20 rounded-full px-3 py-1.5">
              <Text className="text-white font-bold text-sm">{now.getDate()}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <TouchableOpacity onPress={prevMonth}
                className="w-7 h-7 rounded-full bg-white/20 items-center justify-center">
                <ChevronLeft size={14} color="white" />
              </TouchableOpacity>
              <Text className="text-white font-bold text-sm min-w-[64px] text-center">{monthLabel}</Text>
              <TouchableOpacity onPress={nextMonth}
                className="w-7 h-7 rounded-full bg-white/20 items-center justify-center">
                <ChevronRight size={14} color="white" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center gap-1">
              <Text className="text-white font-bold text-sm">{viewYear}</Text>
              <ChevronDown size={12} color="white" />
            </TouchableOpacity>
          </View>

          {/* Health score row */}
          <View className="bg-white/15 rounded-2xl px-4 py-3 flex-row items-center mb-4">
            <View className="flex-row items-center flex-1 gap-2">
              <Text style={{ fontSize: 22 }}>💰</Text>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>{t('profile.assessment')}</Text>
                <Text style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 15 }}>{scoreLabel}</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="items-end">
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>{t('profile.score')}</Text>
                <Text className="text-white font-bold text-base">{scoreDisplay}</Text>
              </View>
              <TouchableOpacity onPress={handleShare}
                className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                <Share2 size={14} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Donut ring */}
          <View className="items-center mb-4">
            <View style={{
              width: 164, height: 164, borderRadius: 82,
              borderWidth: 22, borderColor: 'rgba(255,255,255,0.22)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 2 }}>
                {t('home.total_expenses')}
              </Text>
              <Text className="text-white text-2xl font-black">{formatCurrency(totalExpenses)}</Text>
            </View>
          </View>

          {/* Income / Surplus */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginBottom: 3 }}>{t('common.income')}</Text>
              <Text className="text-white font-bold text-base">{formatCurrency(totalIncome)}</Text>
            </View>
            <View className="flex-1 bg-white/15 rounded-2xl px-4 py-3">
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginBottom: 3 }}>{t('common.surplus')}</Text>
              <Text style={{ color: surplus >= 0 ? 'white' : '#fca5a5', fontWeight: 'bold', fontSize: 15 }}>
                {formatCurrency(surplus)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Action buttons 2×2 ── */}
        <View className="mx-4 mt-4 gap-y-3">
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => setShowEntry(true)} activeOpacity={0.8}
              className="flex-1 bg-gray-900 dark:bg-gray-800 rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5">
              <View className="w-7 h-7 rounded-full bg-green-600 items-center justify-center">
                <Plus size={15} color="white" strokeWidth={2.5} />
              </View>
              <Text className="text-white text-sm font-semibold flex-shrink flex-1" numberOfLines={1}>
                {t('home.add_transaction')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/budget')} activeOpacity={0.8}
              className="flex-1 bg-gray-900 dark:bg-gray-800 rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5">
              <View className="w-7 h-7 rounded-full bg-gray-600 items-center justify-center">
                <Target size={14} color="white" />
              </View>
              <Text className="text-white text-sm font-semibold flex-shrink flex-1" numberOfLines={2}
                style={{ lineHeight: 16 }}>
                {t('home.set_budget')}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity activeOpacity={0.8}
              className="flex-1 bg-gray-900 dark:bg-gray-800 rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5">
              <Search size={16} color="#9ca3af" />
              <Text className="text-gray-300 text-sm font-semibold">{t('common.search')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterType(f => f === 'all' ? 'expense' : f === 'expense' ? 'income' : 'all')}
              activeOpacity={0.8}
              className="flex-1 bg-gray-900 dark:bg-gray-800 rounded-2xl px-4 py-3.5 flex-row items-center gap-2.5">
              <SlidersHorizontal size={16} color={filterType !== 'all' ? '#16a34a' : '#9ca3af'} />
              <Text className={`text-sm font-semibold ${filterType !== 'all' ? 'text-green-500' : 'text-gray-300'}`}>
                {filterType === 'all' ? t('home.filter') : filterType === 'expense' ? t('common.expense') : t('common.income')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Categories header ── */}
        <View className="mx-4 mt-5 mb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-gray-900 dark:text-white">{t('common.categories')}</Text>
          <View className="flex-row gap-1">
            <TouchableOpacity onPress={() => setListView('list')}
              className={`w-8 h-8 rounded-lg items-center justify-center ${listView === 'list' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>
              <LayoutGrid size={16} color={listView === 'list' ? '#16a34a' : '#9ca3af'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setListView('calendar')}
              className={`w-8 h-8 rounded-lg items-center justify-center ${listView === 'calendar' ? 'bg-gray-200 dark:bg-gray-700' : ''}`}>
              <CalendarDays size={16} color={listView === 'calendar' ? '#16a34a' : '#9ca3af'} />
            </TouchableOpacity>
          </View>
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

      {showEntry && <ManualEntryModal onClose={() => setShowEntry(false)} />}
    </SafeAreaView>
  );
}
