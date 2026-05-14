import { useState } from 'react';
import { ChevronDown, Trash2, X, Receipt, Edit2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Transaction } from '../../types';
import CategoryIcon from './CategoryIcon';
import ManualEntryModal from './ManualEntryModal';

interface Props {
  year: number;
  month: number;
  filterFn?: (t: Transaction) => boolean;
  view?: 'category' | 'date';
  showCalendar?: boolean;
  onCloseCalendar?: () => void;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const toStr = (dt: Date) => dt.toISOString().slice(0, 10);
  if (dateStr === toStr(today)) return 'Today';
  if (dateStr === toStr(yesterday)) return 'Yesterday';

  const diffMs = today.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });

  const sameYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

// ─── Calendar overlay ────────────────────────────────────────────────────────
function CalendarOverlay({
  year, month, transactions, formatCurrency, onClose,
}: {
  year: number; month: number;
  transactions: Transaction[];
  formatCurrency: (n: number) => string;
  onClose: () => void;
}) {
  const { expenseCategories, incomeCategories, stopAutoDebit, restartAutoDebit } = useApp();
  const allCategories = [...expenseCategories, ...incomeCategories];

  const [calYear, setCalYear] = useState(year);
  const [calMonth, setCalMonth] = useState(month);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const now = new Date();

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const monthTxs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });

  const spendByDay: Record<number, number> = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    const day = new Date(t.date).getDate();
    spendByDay[day] = (spendByDay[day] || 0) + t.amount;
  });

  const incomeByDay: Record<number, number> = {};
  monthTxs.filter(t => t.type === 'income').forEach(t => {
    const day = new Date(t.date).getDate();
    incomeByDay[day] = (incomeByDay[day] || 0) + t.amount;
  });

  const maxSpend = Math.max(...Object.values(spendByDay), 1);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null); setExpandedCat(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null); setExpandedCat(null);
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDayTxs = selectedDay !== null
    ? monthTxs.filter(t => new Date(t.date).getDate() === selectedDay)
    : [];

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up overflow-y-auto"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Drag pill */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3">
          <button type="button" onClick={prevMonth} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ChevronLeft size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
          <p className="text-base font-bold dark:text-white">{MONTH_NAMES[calMonth]} {calYear}</p>
          <button type="button" onClick={nextMonth} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ChevronRight size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-4 mb-1">
          {DAY_ABBR.map(d => (
            <p key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</p>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 px-4 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const spend = spendByDay[day] || 0;
            const income = incomeByDay[day] || 0;
            const hasTxs = spend > 0 || income > 0;
            const intensity = spend > 0 ? Math.max(0.12, spend / maxSpend) : 0;
            const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
            const incomeOnly = income > 0 && spend === 0;
            const isSelected = selectedDay === day;

            return (
              <div key={day} className="flex flex-col items-center py-1">
                <button
                  type="button"
                  onClick={() => { if (!hasTxs) return; setSelectedDay(isSelected ? null : day); setExpandedCat(null); }}
                  className={`w-9 h-9 rounded-2xl flex flex-col items-center justify-center transition-all ${isToday ? 'ring-2 ring-green-500' : ''} ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''} ${hasTxs ? 'active:scale-95' : ''}`}
                  style={incomeOnly
                    ? { background: `rgba(34,197,94,0.18)` }
                    : spend > 0 ? { background: `rgba(239,68,68,${intensity})` } : {}}
                >
                  <span className={`text-[11px] font-semibold leading-none ${isToday ? 'text-green-600' : incomeOnly ? 'text-green-600' : spend > 0 ? (intensity > 0.5 ? 'text-white' : 'text-gray-700 dark:text-gray-200') : 'text-gray-400 dark:text-gray-500'}`}>
                    {day}
                  </span>
                  {spend > 0 && (
                    <span className={`text-[8px] font-bold leading-none mt-0.5 ${intensity > 0.5 ? 'text-white/90' : 'text-red-500'}`}>
                      {formatCurrency(spend)}
                    </span>
                  )}
                  {incomeOnly && (
                    <span className="text-[8px] font-bold leading-none mt-0.5 text-green-600">
                      {formatCurrency(income)}
                    </span>
                  )}
                </button>
                {income > 0 && spend > 0 && (
                  <div className="w-1 h-1 rounded-full bg-green-500 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 px-5 pt-4">
          <div className="flex gap-1">
            {[0.12, 0.35, 0.6, 0.85].map(o => (
              <div key={o} className="w-4 h-4 rounded-md" style={{ background: `rgba(239,68,68,${o})` }} />
            ))}
          </div>
          <p className="text-[10px] text-gray-400">Low → High spend</p>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-md" style={{ background: 'rgba(34,197,94,0.18)' }} />
            <p className="text-[10px] text-gray-400">Income</p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <X size={13} className="text-gray-500" />
          </button>
        </div>

        {/* Selected day detail — categories first, tap to expand individual transactions */}
        {selectedDay !== null && selectedDayTxs.length > 0 && (() => {
          const catMap: Record<string, { txs: Transaction[]; total: number; isIncome: boolean }> = {};
          selectedDayTxs.forEach(tx => {
            if (!catMap[tx.category]) catMap[tx.category] = { txs: [], total: 0, isIncome: tx.type === 'income' };
            catMap[tx.category].txs.push(tx);
            catMap[tx.category].total += tx.amount;
          });
          const groups = Object.entries(catMap);

          return (
            <div className="px-5 pt-4">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">
                {MONTH_NAMES[calMonth]} {selectedDay}
              </p>
              <div className="space-y-2">
                {groups.map(([catId, { txs: groupTxs, total, isIncome }]) => {
                  const cat = allCategories.find(c => c.id === catId);
                  const isOpen = expandedCat === catId;

                  return (
                    <div key={catId} className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
                      {/* Category header */}
                      <button type="button" onClick={() => setExpandedCat(isOpen ? null : catId)}
                        className="w-full flex items-center gap-3 px-4 py-3">
                        {cat && <CategoryIcon icon={cat.icon} color={cat.color} size={14} />}
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold dark:text-white">{cat?.label || catId}</p>
                          <p className="text-[10px] text-gray-400">{groupTxs.length} transaction{groupTxs.length !== 1 ? 's' : ''}</p>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 mr-1 ${isIncome ? 'text-green-600' : 'text-gray-700 dark:text-gray-200'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(total)}
                        </span>
                        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Individual transactions — only shown when category is expanded */}
                      {isOpen && (
                        <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                          {groupTxs.map(tx => {
                            const baseId = tx.id.includes('_auto_') ? tx.id.split('_auto_')[0] : tx.id;
                            const template = transactions.find(t => t.id === baseId);
                            const autoEnabled = template?.isAutoDebit ?? false;

                            return (
                              <div key={tx.id} className="px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0 pr-3">
                                    <p className="text-xs font-semibold dark:text-gray-200 truncate">
                                      {tx.description || cat?.label || catId}
                                    </p>
                                    <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isIncome ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
                                      {isIncome ? 'Income' : 'Expense'}
                                    </span>
                                  </div>
                                  <span className={`text-xs font-bold flex-shrink-0 ${isIncome ? 'text-green-600' : 'text-gray-700 dark:text-gray-200'}`}>
                                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                                  </span>
                                </div>
                                {tx.isAutoDebit && (
                                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] text-gray-400 font-medium">Enable auto debit</span>
                                    <button
                                      type="button"
                                      onClick={() => autoEnabled ? stopAutoDebit(tx.id) : restartAutoDebit(baseId)}
                                      className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${autoEnabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                    >
                                      <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${autoEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="h-10" />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Categories({ year, month, filterFn, view = 'category', showCalendar = false, onCloseCalendar }: Props) {
  const { getMonthTransactions, removeTransaction, formatCurrency, expenseCategories, incomeCategories, transactions } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const allTxs = getMonthTransactions(year, month);
  const txs = filterFn ? allTxs.filter(filterFn) : allTxs;
  const allCategories = [...expenseCategories, ...incomeCategories];

  // ── Category view ────────────────────────────────────────────────────────
  if (view === 'category') {
    const rows = allCategories
      .map(cat => {
        const catTxs = txs.filter(t => t.category === cat.id);
        const total = catTxs.reduce((s, t) => s + t.amount, 0);
        return { ...cat, txs: catTxs, total };
      })
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total);

    if (rows.length === 0) {
      return (
        <div className="mx-4 py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
          No transactions this month
        </div>
      );
    }

    return (
      <>
        <div className="mx-4 space-y-2 pb-2">
          {rows.map(row => {
            const isOpen = expanded === row.id;
            const isIncome = INCOME_CATEGORIES.some(c => c.id === row.id) ||
              (incomeCategories.some(c => c.id === row.id) && !expenseCategories.some(c => c.id === row.id));
            return (
              <div key={row.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
                <button
                  onClick={() => setExpanded(isOpen ? null : row.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5"
                >
                  <CategoryIcon icon={row.icon} color={row.color} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold dark:text-white">{row.label}</p>
                    <p className="text-[11px] text-gray-400">
                      {row.txs.length} transaction{row.txs.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isIncome ? 'text-green-600' : 'text-gray-800 dark:text-gray-200'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(row.total)}
                    </span>
                    <ChevronDown size={16} className={`text-gray-300 dark:text-gray-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-50 dark:border-gray-800">
                    {row.txs.map(tx => (
                      <TxRow key={tx.id} tx={tx} isIncome={isIncome} allCategories={allCategories}
                        formatCurrency={formatCurrency} onEdit={setEditTx} onDelete={removeTransaction}
                        onImageClick={setLightboxImage} viewYear={year} viewMonth={month} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <EditModal editTx={editTx} onClose={() => setEditTx(null)} />
        <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
      </>
    );
  }

  // ── Date view ────────────────────────────────────────────────────────────
  const allIncomeIds = new Set([...INCOME_CATEGORIES.map(c => c.id), ...incomeCategories.map(c => c.id)]);

  const byDate: Record<string, Transaction[]> = {};
  txs.forEach(tx => {
    const key = new Date(tx.date).toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(tx);
  });

  const dateRows = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateStr, dayTxs]) => {
      const expenses = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const income = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      return { dateStr, dayTxs, expenses, income };
    });

  if (dateRows.length === 0) {
    return (
      <div className="mx-4 py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
        No transactions this month
      </div>
    );
  }

  return (
    <>
      <div className="mx-4 space-y-2 pb-2">
        {dateRows.map(({ dateStr, dayTxs, expenses, income }) => {
          const isOpen = expanded === dateStr;
          const net = income - expenses;
          return (
            <div key={dateStr} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
              <button
                onClick={() => setExpanded(isOpen ? null : dateStr)}
                className="w-full flex items-center gap-3 px-4 py-3.5"
              >
                {/* Date circle */}
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                    {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-base font-black text-gray-700 dark:text-gray-200 leading-tight">
                    {new Date(dateStr + 'T12:00:00').getDate()}
                  </span>
                </div>

                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold dark:text-white">{formatDayLabel(dateStr)}</p>
                  <p className="text-[11px] text-gray-400">
                    {dayTxs.length} transaction{dayTxs.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    {expenses > 0 && <p className="text-xs font-bold text-gray-800 dark:text-gray-200">-{formatCurrency(expenses)}</p>}
                    {income > 0 && <p className="text-xs font-bold text-green-600">+{formatCurrency(income)}</p>}
                  </div>
                  <ChevronDown size={16} className={`text-gray-300 dark:text-gray-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-50 dark:border-gray-800">
                  {dayTxs
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(tx => {
                      const isIncome = allIncomeIds.has(tx.category) || tx.type === 'income';
                      return (
                        <TxRow key={tx.id} tx={tx} isIncome={isIncome} allCategories={allCategories}
                          formatCurrency={formatCurrency} onEdit={setEditTx} onDelete={removeTransaction}
                          onImageClick={setLightboxImage} showCategory viewYear={year} viewMonth={month} />
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <EditModal editTx={editTx} onClose={() => setEditTx(null)} />
      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

      {showCalendar && onCloseCalendar && (
        <CalendarOverlay
          year={year} month={month}
          transactions={transactions}
          formatCurrency={formatCurrency}
          onClose={onCloseCalendar}
        />
      )}
    </>
  );
}

// ─── Auto-debit action sheet ─────────────────────────────────────────────────
function AutoDebitActionSheet({
  tx,
  onStop,
  onEndHere,
  onCancel,
}: {
  tx: Transaction;
  onStop: () => void;
  onEndHere: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/60 animate-fade-in" onClick={onCancel}>
      <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up pb-10"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw size={14} className="text-purple-400" />
            <p className="text-sm font-bold dark:text-white">{tx.description || 'Auto-debit'}</p>
          </div>
          <p className="text-[11px] text-gray-400 mb-5">This is a future recurring transaction. Choose an action:</p>
          <button
            type="button"
            onClick={onEndHere}
            className="w-full py-3.5 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-left px-4 mb-3"
          >
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">End after this period</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Keep this occurrence and all past ones; cancel future ones</p>
          </button>
          <button
            type="button"
            onClick={onStop}
            className="w-full py-3.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-left px-4"
          >
            <p className="text-sm font-bold text-red-600 dark:text-red-400">Stop recurring entirely</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Remove all future occurrences of this recurring item</p>
          </button>
          <button type="button" onClick={onCancel} className="w-full mt-3 py-3 text-sm text-gray-400 font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────
function TxRow({
  tx, isIncome, allCategories, formatCurrency, onEdit, onDelete, onImageClick,
  showCategory = false, viewYear, viewMonth,
}: {
  tx: Transaction;
  isIncome: boolean;
  allCategories: { id: string; label: string; icon: string; color: string }[];
  formatCurrency: (n: number) => string;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onImageClick: (src: string) => void;
  showCategory?: boolean;
  viewYear?: number;
  viewMonth?: number;
}) {
  const { stopAutoDebit, endAutoDebitAt } = useApp();
  const [showAutoAction, setShowAutoAction] = useState(false);
  const cat = allCategories.find(c => c.id === tx.category);

  const now = new Date();
  const isGenerated = tx.id.includes('_auto_');
  const isFutureMonth = viewYear !== undefined && viewMonth !== undefined && (
    viewYear > now.getFullYear() ||
    (viewYear === now.getFullYear() && viewMonth > now.getMonth())
  );
  const showAutoAction_trigger = tx.isAutoDebit && isGenerated && isFutureMonth;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {tx.receiptImage ? (
          <button
            onClick={() => onImageClick(tx.receiptImage!)}
            className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0"
          >
            <img src={tx.receiptImage} alt="Receipt" className="w-full h-full object-cover" />
          </button>
        ) : showCategory && cat ? (
          <CategoryIcon icon={cat.icon} color={cat.color} size={14} />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0 ml-1" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium dark:text-gray-200 truncate">
            {tx.description || (cat?.label ?? tx.category)}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-[10px] text-gray-400">{formatDate(tx.date)}</p>
            {showCategory && cat && (
              <span className="text-[9px] text-gray-400 font-medium">{cat.label}</span>
            )}
            {tx.receiptImage && (
              <div className="flex items-center gap-0.5">
                <Receipt size={9} className="text-green-500" />
                <span className="text-[9px] text-green-500 font-medium">receipt</span>
              </div>
            )}
            {tx.isAutoDebit && (
              <button
                type="button"
                onClick={showAutoAction_trigger ? () => setShowAutoAction(true) : undefined}
                className={`flex items-center gap-0.5 ${showAutoAction_trigger ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
              >
                <RefreshCw size={9} className={isGenerated ? 'text-purple-400' : 'text-blue-500'} />
                <span className={`text-[9px] font-medium ${isGenerated ? 'text-purple-400' : 'text-blue-500'}`}>
                  {isGenerated ? (showAutoAction_trigger ? 'tap to manage' : 'auto') : (tx.autoDebitPeriod ?? 'recurring')}
                </span>
              </button>
            )}
          </div>
        </div>

        <span className={`text-xs font-semibold flex-shrink-0 ${isIncome ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
        </span>

        {!showAutoAction_trigger && (
          <>
            <button onClick={() => onEdit(tx)}
              className="ml-1 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <Edit2 size={11} className="text-blue-500" />
            </button>
            <button onClick={() => onDelete(tx.id)}
              className="ml-1 w-6 h-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <Trash2 size={11} className="text-red-500" />
            </button>
          </>
        )}
        {showAutoAction_trigger && (
          <button
            type="button"
            onClick={() => setShowAutoAction(true)}
            className="ml-1 w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <RefreshCw size={11} className="text-purple-400" />
          </button>
        )}
      </div>

      {showAutoAction && (
        <AutoDebitActionSheet
          tx={tx}
          onStop={() => { stopAutoDebit(tx.id); setShowAutoAction(false); }}
          onEndHere={() => { endAutoDebitAt(tx.id); setShowAutoAction(false); }}
          onCancel={() => setShowAutoAction(false)}
        />
      )}
    </>
  );
}

function EditModal({ editTx, onClose }: { editTx: Transaction | null; onClose: () => void }) {
  if (!editTx) return null;
  return (
    <ManualEntryModal
      transactionId={editTx.id}
      prefill={{
        type: editTx.type,
        amount: editTx.amount,
        category: editTx.category,
        description: editTx.description,
        receiptImage: editTx.receiptImage,
        date: editTx.date.slice(0, 10),
      }}
      onClose={onClose}
    />
  );
}

function Lightbox({ image, onClose }: { image: string | null; onClose: () => void }) {
  if (!image) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <img src={image} alt="Receipt" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
      >
        <X size={20} className="text-white" />
      </button>
    </div>
  );
}
