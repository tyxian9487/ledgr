import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316', transport: '#3b82f6', shopping: '#ec4899',
  entertainment: '#8b5cf6', health: '#ef4444', housing: '#14b8a6',
  utilities: '#eab308', education: '#06b6d4', travel: '#f43f5e',
  personal: '#a855f7', subscriptions: '#64748b', insurance: '#0ea5e9',
  savings: '#22c55e', others: '#94a3b8',
};

export default function TrendsPage() {
  const { transactions } = useApp();
  const [view, setView] = useState<'spending' | 'income'>('spending');

  const now = new Date();
  const currentYear = now.getFullYear();

  const monthlyData = useMemo(() => {
    const data: { month: number; year: number; income: number; expenses: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const txs = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === month && td.getFullYear() === year;
      });
      data.push({
        month, year,
        income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        label: MONTH_NAMES[month],
      });
    }
    return data;
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const yearTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && t.type === 'expense';
    });
    const totals: Record<string, number> = {};
    yearTxs.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [transactions, currentYear]);

  const totalExpensesThisYear = categoryTotals.reduce((s, [, v]) => s + v, 0);

  const currentMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const spendDiff = currentMonth.expenses - prevMonth.expenses;
  const spendPct = prevMonth.expenses > 0 ? Math.round(Math.abs(spendDiff / prevMonth.expenses) * 100) : 0;

  const bars = view === 'spending' ? monthlyData.map(m => m.expenses) : monthlyData.map(m => m.income);
  const maxBar = Math.max(...bars, 1);

  return (
    <div className="pb-28 overflow-y-auto min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="px-5 pt-12 pb-2">
        <h1 className="text-xl font-bold dark:text-white">Trends</h1>
        <p className="text-xs text-gray-400 mt-0.5">Last 6 months overview</p>
      </div>

      {/* Summary cards */}
      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1">This Month</p>
          <p className="text-xl font-black dark:text-white">${currentMonth.expenses.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">spent</p>
          {prevMonth.expenses > 0 && (
            <div className={`flex items-center gap-1 mt-2 ${spendDiff > 0 ? 'text-red-500' : spendDiff < 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {spendDiff > 0 ? <TrendingUp size={12} /> : spendDiff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
              <span className="text-[11px] font-semibold">{spendDiff === 0 ? 'Same' : `${spendPct}% vs last month`}</span>
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-1">This Month</p>
          <p className="text-xl font-black text-green-600">${currentMonth.income.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">earned</p>
          {currentMonth.income > 0 && (
            <div className={`flex items-center gap-1 mt-2 ${currentMonth.income >= currentMonth.expenses ? 'text-green-600' : 'text-red-500'}`}>
              {currentMonth.income >= currentMonth.expenses ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span className="text-[11px] font-semibold">
                {currentMonth.income >= currentMonth.expenses ? 'Surplus' : 'Deficit'} ${Math.abs(currentMonth.income - currentMonth.expenses).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bar chart */}
      <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-50 dark:border-gray-800">
        {/* Toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold dark:text-white">Monthly Overview</p>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => setView('spending')}
              className={`px-3 py-1 rounded-[10px] transition-all ${view === 'spending' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400'}`}
            >
              Spending
            </button>
            <button
              onClick={() => setView('income')}
              className={`px-3 py-1 rounded-[10px] transition-all ${view === 'income' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400'}`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Bars */}
        <div className="flex items-end gap-2 h-36">
          {monthlyData.map((m, i) => {
            const val = view === 'spending' ? m.expenses : m.income;
            const heightPct = maxBar > 0 ? (val / maxBar) * 100 : 0;
            const isLast = i === monthlyData.length - 1;
            const barColor = view === 'spending'
              ? (isLast ? '#16a34a' : '#dcfce7')
              : (isLast ? '#3b82f6' : '#dbeafe');
            const darkBarColor = view === 'spending'
              ? (isLast ? '#16a34a' : '#166534')
              : (isLast ? '#3b82f6' : '#1e3a5f');
            return (
              <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-400 font-medium">
                  {val > 0 ? `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}` : ''}
                </span>
                <div className="w-full flex flex-col justify-end" style={{ height: 96 }}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%`,
                      background: `var(--bar-color, ${barColor})`,
                    }}
                  >
                    <style>{`.dark [data-bar="${m.month}${m.year}"] { background: ${darkBarColor} !important; } [data-bar="${m.month}${m.year}"] { background: ${barColor} !important; }`}</style>
                    <div data-bar={`${m.month}${m.year}`} className="w-full h-full rounded-t-lg" style={{ background: barColor }} />
                  </div>
                </div>
                <span className={`text-[10px] font-medium ${isLast ? (view === 'spending' ? 'text-green-600' : 'text-blue-600') : 'text-gray-400 dark:text-gray-500'}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Categories */}
      <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-50 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold dark:text-white">Top Categories</p>
          <span className="text-[11px] text-gray-400">{currentYear}</span>
        </div>
        {categoryTotals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No expense data yet</p>
        ) : (
          <div className="space-y-3">
            {categoryTotals.map(([id, amount]) => {
              const pct = totalExpensesThisYear > 0 ? (amount / totalExpensesThisYear) * 100 : 0;
              const color = CATEGORY_COLORS[id] || '#94a3b8';
              const label = id.charAt(0).toUpperCase() + id.slice(1);
              return (
                <div key={id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-sm font-medium dark:text-white">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{pct.toFixed(0)}%</span>
                      <span className="text-sm font-bold dark:text-white">${amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6-month income vs expenses */}
      <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-50 dark:border-gray-800">
        <p className="text-sm font-bold dark:text-white mb-4">Income vs Expenses</p>
        <div className="space-y-2.5">
          {[...monthlyData].reverse().map(m => {
            const maxVal = Math.max(m.income, m.expenses, 1);
            const incPct = (m.income / maxVal) * 100;
            const expPct = (m.expenses / maxVal) * 100;
            const surplus = m.income - m.expenses;
            return (
              <div key={`${m.year}-${m.month}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 w-8">{m.label}</span>
                  <div className="flex-1 mx-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${incPct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-400 transition-all duration-700" style={{ width: `${expPct}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold w-16 text-right ${surplus > 0 ? 'text-green-600' : surplus < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {surplus === 0 ? '–' : `${surplus > 0 ? '+' : '-'}$${Math.abs(surplus).toLocaleString()}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-[11px] text-gray-400">Income</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-[11px] text-gray-400">Expenses</span></div>
        </div>
      </div>
    </div>
  );
}
