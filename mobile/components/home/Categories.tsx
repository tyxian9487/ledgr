import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Trash2, Edit2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { Transaction } from '../../types';
import CategoryIcon from './CategoryIcon';

interface Props {
  year: number;
  month: number;
  filterFn?: (t: Transaction) => boolean;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const toStr = (dt: Date) => dt.toISOString().slice(0, 10);
  if (dateStr === toStr(today)) return 'Today';
  if (dateStr === toStr(yesterday)) return 'Yesterday';
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Categories({ year, month, filterFn }: Props) {
  const { transactions, expenseCategories, incomeCategories, removeTransaction, formatCurrency } = useApp();
  const { t } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const allCategories = [...expenseCategories, ...incomeCategories];

  const monthTxs = transactions
    .filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .filter(filterFn ?? (() => true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  monthTxs.forEach(tx => {
    const key = tx.date.slice(0, 10);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (dates.length === 0) {
    return (
      <View className="items-center py-16 px-8">
        <Text className="text-gray-400 dark:text-gray-500 text-sm text-center">
          {t('misc.no_tx_month')}
        </Text>
      </View>
    );
  }

  function handleDelete(tx: Transaction) {
    Alert.alert(
      'Delete Transaction',
      `Delete "${tx.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(tx.id) },
      ]
    );
  }

  return (
    <View className="px-4">
      {dates.map(date => {
        const txs = grouped[date];
        const dayTotal = txs.reduce((sum, tx) => sum + (tx.type === 'expense' ? -tx.amount : tx.amount), 0);
        const expanded = expandedDays[date] !== false; // expanded by default

        return (
          <View key={date} className="mb-3">
            {/* Day header */}
            <TouchableOpacity
              onPress={() => setExpandedDays(prev => ({ ...prev, [date]: !expanded }))}
              className="flex-row items-center justify-between py-2"
            >
              <Text className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {formatDayLabel(date)}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className={`text-xs font-semibold ${dayTotal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
                </Text>
                {expanded ? <ChevronDown size={14} color="#9ca3af" /> : <ChevronRight size={14} color="#9ca3af" />}
              </View>
            </TouchableOpacity>

            {expanded && (
              <View className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
                {txs.map((tx, i) => {
                  const cat = allCategories.find(c => c.id === tx.category);
                  return (
                    <View
                      key={tx.id}
                      className={`flex-row items-center px-4 py-3 ${i < txs.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
                    >
                      <CategoryIcon
                        icon={cat?.icon ?? 'MoreHorizontal'}
                        color={cat?.color ?? '#94a3b8'}
                        size={18}
                      />
                      <View className="flex-1 ml-3 min-w-0">
                        <Text className="text-sm font-medium dark:text-white" numberOfLines={1}>
                          {tx.description || cat?.label}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                          <Text className="text-xs text-gray-400">{cat?.label}</Text>
                          {tx.isAutoDebit && (
                            <View className="flex-row items-center gap-0.5">
                              <RefreshCw size={9} color="#94a3b8" />
                              <Text className="text-[10px] text-gray-400">{t('misc.recurring')}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View className="items-end ml-2">
                        <Text className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(tx)}
                        className="ml-3 p-1.5"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={15} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
