import { useState, useCallback } from 'react';
import {
  ArrowLeft, Sparkles, RotateCcw, ChevronDown, ChevronUp,
  Home, UtensilsCrossed, Car, Heart, Zap, Tv, ShoppingBag,
  PiggyBank, RefreshCw, Gem, MoreHorizontal, TrendingUp, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BudgetAllocation } from '../types';

const NOW = new Date();

interface BudgetGroup {
  label: string;
  color: string;
  categoryIds: string[];
  Icon: React.ElementType;
}

const BUDGET_GROUPS: BudgetGroup[] = [
  { label: 'Housing', color: '#14b8a6', categoryIds: ['housing'], Icon: Home },
  { label: 'Food & Dining', color: '#f97316', categoryIds: ['food'], Icon: UtensilsCrossed },
  { label: 'Transport', color: '#3b82f6', categoryIds: ['transport'], Icon: Car },
  { label: 'Health', color: '#ef4444', categoryIds: ['health'], Icon: Heart },
  { label: 'Utilities', color: '#eab308', categoryIds: ['utilities'], Icon: Zap },
  { label: 'Entertainment', color: '#8b5cf6', categoryIds: ['entertainment'], Icon: Tv },
  { label: 'Shopping', color: '#ec4899', categoryIds: ['shopping'], Icon: ShoppingBag },
  { label: 'Savings', color: '#22c55e', categoryIds: ['savings'], Icon: PiggyBank },
  { label: 'Subscriptions', color: '#64748b', categoryIds: ['subscriptions'], Icon: RefreshCw },
  { label: 'Personal', color: '#a855f7', categoryIds: ['personal'], Icon: Gem },
  { label: 'Other', color: '#94a3b8', categoryIds: ['education', 'travel', 'insurance', 'others'], Icon: MoreHorizontal },
];

function analyzeAllocations(income: number): BudgetAllocation[] {
  let plan: { id: string; pct: number }[];
  if (income >= 8000) {
    plan = [
      { id: 'housing', pct: 20 }, { id: 'food', pct: 10 }, { id: 'transport', pct: 5 },
      { id: 'health', pct: 5 }, { id: 'utilities', pct: 4 }, { id: 'entertainment', pct: 8 },
      { id: 'shopping', pct: 8 }, { id: 'savings', pct: 25 }, { id: 'subscriptions', pct: 3 },
      { id: 'personal', pct: 5 }, { id: 'other', pct: 7 },
    ];
  } else if (income >= 4000) {
    plan = [
      { id: 'housing', pct: 25 }, { id: 'food', pct: 15 }, { id: 'transport', pct: 5 },
      { id: 'health', pct: 5 }, { id: 'utilities', pct: 5 }, { id: 'entertainment', pct: 8 },
      { id: 'shopping', pct: 7 }, { id: 'savings', pct: 15 }, { id: 'subscriptions', pct: 3 },
      { id: 'personal', pct: 5 }, { id: 'other', pct: 7 },
    ];
  } else {
    plan = [
      { id: 'housing', pct: 30 }, { id: 'food', pct: 20 }, { id: 'transport', pct: 8 },
      { id: 'health', pct: 5 }, { id: 'utilities', pct: 8 }, { id: 'entertainment', pct: 5 },
      { id: 'shopping', pct: 5 }, { id: 'savings', pct: 10 }, { id: 'subscriptions', pct: 2 },
      { id: 'personal', pct: 4 }, { id: 'other', pct: 3 },
    ];
  }
  return BUDGET_GROUPS.map((g, i) => ({
    categoryId: g.categoryIds[0],
    label: g.label,
    color: g.color,
    percentage: plan[i]?.pct ?? 5,
  }));
}

