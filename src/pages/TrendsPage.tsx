import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, X, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_COLORS: Record<string, string> = {
  food: '#f97316', transport: '#3b82f6', shopping: '#ec4899',
  entertainment: '#8b5cf6', health: '#ef4444', housing: '#14b8a6',
  utilities: '#eab308', education: '#06b6d4', travel: '#f43f5e',
  personal: '#a855f7', subscriptions: '#64748b', insurance: '#0ea5e9',
  savings: '#22c55e', others: '#94a3b8',
};

type Period = 'monthly' | 'quarterly' | 'annually';

interface DataPoint { label: string; value: number; }

function LinePath({ points, W, H, color, formatCurrency }: { points: DataPoint[]; W: number; H: number; color: string; formatCurrency: (n: number) => string }) {
  if (points.length < 2) return null;
  const max = Math.max(...points.map(p => p.value), 1);
  // generous padding so labels never escape the SVG boundary
  const pad = { top: 28, bottom: 30, left: 42, right: 14 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const coords = points.map((p, i) => ({
    x: pad.left + (i / (points.length - 1)) * chartW,
    y: pad.top + (1 - p.value / max) * chartH,
    value: p.value,
    label: p.label,
  }));

  // Smooth bezier path
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }

  const fillD = `${d} L ${coords[coords.length - 1].x} ${pad.top + chartH} L ${coords[0].x} ${pad.top + chartH} Z`;
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.5, 1].map(frac => (
        <line key={frac}
          x1={pad.left} x2={pad.left + chartW}
          y1={pad.top + frac * chartH} y2={pad.top + frac * chartH}
          stroke="#e5e7eb" strokeWidth={0.8}
        />
      ))}

      {/* Y-axis labels — anchored inside left pad */}
      {[0, 0.5, 1].map(frac => {
        const val = max * (1 - frac);
        return (
          <text key={frac}
            x={pad.left - 8} y={pad.top + frac * chartH + 4}
            textAnchor="end" fontSize={8} fill="#9ca3af">
            {formatCurrency(val)}
          </text>
        );
      })}

      {/* Area + line */}
      <path d={fillD} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Points + labels */}
      {coords.map((c, i) => {
        // Position labels above points, but ensure they stay within chart bounds
        // For very low values, position label above the point; for high values, below
        const isNearBottom = c.y > pad.top + chartH * 0.7;
        const labelOffset = isNearBottom ? -12 : 12;
        const labelY = Math.max(Math.min(c.y + labelOffset, pad.top + chartH - 8), 16);
        return (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={4} fill={color} stroke="white" strokeWidth={2} />
            {c.value > 0 && (
              <text x={c.x} y={labelY} textAnchor="middle" fontSize={8} fontWeight="600" fill={color}>
                {formatCurrency(c.value)}
              </text>
            )}
            {/* x-label sits inside the bottom pad */}
            <text x={c.x} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">{c.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function CategoryModal({
  categoryId, onClose, transactions, formatCurrency,
}: {
  categoryId: string;
  onClose: () => void;
  transactions: ReturnType<typeof useApp>['transactions'];
  formatCurrency: (n: number) => string;
}) {
  const [period, setPeriod] = useState<Period>('monthly');
  const color = CATEGORY_COLORS[categoryId] || '#94a3b8';
  const label = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  const now = new Date();

  const catTxs = transactions.filter(t => t.type === 'expense' && t.category === categoryId);

  const points = useMemo((): DataPoint[] => {
    if (period === 'monthly') {
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const m = d.getMonth(), y = d.getFullYear();
        const val = catTxs.filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === m && td.getFullYear() === y;
        }).reduce((s, t) => s + t.amount, 0);
        return { label: MONTH_NAMES[m], value: val };
      });
    }
    if (period === 'quarterly') {
      return Array.from({ length: 8 }, (_, i) => {
        const totalQuarters = (now.getFullYear() - 2020) * 4 + Math.floor(now.getMonth() / 3);
        const qi = totalQuarters - 7 + i;
        const year = 2020 + Math.floor(qi / 4);
        const q = qi % 4;
        const startMonth = q * 3, endMonth = startMonth + 2;
        const val = catTxs.filter(t => {
          const td = new Date(t.date);
          return td.getFullYear() === year && td.getMonth() >= startMonth && td.getMonth() <= endMonth;
        }).reduce((s, t) => s + t.amount, 0);
        return { label: `Q${q + 1} ${String(year).slice(2)}`, value: val };
      });
    }
    // annually — last 5 years
    return Array.from({ length: 5 }, (_, i) => {
      const year = now.getFullYear() - 4 + i;
      const val = catTxs.filter(t => new Date(t.date).getFullYear() === year).reduce((s, t) => s + t.amount, 0);
      return { label: String(year), value: val };
    });
  }, [period, catTxs]);

  const total = points.reduce((s, p) => s + p.value, 0);
  const nonZero = points.filter(p => p.value > 0);
  const avg = nonZero.length > 0 ? total / nonZero.length : 0;
  const highest = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]);
  const periodLabel = period === 'monthly' ? 'last 12 months' : period === 'quarterly' ? 'last 8 quarters' : 'last 5 years';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
              <span className="w-3 h-3 rounded-full" style={{ background: color, display: 'block' }} />
            </div>
            <div>
              <h3 className="text-base font-bold dark:text-white">{label}</h3>
              <p className="text-[11px] text-gray-400">{periodLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Period toggle */}
        <div className="flex-shrink-0 px-5 mb-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 text-[11px] font-semibold">
            {(['monthly', 'quarterly', 'annually'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-1.5 rounded-[10px] transition-all capitalize ${period === p ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-shrink-0 px-3">
          {total === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-gray-400">No data for this period</p>
            </div>
          ) : (
            <LinePath points={points} W={390} H={160} color={color} formatCurrency={formatCurrency} />
          )}
        </div>

        {/* Stats row */}
        <div className="flex-shrink-0 px-5 mt-2 grid grid-cols-3 gap-3 pb-4">
          {[
            { label: 'Total', value: formatCurrency(total) },
            { label: 'Avg / period', value: formatCurrency(avg) },
            { label: 'Highest', value: highest && highest.value > 0 ? `${formatCurrency(highest.value)} (${highest.label})` : '—' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-sm font-bold dark:text-white leading-tight">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Individual transactions for this category (scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-10">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">Recent transactions</p>
          {catTxs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {[...catTxs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium dark:text-white">{t.description}</p>
                    <p className="text-[11px] text-gray-400">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <span className="text-sm font-bold text-red-500">-{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrendsPage() {
  const { transactions, formatCurrency } = useApp();
  const [view, setView] = useState<'spending' | 'income'>('spending');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllCats, setShowAllCats] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();

  const monthlyData = useMemo(() => {
    const data: { month: number; year: number; income: number; expenses: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth(), year = d.getFullYear();
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
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
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
        <div className="bg-red-500 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] text-red-100 font-semibold uppercase tracking-wide mb-1">This Month</p>
          <p className="text-xl font-black text-white">{formatCurrency(currentMonth.expenses)}</p>
          <p className="text-[11px] text-red-100 mt-0.5">spent</p>
          {prevMonth.expenses > 0 && (
            <div className="flex items-center gap-1 mt-2 text-red-100">
              {spendDiff > 0 ? <TrendingUp size={12} /> : spendDiff < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
              <span className="text-[11px] font-semibold">{spendDiff === 0 ? 'Same' : `${spendPct}% ${spendDiff > 0 ? 'more' : 'less'} than last month`}</span>
            </div>
          )}
        </div>
        <div className="bg-green-600 rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] text-green-100 font-semibold uppercase tracking-wide mb-1">This Month</p>
          <p className="text-xl font-black text-white">{formatCurrency(currentMonth.income)}</p>
          <p className="text-[11px] text-green-100 mt-0.5">earned</p>
          {currentMonth.income > 0 && (
            <div className="flex items-center gap-1 mt-2 text-green-100">
              {currentMonth.income >= currentMonth.expenses ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span className="text-[11px] font-semibold">
                {currentMonth.income >= currentMonth.expenses ? 'Surplus' : 'Deficit'} {formatCurrency(Math.abs(currentMonth.income - currentMonth.expenses))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bar chart */}
      <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-50 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold dark:text-white">Monthly Overview</p>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 text-[11px] font-semibold">
            {(['spending', 'income'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-[10px] transition-all capitalize ${view === v ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-400'}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-2 h-36">
          {monthlyData.map((m, i) => {
            const val = view === 'spending' ? m.expenses : m.income;
            const heightPct = maxBar > 0 ? (val / maxBar) * 100 : 0;
            const isLast = i === monthlyData.length - 1;
            const barColor = view === 'spending' ? (isLast ? '#ef4444' : '#fee2e2') : (isLast ? '#16a34a' : '#dcfce7');
            const darkBarColor = view === 'spending' ? (isLast ? '#ef4444' : '#7f1d1d') : (isLast ? '#16a34a' : '#166534');
            return (
              <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-400 font-medium">
                  {val > 0 ? formatCurrency(val) : ''}
                </span>
                <div className="w-full flex flex-col justify-end" style={{ height: 96 }}>
                  <div style={{ height: `${Math.max(heightPct, val > 0 ? 4 : 0)}%` }}>
                    <style>{`.dark [data-bar="${m.month}${m.year}"] { background: ${darkBarColor} !important; } [data-bar="${m.month}${m.year}"] { background: ${barColor} !important; }`}</style>
                    <div data-bar={`${m.month}${m.year}`} className="w-full h-full rounded-t-lg transition-all duration-500" style={{ background: barColor }} />
                  </div>
                </div>
                <span className={`text-[10px] font-medium ${isLast ? (view === 'spending' ? 'text-red-500' : 'text-green-600') : 'text-gray-400 dark:text-gray-500'}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Categories — clickable + expandable */}
      <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <p className="text-sm font-bold dark:text-white">Categories</p>
          <span className="text-[11px] text-gray-400">{currentYear} · tap to explore</span>
        </div>
        {categoryTotals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No expense data yet</p>
        ) : (
          <>
            {(showAllCats ? categoryTotals : categoryTotals.slice(0, 5)).map(([id, amount]) => {
              const pct = totalExpensesThisYear > 0 ? (amount / totalExpensesThisYear) * 100 : 0;
              const color = CATEGORY_COLORS[id] || '#94a3b8';
              const catLabel = id.charAt(0).toUpperCase() + id.slice(1);
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className="w-full px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-sm font-medium dark:text-white">{catLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">{pct.toFixed(0)}%</span>
                      <span className="text-sm font-bold dark:text-white">{formatCurrency(amount)}</span>
                      <ChevronRight size={13} className="text-gray-300 dark:text-gray-600" />
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </button>
              );
            })}
            {categoryTotals.length > 5 && (
              <button
                onClick={() => setShowAllCats(v => !v)}
                className="w-full py-3 border-t border-gray-100 dark:border-gray-800 text-[12px] font-semibold text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {showAllCats
                  ? 'Show less'
                  : `Show ${categoryTotals.length - 5} more categor${categoryTotals.length - 5 === 1 ? 'y' : 'ies'}`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Income vs Expenses */}
      <div className="mx-4 mt-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-50 dark:border-gray-800">
        <p className="text-sm font-bold dark:text-white mb-4">Income vs Expenses</p>
        <div className="space-y-2.5">
          {[...monthlyData].reverse().map(m => {
            const maxVal = Math.max(m.income, m.expenses, 1);
            const surplus = m.income - m.expenses;
            return (
              <div key={`${m.year}-${m.month}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 w-8">{m.label}</span>
                  <div className="flex-1 mx-3 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all duration-700" style={{ width: `${(m.income / maxVal) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-400 transition-all duration-700" style={{ width: `${(m.expenses / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold w-16 text-right ${surplus > 0 ? 'text-green-600' : surplus < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {surplus === 0 ? '–' : `${surplus > 0 ? '+' : '-'}${formatCurrency(Math.abs(surplus))}`}
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

      {/* Category detail modal */}
      {selectedCategory && (
        <CategoryModal
          categoryId={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          transactions={transactions}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}
