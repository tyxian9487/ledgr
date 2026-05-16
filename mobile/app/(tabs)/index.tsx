import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus,
  Camera,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Tv,
  Heart,
  Home,
  Zap,
  GraduationCap,
  Plane,
  Sparkles,
  RefreshCw,
  Shield,
  PiggyBank,
  Briefcase,
  Laptop,
  Building2,
  Gift,
  MoreHorizontal,
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
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    addTransaction({
      type,
      amount: amt,
      category,
      description: description.trim(),
      date: new Date().toISOString(),
      isAutoDebit: false,
    });
    onClose();
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-5 pt-6 pb-4 flex-row items-center justify-between border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-gray-900">{t('tx.new')}</Text>
          <View className="w-8" />
        </View>

        <ScrollView className="flex-1 px-5 pt-5" keyboardShouldPersistTaps="handled">
          {/* Type toggle */}
          <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-5">
            {(['expense', 'income'] as const).map((tp) => (
              <TouchableOpacity
                key={tp}
                onPress={() => { setType(tp); setCategory(''); }}
                className={`flex-1 py-2.5 rounded-xl items-center ${type === tp ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`text-sm font-bold capitalize ${type === tp ? (tp === 'expense' ? 'text-red-500' : 'text-green-600') : 'text-gray-400'}`}>
                  {tp === 'expense' ? t('common.expense') : t('common.income')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <View className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100 flex-row items-center gap-2">
            <Text className="text-gray-400 text-lg font-semibold">$</Text>
            <TextInput
              className="flex-1 text-2xl font-bold text-gray-900"
              placeholder="0.00"
              placeholderTextColor="#d1d5db"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Description */}
          <View className="bg-white rounded-2xl px-4 py-3 mb-4 border border-gray-100">
            <TextInput
              className="text-sm text-gray-700"
              placeholder={t('tx.add_note')}
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Category */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('common.categories')}</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${category === cat.id ? 'border-transparent' : 'bg-white border-gray-100'}`}
                style={category === cat.id ? { backgroundColor: cat.color + '20', borderColor: cat.color } : {}}
              >
                <CategoryIcon iconName={cat.icon} color={category === cat.id ? cat.color : '#9ca3af'} size={13} />
                <Text className={`text-xs font-semibold ${category === cat.id ? '' : 'text-gray-500'}`}
                  style={category === cat.id ? { color: cat.color } : {}}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error !== '' && (
            <Text className="text-xs text-red-500 font-medium mb-3">{error}</Text>
          )}
        </ScrollView>

        {/* Confirm button */}
        <View className="px-5 pb-8 pt-3 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleConfirm}
            className="bg-green-600 rounded-2xl py-4 items-center flex-row justify-center gap-2"
          >
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
    <View className="flex-row items-center gap-3 px-4 py-3 bg-white rounded-2xl mb-2 border border-gray-50">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
        style={{ backgroundColor: (cat?.color ?? '#94a3b8') + '20' }}
      >
        <CategoryIcon iconName={cat?.icon ?? 'MoreHorizontal'} color={cat?.color ?? '#94a3b8'} size={16} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
          {tx.description || cat?.label || tx.category}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">{cat?.label} · {formatDate(tx.date)}</Text>
      </View>
      <Text className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
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
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  const monthTxs = useMemo(
    () => getMonthTransactions(now.getFullYear(), now.getMonth()),
    [transactions, now.getFullYear(), now.getMonth()],
  );

  const totalIncome = useMemo(
    () => getMonthIncome(now.getFullYear(), now.getMonth()),
    [transactions],
  );
  const totalExpenses = useMemo(
    () => getMonthExpenses(now.getFullYear(), now.getMonth()),
    [transactions],
  );
  const balance = totalIncome - totalExpenses;

  const filteredTxs = useMemo(() => {
    if (filterType === 'all') return monthTxs;
    return monthTxs.filter((tx) => tx.type === filterType);
  }, [monthTxs, filterType]);

  const grouped = useMemo(() => groupByDate(filteredTxs), [filteredTxs]);

  const greetingKey = getGreeting();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-gray-400 font-medium">{t(greetingKey)}</Text>
            <Text className="text-xl font-bold text-gray-900">{t('home.my_finances')}</Text>
          </View>
          <View className="w-9 h-9 rounded-full bg-green-100 items-center justify-center overflow-hidden">
            <Text className="text-green-700 font-bold text-sm">
              {(userProfile.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Green Summary Card ── */}
        <View className="mx-4 mt-2 bg-green-600 rounded-3xl p-5 shadow-lg">
          <Text className="text-green-100 text-xs font-semibold uppercase tracking-wider mb-1">
            {t('home.this_month')}
          </Text>
          <Text className="text-white text-3xl font-black mb-4">
            {formatCurrency(balance)}
          </Text>
          {/* Income / Expenses / Balance row */}
          <View className="flex-row gap-2">
            {/* Income */}
            <View className="flex-1 bg-white/15 rounded-2xl p-3">
              <View className="flex-row items-center gap-1 mb-1">
                <TrendingUp size={12} color="rgba(255,255,255,0.7)" />
                <Text className="text-green-100 text-[10px] font-semibold uppercase tracking-wide">
                  {t('common.income')}
                </Text>
              </View>
              <Text className="text-white font-bold text-sm">{formatCurrency(totalIncome)}</Text>
            </View>
            {/* Expenses */}
            <View className="flex-1 bg-white/15 rounded-2xl p-3">
              <View className="flex-row items-center gap-1 mb-1">
                <TrendingDown size={12} color="rgba(255,255,255,0.7)" />
                <Text className="text-green-100 text-[10px] font-semibold uppercase tracking-wide">
                  {t('common.expenses')}
                </Text>
              </View>
              <Text className="text-white font-bold text-sm">{formatCurrency(totalExpenses)}</Text>
            </View>
            {/* Balance */}
            <View className="flex-1 bg-white/15 rounded-2xl p-3">
              <Text className="text-green-100 text-[10px] font-semibold uppercase tracking-wide mb-1">
                {t('home.balance')}
              </Text>
              <Text className={`font-bold text-sm ${balance >= 0 ? 'text-white' : 'text-red-200'}`}>
                {formatCurrency(balance)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Add Transaction Button ── */}
        <View className="mx-4 mt-4">
          <TouchableOpacity
            onPress={() => setShowEntry(true)}
            className="bg-white rounded-2xl px-4 py-3.5 flex-row items-center gap-3 border border-gray-100 shadow-sm"
            activeOpacity={0.8}
          >
            <View className="w-8 h-8 rounded-full bg-green-600 items-center justify-center">
              <Plus size={18} color="white" strokeWidth={2.5} />
            </View>
            <Text className="text-sm font-semibold text-gray-600">{t('home.add_transaction')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Filter Bar ── */}
        <View className="mx-4 mt-4 flex-row bg-gray-100 rounded-2xl p-1 gap-1">
          {(['all', 'expense', 'income'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilterType(f)}
              className={`flex-1 py-2 rounded-xl items-center ${filterType === f ? 'bg-white shadow-sm' : ''}`}
            >
              <Text
                className={`text-xs font-bold capitalize ${
                  filterType === f
                    ? f === 'expense'
                      ? 'text-red-500'
                      : f === 'income'
                      ? 'text-green-600'
                      : 'text-gray-800'
                    : 'text-gray-400'
                }`}
              >
                {f === 'all' ? t('common.all') : f === 'expense' ? t('common.expense') : t('common.income')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Transaction List grouped by date ── */}
        <View className="mx-4 mt-4 mb-32">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {filterType === 'all' ? t('common.categories') : filterType === 'expense' ? t('common.expenses') : t('common.income')}
          </Text>

          {grouped.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
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

      {/* ── Camera FAB ── */}
      <View className="absolute bottom-6 right-5">
        <TouchableOpacity
          onPress={() => router.push('/capture')}
          className="w-14 h-14 bg-green-600 rounded-full items-center justify-center shadow-lg"
          activeOpacity={0.85}
          style={{ elevation: 6 }}
        >
          <Camera size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* ── Manual Entry Modal ── */}
      {showEntry && <ManualEntryModal onClose={() => setShowEntry(false)} />}
    </SafeAreaView>
  );
}