function MiniDonut({ allocations, size = 140 }: { allocations: BudgetAllocation[]; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44, innerR = size * 0.27;
  const active = allocations.filter(a => a.percentage > 0);
  const total = active.reduce((s, a) => s + a.percentage, 0) || 100;
  const GAP = 0.03;
  let angle = -Math.PI / 2;

  if (active.length === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#e5e7eb" strokeWidth={outerR - innerR} />
      </svg>
    );
  }

  if (active.length === 1) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke={active[0].color} strokeWidth={outerR - innerR} />
      </svg>
    );
  }

  const arcs = active.map(a => {
    const sweep = (a.percentage / total) * Math.PI * 2 - GAP;
    const s = angle + GAP / 2;
    const e = s + Math.max(sweep, 0);
    angle += sweep + GAP;
    const x1 = cx + outerR * Math.cos(s), y1 = cy + outerR * Math.sin(s);
    const x2 = cx + outerR * Math.cos(e), y2 = cy + outerR * Math.sin(e);
    const x3 = cx + innerR * Math.cos(e), y3 = cy + innerR * Math.sin(e);
    const x4 = cx + innerR * Math.cos(s), y4 = cy + innerR * Math.sin(s);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${large} 0 ${x4},${y4} Z`;
    return { d, color: a.color };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => <path key={i} d={arc.d} fill={arc.color} />)}
    </svg>
  );
}

export default function BudgetPage() {
  const navigate = useNavigate();
  const { budget, updateBudget, getMonthTransactions, getMonthIncome } = useApp();

  const actualIncome = getMonthIncome(NOW.getFullYear(), NOW.getMonth());

  const [incomeInput, setIncomeInput] = useState(
    budget.expectedIncome > 0 ? String(budget.expectedIncome) : actualIncome > 0 ? String(actualIncome) : ''
  );
  const [allocations, setAllocations] = useState<BudgetAllocation[]>(
    budget.allocations.length > 0 ? budget.allocations : BUDGET_GROUPS.map(g => ({
      categoryId: g.categoryIds[0], label: g.label, color: g.color, percentage: 0,
    }))
  );
  const [analyzed, setAnalyzed] = useState(budget.allocations.length > 0);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const [savingsEnabled, setSavingsEnabled] = useState(true);
  const [savingsMode, setSavingsMode] = useState<'pct' | 'fixed'>('pct');
  const [savingsValue, setSavingsValue] = useState('');
  const [investEnabled, setInvestEnabled] = useState(false);
  const [investMode, setInvestMode] = useState<'pct' | 'fixed'>('pct');
  const [investValue, setInvestValue] = useState('');

  const income = parseFloat(incomeInput) || 0;
  const totalPct = allocations.reduce((s, a) => s + a.percentage, 0);

  const txs = getMonthTransactions(NOW.getFullYear(), NOW.getMonth());

  const actualByGroup: Record<string, number> = {};
  BUDGET_GROUPS.forEach(g => {
    actualByGroup[g.categoryIds[0]] = txs
      .filter(t => t.type === 'expense' && g.categoryIds.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);
  });

  function handleAnalyze() {
    if (income <= 0) return;
    const result = analyzeAllocations(income);
    setAllocations(result);
    setAnalyzed(true);
    setSavingsEnabled(true);
  }

  function handleReset() {
    setAllocations(BUDGET_GROUPS.map(g => ({
      categoryId: g.categoryIds[0], label: g.label, color: g.color, percentage: 0,
    })));
    setAnalyzed(false);
  }

  function handlePctChange(idx: number, val: number) {
    setAllocations(prev => prev.map((a, i) => i === idx ? { ...a, percentage: Math.max(0, Math.min(100, val)) } : a));
  }

  const savingsAmt = income > 0 && savingsValue
    ? savingsMode === 'pct' ? income * (parseFloat(savingsValue) / 100) : parseFloat(savingsValue)
    : 0;
  const investAmt = income > 0 && investValue
    ? investMode === 'pct' ? income * (parseFloat(investValue) / 100) : parseFloat(investValue)
    : 0;

  const handleSave = useCallback(() => {
    updateBudget({ expectedIncome: income, allocations });
    navigate('/');
  }, [income, allocations, updateBudget, navigate]);

  const refIncome = income > 0 ? income : (actualIncome > 0 ? actualIncome : 5000);

  const savingsPct = analyzed ? (allocations.find(a => a.categoryId === 'savings')?.percentage ?? 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 px-5 pt-12 pb-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <button type="button" onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-lg font-bold dark:text-white">Budget & Goals</h1>
          <p className="text-xs text-gray-400">Set your financial plan</p>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* Income input */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">Expected Monthly Income</p>
          {actualIncome > 0 && !budget.expectedIncome && (
            <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">
              Auto-filled from your {new Date(NOW.getFullYear(), NOW.getMonth()).toLocaleString('default', { month: 'long' })} income
            </p>
          )}
          <div className="flex items-center border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 focus-within:border-green-500 transition-colors bg-gray-50 dark:bg-gray-800 gap-2 mb-4">
            <span className="text-gray-400 font-semibold text-lg">$</span>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={incomeInput}
              onChange={e => setIncomeInput(e.target.value)}
              className="flex-1 bg-transparent text-xl font-bold outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
              inputMode="decimal"
            />
          </div>
          <button type="button" onClick={handleAnalyze} disabled={income <= 0}
            className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-green-600/20">
            <Sparkles size={16} />
            Analyze with AI
          </button>
          {analyzed && (
            <p className="text-center text-xs text-green-600 dark:text-green-400 font-medium mt-2">
              ✓ Optimal allocation calculated · Includes {savingsPct}% savings
            </p>
          )}
        </div>

        {/* Savings & Investment Goal card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Savings & Investment Goals</p>
            <p className="text-xs text-gray-400 mt-0.5">Optional — set a personal target alongside your budget</p>
          </div>

          {/* Savings goal */}
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PiggyBank size={16} className="text-green-500" />
                <span className="text-sm font-semibold dark:text-white">Monthly Savings Goal</span>
              </div>
              <button type="button" onClick={() => setSavingsEnabled(v => !v)} className="flex items-center">
                {savingsEnabled
                  ? <ToggleRight size={28} className="text-green-500" />
                  : <ToggleLeft size={28} className="text-gray-300 dark:text-gray-600" />}
              </button>
            </div>
            {savingsEnabled && (
              <>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setSavingsMode('pct')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${savingsMode === 'pct' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    % of income
                  </button>
                  <button type="button" onClick={() => setSavingsMode('fixed')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${savingsMode === 'fixed' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    Fixed $
                  </button>
                </div>
                <div className="flex items-center border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 gap-2 bg-gray-50 dark:bg-gray-800">
                  <span className="text-gray-400 text-sm">{savingsMode === 'pct' ? '%' : '$'}</span>
                  <input type="number" placeholder={savingsMode === 'pct' ? '20' : '1000'} value={savingsValue}
                    onChange={e => setSavingsValue(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-bold outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    inputMode="decimal" />
                  {savingsAmt > 0 && (
                    <span className="text-xs text-green-600 font-semibold">${Math.round(savingsAmt).toLocaleString()}/mo</span>
                  )}
                </div>
                {analyzed && savingsPct > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    AI suggests <span className="text-green-600 font-semibold">{savingsPct}%</span> (${Math.round(income * savingsPct / 100).toLocaleString()}/mo) for savings
                  </p>
                )}
              </>
            )}
          </div>

          {/* Investment goal */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-purple-500" />
                <span className="text-sm font-semibold dark:text-white">Monthly Investment Goal</span>
              </div>
              <button type="button" onClick={() => setInvestEnabled(v => !v)} className="flex items-center">
                {investEnabled
                  ? <ToggleRight size={28} className="text-purple-500" />
                  : <ToggleLeft size={28} className="text-gray-300 dark:text-gray-600" />}
              </button>
            </div>
            {investEnabled && (
              <>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setInvestMode('pct')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${investMode === 'pct' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    % of income
                  </button>
                  <button type="button" onClick={() => setInvestMode('fixed')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${investMode === 'fixed' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    Fixed $
                  </button>
                </div>
                <div className="flex items-center border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 gap-2 bg-gray-50 dark:bg-gray-800">
                  <span className="text-gray-400 text-sm">{investMode === 'pct' ? '%' : '$'}</span>
                  <input type="number" placeholder={investMode === 'pct' ? '10' : '500'} value={investValue}
                    onChange={e => setInvestValue(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-bold outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    inputMode="decimal" />
                  {investAmt > 0 && (
                    <span className="text-xs text-purple-600 font-semibold">${Math.round(investAmt).toLocaleString()}/mo</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Donut + total */}
        {analyzed && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Budget Allocation</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Math.abs(totalPct - 100) < 1 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-500'}`}>
                {totalPct.toFixed(0)}% allocated
              </span>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex-shrink-0 relative">
                <MiniDonut allocations={allocations} size={140} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-gray-400 font-medium">Budget</span>
                  <span className="text-base font-black dark:text-white">${Math.round(refIncome).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {allocations.filter(a => a.percentage > 0).slice(0, 6).map(a => (
                  <div key={a.categoryId} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{a.label}</span>
                    <span className="text-xs font-bold dark:text-white flex-shrink-0">{a.percentage}%</span>
                  </div>
                ))}
                {allocations.filter(a => a.percentage > 0).length > 6 && (
                  <p className="text-[11px] text-gray-400 pl-4">+{allocations.filter(a => a.percentage > 0).length - 6} more</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual adjustments */}
        {analyzed && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Adjust Manually</p>
              <button type="button" onClick={handleReset}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <RotateCcw size={12} />
                Reset
              </button>
            </div>

            {allocations.map((alloc, idx) => {
              const group = BUDGET_GROUPS[idx];
              const { Icon } = group;
              const budgetAmt = income > 0 ? Math.round(income * alloc.percentage / 100) : 0;
              const actual = actualByGroup[alloc.categoryId] || 0;
              const over = actual > budgetAmt && budgetAmt > 0;
              const isOpen = expandedIdx === idx;

              return (
                <div key={alloc.categoryId} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <button type="button" onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: alloc.color + '20' }}>
                      <Icon size={15} style={{ color: alloc.color }} strokeWidth={2} />
                    </span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium dark:text-white">{alloc.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: alloc.color }}>{alloc.percentage}%</span>
                          {budgetAmt > 0 && (
                            <span className="text-xs text-gray-400">${budgetAmt.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      {budgetAmt > 0 && (
                        <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, (actual / budgetAmt) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{alloc.percentage}%</span>
                        <input type="range" min={0} max={60} step={1} value={alloc.percentage}
                          onChange={e => handlePctChange(idx, parseInt(e.target.value))}
                          className="flex-1 accent-green-600" />
                        <input type="number" min={0} max={60} value={alloc.percentage}
                          onChange={e => handlePctChange(idx, parseInt(e.target.value) || 0)}
                          className="w-14 text-center text-sm font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-1 py-1 outline-none dark:text-white" />
                      </div>
                      {budgetAmt > 0 && (
                        <div className="flex justify-between text-xs mt-2">
                          <span className="text-gray-400">Budget: <span className="font-semibold dark:text-white">${budgetAmt.toLocaleString()}</span></span>
                          <span className={over ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                            Actual: ${actual.toLocaleString()} {over ? '▲ Over' : '✓ OK'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* This Month Summary */}
        {analyzed && income > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">This Month Summary</p>
            {allocations.filter(a => a.percentage > 0 && actualByGroup[a.categoryId] > 0).map(a => {
              const budgetAmt = Math.round(income * a.percentage / 100);
              const actual = actualByGroup[a.categoryId] || 0;
              const pct = budgetAmt > 0 ? Math.min(130, (actual / budgetAmt) * 100) : 0;
              const over = actual > budgetAmt;
              return (
                <div key={a.categoryId} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium dark:text-white">{a.label}</span>
                    <span className={`text-xs font-bold ${over ? 'text-red-500' : 'text-green-600'}`}>
                      ${actual} / ${budgetAmt}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: over ? '#f87171' : a.color }} />
                  </div>
                </div>
              );
            })}
            {allocations.filter(a => a.percentage > 0 && actualByGroup[a.categoryId] > 0).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No expense data for this month yet</p>
            )}
          </div>
        )}

        {/* Save button */}
        <button type="button" onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base shadow-lg shadow-green-600/30 active:scale-[0.98] transition-transform">
          Save Budget Plan
        </button>
      </div>
    </div>
  );
}
