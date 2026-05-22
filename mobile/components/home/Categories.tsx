import { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { Trash2, Edit2, RefreshCw, ChevronDown, ChevronRight, ChevronLeft, X } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Transaction } from '../../types';
import CategoryIcon from './CategoryIcon';

const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function translateCategoryLabel(
  t: (key: any, params?: Record<string, string | number>) => string,
  cat?: { id: string; label: string },
): string {
  if (!cat) return '';
  const key = `cat.${cat.id}` as any;
  const translated = t(key);
  return translated !== key ? translated : cat.label;
}

export interface CategoriesProps {
  year: number;
  month: number;
  view: 'category' | 'date';
  filterFn?: (t: Transaction) => boolean;
  onEdit?: (tx: Transaction) => void;
}

function formatDayLabel(dateStr: string, t: (key: any, params?: Record<string, string | number>) => string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const toStr = (dt: Date) => dt.toISOString().slice(0, 10);
  if (dateStr === toStr(today)) return t('common.today');
  if (dateStr === toStr(yesterday)) return t('common.yesterday');
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Calendar Overlay (exported for use in parent) ─────────────────────────────
export function CalendarModal({
  year, month, transactions, formatCurrency, onClose,
}: {
  year: number; month: number; transactions: Transaction[];
  formatCurrency: (n: number) => string; onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const dark = colorScheme === 'dark';
  const c = {
    surface: dark ? '#1f2937' : '#fff',
    handle: dark ? '#4b5563' : '#e5e7eb',
    border: dark ? '#374151' : '#f3f4f6',
    borderFaint: dark ? '#374151' : '#f9fafb',
    textPrimary: dark ? '#f9fafb' : '#111827',
    textSecondary: dark ? '#e5e7eb' : '#374151',
    textMuted: dark ? '#9ca3af' : '#6b7280',
    icon: dark ? '#e5e7eb' : '#374151',
    closeBtn: dark ? '#374151' : '#f3f4f6',
    closeIcon: dark ? '#9ca3af' : '#6b7280',
  };

  const [calYear, setCalYear] = useState(year);
  const [calMonth, setCalMonth] = useState(month);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const dayHeaders = useMemo(
    () => Array.from({ length: 7 }, (_, i) =>
      new Date(1970, 0, 4 + i).toLocaleDateString(undefined, { weekday: 'short' }),
    ),
    [],
  );

  // Sync when parent month changes
  useEffect(() => { setCalYear(year); setCalMonth(month); }, [year, month]);

  const spendByDay: Record<number, number> = {};
  const incomeByDay: Record<number, number> = {};
  transactions.forEach(tx => {
    const d = new Date(tx.date);
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
      const day = d.getDate();
      if (tx.type === 'expense') spendByDay[day] = (spendByDay[day] || 0) + tx.amount;
      else incomeByDay[day] = (incomeByDay[day] || 0) + tx.amount;
    }
  });
  const maxSpend = Math.max(...Object.values(spendByDay), 1);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null);
  }

  const today = new Date();
  const selectedDayTxs = selectedDay
    ? transactions.filter(tx => {
        const d = new Date(tx.date);
        return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === selectedDay;
      })
    : [];

  const cellWidth = `${100 / 7}%` as any;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
          {/* Drag handle */}
          <View style={{ width: 36, height: 4, backgroundColor: c.handle, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />

          {/* Month navigation */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 }}>
            <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
              <ChevronLeft size={20} color={c.icon} />
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: '700', color: c.textPrimary }}>
              {t(`month.${MONTH_KEYS[calMonth]}` as any)} {calYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
              <ChevronRight size={20} color={c.icon} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 10, marginBottom: 4 }}>
            {dayHeaders.map(d => (
              <Text key={d} style={{ width: cellWidth, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#9ca3af', letterSpacing: 0.5 }}>
                {d}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingBottom: 4 }}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`empty-${i}`} style={{ width: cellWidth, aspectRatio: 1 }} />;
              const spend = spendByDay[day] || 0;
              const income = incomeByDay[day] || 0;
              const isSelected = selectedDay === day;
              const hasSpend = spend > 0;
              const hasIncome = income > 0;
              const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
              const intensity = hasSpend ? Math.max(0.2, spend / maxSpend) : 0;

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(isSelected ? null : day)}
                  style={{ width: cellWidth, aspectRatio: 1, padding: 2 }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSelected ? '#16a34a'
                      : hasSpend ? `rgba(239,68,68,${intensity * 0.3})`
                      : hasIncome ? 'rgba(34,197,94,0.12)' : 'transparent',
                    borderWidth: isToday && !isSelected ? 1.5 : 0, borderColor: '#16a34a',
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: isToday ? '700' : '400', color: isSelected ? '#fff' : c.textPrimary }}>
                      {day}
                    </Text>
                    {(hasSpend || hasIncome) && !isSelected && (
                      <View style={{ flexDirection: 'row', gap: 2, marginTop: 1 }}>
                        {hasSpend && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#ef4444' }} />}
                        {hasIncome && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#22c55e' }} />}
                      </View>
                    )}
                    {isSelected && spend > 0 && (
                      <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>
                        {formatCurrency(spend).replace(/\.\d+$/, '')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingVertical: 10, justifyContent: 'center', borderTopWidth: 1, borderTopColor: c.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[0.2, 0.4, 0.65, 0.9].map((o, i) => (
                  <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: `rgba(239,68,68,${o})` }} />
                ))}
              </View>
              <Text style={{ fontSize: 11, color: c.textMuted }}>{t('calendar.legend_spend')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
              <Text style={{ fontSize: 11, color: c.textMuted }}>{t('common.income')}</Text>
            </View>
          </View>

          {/* Selected day transactions */}
          {selectedDay !== null && (
            <ScrollView style={{ maxHeight: 180, borderTopWidth: 1, borderTopColor: c.border }} nestedScrollEnabled>
              <Text style={{ fontSize: 11, fontWeight: '700', color: c.textMuted, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t(`month.${MONTH_KEYS[calMonth]}` as any)} {selectedDay}
                {selectedDayTxs.length === 0 ? ` — ${t('home.no_transactions')}` : ''}
              </Text>
              {selectedDayTxs.map(tx => (
                <View key={tx.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.borderFaint }}>
                  <Text style={{ flex: 1, fontSize: 13, color: c.textSecondary }} numberOfLines={1}>
                    {tx.description || tx.category}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: tx.type === 'income' ? '#16a34a' : '#ef4444' }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Close */}
          <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 14 + bottomInset }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.closeBtn, alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color={c.closeIcon} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Categories Component ─────────────────────────────────────────────────
export default function Categories({ year, month, view, filterFn, onEdit }: CategoriesProps) {
  const { transactions, expenseCategories, incomeCategories, removeTransaction, formatCurrency } = useApp();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const c = {
    surface: dark ? '#1f2937' : '#fff',
    border: dark ? '#374151' : '#f3f4f6',
    borderFaint: dark ? '#374151' : '#f9fafb',
    dateBadge: dark ? '#374151' : '#f3f4f6',
    textPrimary: dark ? '#f9fafb' : '#111827',
    textSecondary: dark ? '#e5e7eb' : '#374151',
    textMuted: '#9ca3af',
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const allCategories = useMemo(() => [...expenseCategories, ...incomeCategories], [expenseCategories, incomeCategories]);

  const monthTxs = useMemo(
    () => transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .filter(filterFn ?? (() => true))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, year, month, filterFn],
  );

  function handleDelete(tx: Transaction) {
    Alert.alert('Delete Transaction', `Delete "${tx.description || tx.category}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(tx.id) },
    ]);
  }

  function TxRow({ tx }: { tx: Transaction }) {
    const cat = allCategories.find(c => c.id === tx.category);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: (cat?.color ?? '#94a3b8') + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CategoryIcon icon={cat?.icon ?? 'MoreHorizontal'} color={cat?.color ?? '#94a3b8'} size={16} />
        </View>
        <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: c.textPrimary }} numberOfLines={1}>
            {tx.description || translateCategoryLabel(t, cat)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <Text style={{ fontSize: 11, color: c.textMuted }}>{translateCategoryLabel(t, cat)}</Text>
            {tx.isAutoDebit && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <RefreshCw size={9} color="#9ca3af" />
                <Text style={{ fontSize: 10, color: '#9ca3af' }}>{t('misc.recurring' as any)}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: tx.type === 'income' ? '#16a34a' : '#ef4444', marginRight: 2 }}>
          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
        </Text>
        {onEdit && (
          <TouchableOpacity onPress={() => onEdit(tx)} style={{ padding: 7 }} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
            <Edit2 size={13} color="#9ca3af" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleDelete(tx)} style={{ padding: 7 }} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          <Trash2 size={13} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  }

  if (monthTxs.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 }}>
        <Text style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>{t('misc.no_tx_month' as any)}</Text>
      </View>
    );
  }

  // ── Category view ──────────────────────────────────────────────────────────
  if (view === 'category') {
    const rows = allCategories
      .map(cat => {
        const catTxs = monthTxs.filter(tx => tx.category === cat.id);
        const expTotal = catTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
        const incTotal = catTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
        return { ...cat, txs: catTxs, expTotal, incTotal };
      })
      .filter(r => r.txs.length > 0)
      .sort((a, b) => (b.expTotal + b.incTotal) - (a.expTotal + a.incTotal));

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        {rows.map(row => {
          const isExp = expanded[row.id] === true;
          const displayTotal = row.expTotal > 0 ? row.expTotal : row.incTotal;
          const isIncome = row.expTotal === 0;
          return (
            <View key={row.id} style={{ marginBottom: 6 }}>
              <TouchableOpacity
                onPress={() => setExpanded(prev => ({ ...prev, [row.id]: !isExp }))}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: c.surface, borderRadius: 16,
                  paddingHorizontal: 14, paddingVertical: 11,
                  borderWidth: 1, borderColor: c.border,
                }}
                activeOpacity={0.7}
              >
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: row.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <CategoryIcon icon={row.icon} color={row.color} size={19} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: c.textPrimary }}>{translateCategoryLabel(t, row)}</Text>
                  <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                    {row.txs.length} {t(row.txs.length === 1 ? 'common.transaction' : 'common.transactions')}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: isIncome ? '#16a34a' : '#ef4444', marginRight: 8 }}>
                  {isIncome ? '+' : '-'}{formatCurrency(displayTotal)}
                </Text>
                {isExp ? <ChevronDown size={14} color="#d1d5db" /> : <ChevronRight size={14} color="#d1d5db" />}
              </TouchableOpacity>

              {isExp && (
                <View style={{ backgroundColor: c.surface, borderRadius: 12, marginTop: 2, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
                  {row.txs.map((tx, i) => (
                    <View key={tx.id} style={i < row.txs.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.borderFaint } : {}}>
                      <TxRow tx={tx} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  }

  // ── Date view ──────────────────────────────────────────────────────────────
  const byDate: Record<string, Transaction[]> = {};
  monthTxs.forEach(tx => {
    const key = tx.date.slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(tx);
  });
  const dateRows = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateStr, dayTxs]) => ({
      dateStr,
      dayTxs,
      expenses: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      income: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    }));

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
      {dateRows.map(({ dateStr, dayTxs, expenses, income }) => {
        const isExp = expanded[dateStr] === true;
        const label = formatDayLabel(dateStr, t);
        const d = new Date(dateStr + 'T12:00:00');
        const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
        const dayNum = String(d.getDate());

        return (
          <View key={dateStr} style={{ marginBottom: 6 }}>
            <TouchableOpacity
              onPress={() => setExpanded(prev => ({ ...prev, [dateStr]: !isExp }))}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
              activeOpacity={0.7}
            >
              {/* Date badge */}
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c.dateBadge, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#9ca3af', letterSpacing: 0.4 }}>{dayName}</Text>
                <Text style={{ fontSize: 17, fontWeight: '700', color: c.textPrimary, lineHeight: 20 }}>{dayNum}</Text>
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.textPrimary }}>{label}</Text>
                <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                  {dayTxs.length} transaction{dayTxs.length !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                {expenses > 0 && (
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#ef4444' }}>-{formatCurrency(expenses)}</Text>
                )}
                {income > 0 && (
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#16a34a' }}>+{formatCurrency(income)}</Text>
                )}
              </View>
              {isExp ? <ChevronDown size={14} color="#d1d5db" /> : <ChevronRight size={14} color="#d1d5db" />}
            </TouchableOpacity>

            {isExp && (
              <View style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.border }}>
                {dayTxs.map((tx, i) => (
                  <View key={tx.id} style={i < dayTxs.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.borderFaint } : {}}>
                    <TxRow tx={tx} />
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
