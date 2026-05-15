import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Sparkles, RotateCcw, ChevronDown, ChevronUp,
  Home, UtensilsCrossed, Car, Heart, Zap, Tv, ShoppingBag,
  PiggyBank, RefreshCw, Gem, MoreHorizontal, TrendingUp, ToggleLeft, ToggleRight,
  Lock, Unlock, X, Plus,
} from 'lucide-react';
import { iconMap } from '../components/home/CategoryIcon';
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

  const filtered = plan.filter(item => item.id !== 'savings');
  const totalPct = filtered.reduce((sum, item) => sum + item.pct, 0) || 1;
  const scaled = filtered.map(item => ({
    ...item,
    pct: Math.round((item.pct / totalPct) * 100),
  }));

  const groups = BUDGET_GROUPS.filter(g => g.categoryIds[0] !== 'savings');
  return groups.map((g, index) => ({
    categoryId: g.categoryIds[0],
    label: g.label,
    color: g.color,
    percentage: scaled[index]?.pct ?? 0,
  }));
}

function MiniDonut({ allocations, size = 140, activeSlice, onSliceClick }: {
  allocations: BudgetAllocation[];
  size?: number;
  activeSlice: string | null;
  onSliceClick: (id: string | null) => void;
}) {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44, innerR = size * 0.27;
  const active = allocations.filter(a => a.percentage > 0);
  const total = active.reduce((s, a) => s + a.percentage, 0) || 100;
  const GAP = 0.03;
  let angle = -Math.PI / 2;

  const arcs = active.map(a => {
    const sweep = (a.percentage / total) * Math.PI * 2 - GAP;
    const s = angle + GAP / 2;
    const e = s + Math.max(sweep, 0);
    const path = {
      category: a.categoryId,
      label: a.label,
      percentage: a.percentage,
      color: a.color,
      d: '',
    };
    const x1 = cx + outerR * Math.cos(s), y1 = cy + outerR * Math.sin(s);
    const x2 = cx + outerR * Math.cos(e), y2 = cy + outerR * Math.sin(e);
    const x3 = cx + innerR * Math.cos(e), y3 = cy + innerR * Math.sin(e);
    const x4 = cx + innerR * Math.cos(s), y4 = cy + innerR * Math.sin(s);
    const large = sweep > Math.PI ? 1 : 0;
    path.d = `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${large} 0 ${x4},${y4} Z`;
    angle += sweep + GAP;
    return path;
  });

  if (active.length === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="#e5e7eb" strokeWidth={outerR - innerR} />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {active.length === 1 ? (
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke={active[0].color} strokeWidth={outerR - innerR} />
      ) : (
        arcs.map(arc => (
          <path
            key={arc.category}
            d={arc.d}
            fill={arc.color}
            opacity={activeSlice && activeSlice !== arc.category ? 0.4 : 1}
            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
            onClick={() => onSliceClick(activeSlice === arc.category ? null : arc.category)}
          />
        ))
      )}
    </svg>
  );
}

export default function BudgetPage() {
  const navigate = useNavigate();
  const { budget, updateBudget, getMonthTransactions, getMonthIncome, formatCurrency, getCurrencySymbol, removeCustomGoal } = useApp();

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
  const [showAllAdjust, setShowAllAdjust] = useState(false);
  const [saved, setSaved] = useState(false);

  const [incomeFixed, setIncomeFixed] = useState(budget.incomeFixed ?? false);
  const [showGoals, setShowGoals] = useState(true);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  const income = parseFloat(incomeInput) || 0;

  const initialSavingsValue = budget.savingsGoal
    ? budget.savingsGoal.mode === 'pct'
      ? income > 0 ? String(Math.round((budget.savingsGoal.amount / income) * 100)) : String(Math.round(budget.savingsGoal.amount))
      : String(Math.round(budget.savingsGoal.amount))
    : '';

  const initialInvestValue = budget.investmentGoal
    ? budget.investmentGoal.mode === 'pct'
      ? income > 0 ? String(Math.round((budget.investmentGoal.amount / income) * 100)) : String(Math.round(budget.investmentGoal.amount))
      : String(Math.round(budget.investmentGoal.amount))
    : '';

  const [savingsEnabled, setSavingsEnabled] = useState(budget.savingsGoal?.enabled ?? false);
  const [savingsMode, setSavingsMode] = useState<'pct' | 'fixed'>(budget.savingsGoal?.mode ?? 'pct');
  const [savingsValue, setSavingsValue] = useState(initialSavingsValue);
  const [investEnabled, setInvestEnabled] = useState(budget.investmentGoal?.enabled ?? false);
  const [investMode, setInvestMode] = useState<'pct' | 'fixed'>(budget.investmentGoal?.mode ?? 'pct');
  const [investValue, setInvestValue] = useState(initialInvestValue);

  const [recoIsHighGoal, setRecoIsHighGoal] = useState(false);
  const [showRecoTooltip, setShowRecoTooltip] = useState(
    () => !!localStorage.getItem('ledgr_onboarding_reco') && !localStorage.getItem('ledgr_reco_tooltip_seen')
  );
  const recoApplied = useRef(false);

  const currentSavingsValue = savingsValue;
  const currentInvestValue = investValue;

  const budgetSavingsValue = initialSavingsValue;
  const budgetInvestValue = initialInvestValue;

  const allocationsEqual = (a: BudgetAllocation[], b: BudgetAllocation[]) => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item.categoryId === b[index]?.categoryId && item.percentage === b[index]?.percentage);
  };

  const isDirty =
    String(budget.expectedIncome) !== incomeInput.trim() ||
    (budget.incomeFixed ?? false) !== incomeFixed ||
    !allocationsEqual(budget.allocations, allocations) ||
    (budget.savingsGoal?.enabled ?? false) !== savingsEnabled ||
    (budget.savingsGoal?.mode ?? 'pct') !== savingsMode ||
    budgetSavingsValue !== currentSavingsValue ||
    (budget.investmentGoal?.enabled ?? false) !== investEnabled ||
    (budget.investmentGoal?.mode ?? 'pct') !== investMode ||
    budgetInvestValue !== currentInvestValue;

  useEffect(() => {
    if (isDirty && saved) {
      setSaved(false);
    }
  }, [isDirty, saved]);

  // Update display values when income or budget changes
  useEffect(() => {
    if (budget.savingsGoal && income > 0) {
      const value = budget.savingsGoal.mode === 'pct' 
        ? (budget.savingsGoal.amount / income) * 100 
        : budget.savingsGoal.amount;
      setSavingsValue(String(Math.round(value)));
    }
  }, [budget.savingsGoal, income]);

  useEffect(() => {
    if (budget.investmentGoal && income > 0) {
      const value = budget.investmentGoal.mode === 'pct'
        ? (budget.investmentGoal.amount / income) * 100
        : budget.investmentGoal.amount;
      setInvestValue(String(Math.round(value)));
    }
  }, [budget.investmentGoal, income]);

  useEffect(() => {
    if (recoApplied.current) return;
    recoApplied.current = true;
    const raw = localStorage.getItem('ledgr_onboarding_reco');
    if (!raw) return;
    try {
      const reco = JSON.parse(raw);
      setRecoIsHighGoal(reco.isHighGoal ?? false);
      if (budget.allocations.length > 0) return;
      setSavingsEnabled(reco.enableSavings ?? false);
      if (reco.enableSavings) {
        setSavingsMode('pct');
        setSavingsValue(String(reco.savingsPct ?? ''));
      }
      setInvestEnabled(reco.enableInvestment ?? false);
      if (reco.enableInvestment) {
        setInvestMode('pct');
        setInvestValue(String(reco.investPct ?? ''));
      }
    } catch { /* malformed reco data */ }
  }, [budget.allocations.length]);

  function dismissRecoTooltip() {
    localStorage.setItem('ledgr_reco_tooltip_seen', '1');
    setShowRecoTooltip(false);
  }

  const totalPct = allocations.reduce((s, a) => s + a.percentage, 0);

  const txs = getMonthTransactions(NOW.getFullYear(), NOW.getMonth());

  const actualByGroup: Record<string, number> = {};
  BUDGET_GROUPS.forEach(g => {
    actualByGroup[g.categoryIds[0]] = txs
      .filter(t => t.type === 'expense' && g.categoryIds.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);
  });

  // Validate: goals that are enabled must have a value before generating
  const canAnalyze = income > 0
    && (!savingsEnabled || savingsValue.trim() !== '')
    && (!investEnabled || investValue.trim() !== '');

  const analyzeBlockReason = income <= 0
    ? 'Enter your expected income first'
    : savingsEnabled && savingsValue.trim() === ''
    ? 'Enter your savings goal amount or disable it'
    : investEnabled && investValue.trim() === ''
    ? 'Enter your investment goal amount or disable it'
    : null;

  function handleAnalyze() {
    if (!canAnalyze) return;
    const savAmt = savingsEnabled && savingsValue
      ? savingsMode === 'pct' ? income * (parseFloat(savingsValue) / 100) : parseFloat(savingsValue)
      : 0;
    const invAmt = investEnabled && investValue
      ? investMode === 'pct' ? income * (parseFloat(investValue) / 100) : parseFloat(investValue)
      : 0;
    const spendable = Math.max(0, income - savAmt - invAmt);
    const result = analyzeAllocations(spendable);
    setAllocations(result);
    setAnalyzed(true);
  }

  function handleReset() {
    setAllocations(BUDGET_GROUPS.map(g => ({
      categoryId: g.categoryIds[0], label: g.label, color: g.color, percentage: 0,
    })));
    setAnalyzed(false);
  }

  function handlePctChange(idx: number, val: number) {
    setAllocations(prev => {
      const otherTotal = prev.reduce((sum, a, i) => i === idx ? sum : sum + a.percentage, 0);
      const maxAllowed = Math.max(0, 100 - otherTotal);
      const clamped = Math.max(0, Math.min(maxAllowed, val));
      return prev.map((a, i) => i === idx ? { ...a, percentage: clamped } : a);
    });
  }

  const savingsAmt = income > 0 && savingsValue
    ? savingsMode === 'pct' ? income * (parseFloat(savingsValue) / 100) : parseFloat(savingsValue)
    : 0;
  const investAmt = income > 0 && investValue
    ? investMode === 'pct' ? income * (parseFloat(investValue) / 100) : parseFloat(investValue)
    : 0;
  const netIncome = Math.max(0, income - savingsAmt - investAmt);

  const handleSave = useCallback(() => {
    const savingsGoal = savingsEnabled && savingsValue ? {
      enabled: true,
      amount: savingsMode === 'pct' ? income * (parseFloat(savingsValue) / 100) : parseFloat(savingsValue),
      mode: savingsMode,
    } : undefined;
    
    const investmentGoal = investEnabled && investValue ? {
      enabled: true,
      amount: investMode === 'pct' ? income * (parseFloat(investValue) / 100) : parseFloat(investValue),
      mode: investMode,
    } : undefined;
    
    updateBudget({ 
      expectedIncome: income, 
      allocations, 
      incomeFixed,
      savingsGoal,
      investmentGoal,
    });
    setSaved(true);
    navigate('/');
  }, [income, allocations, incomeFixed, savingsEnabled, savingsValue, savingsMode, investEnabled, investValue, investMode, updateBudget, navigate]);

  const refIncome = income > 0 ? income : (actualIncome > 0 ? actualIncome : 5000);
  const chartAmount = analyzed ? netIncome : refIncome;

  const savingsPct = analyzed ? (allocations.find(a => a.categoryId === 'savings')?.percentage ?? 0) : 0;

  // Savings is already baked into allocations by handleAnalyze.
  // Only add investment goal as an extra display item.
  const displayAllocations: BudgetAllocation[] = allocations;

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden" style={{ height: '100dvh' }}>
      {/* Header — non-scrolling */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 px-5 pt-12 pb-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <button type="button" onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-lg font-bold dark:text-white">Budget & Goals</h1>
          <p className="text-xs text-gray-400">Set your financial plan</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-28 space-y-4" style={{ overscrollBehavior: 'contain' }}>

        {/* Income input */}
        <div data-tour="budget-income" className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Expected Monthly Income</p>
            <button
              type="button"
              onClick={() => setIncomeFixed(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                incomeFixed
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }`}
            >
              {incomeFixed ? <Lock size={10} /> : <Unlock size={10} />}
              {incomeFixed ? 'Fixed' : 'Variable'}
            </button>
          </div>
          {actualIncome > 0 && !budget.expectedIncome && (
            <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">
              Auto-filled from your {new Date(NOW.getFullYear(), NOW.getMonth()).toLocaleString('default', { month: 'long' })} income
            </p>
          )}
          <div className="flex items-center border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 focus-within:border-green-500 transition-colors bg-gray-50 dark:bg-gray-800 gap-2 mb-4">
            <span className="text-gray-400 font-semibold text-lg">{getCurrencySymbol()}</span>
            <input
              type="number"
              placeholder="e.g. 5000"
              value={incomeInput}
              onChange={e => setIncomeInput(e.target.value)}
              className="flex-1 bg-transparent text-xl font-bold outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
              inputMode="decimal"
            />
          </div>
          <button type="button" onClick={handleAnalyze} disabled={!canAnalyze}
            className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all shadow-md shadow-green-600/20">
            <Sparkles size={16} />
            Analyze with AI
          </button>
          {analyzeBlockReason && (
            <p className="text-left text-xs text-amber-500 dark:text-amber-400 font-medium mt-2">⚠ {analyzeBlockReason}</p>
          )}
          {analyzed && !analyzeBlockReason && (
            <p className="text-left text-xs text-green-600 dark:text-green-400 font-medium mt-2">
              ✓ Allocation generated{savingsEnabled && savingsValue ? ` · Savings locked at ${savingsPct}%` : ` · Includes ${savingsPct}% savings`}{investEnabled && investValue ? ` · Investment goal included` : ''}
            </p>
          )}
        </div>

        {/* Savings & Investment Goal card */}
        <div data-tour="budget-goals" className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGoals(v => !v)}
            className="w-full px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-50 dark:border-gray-800"
          >
            <div className="text-left">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider">Goals</p>
              {!showGoals && savingsEnabled && savingsAmt > 0 ? (
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 font-medium">
                  {`Savings ${formatCurrency(savingsAmt)}/mo`}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Optional — set a personal target</p>
              )}
            </div>
            <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200 ${showGoals ? 'rotate-180' : ''}`} />
          </button>

          {showGoals && (<>
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
                    Fixed {getCurrencySymbol()}
                  </button>
                </div>
                <div className="flex items-center border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 gap-2 bg-gray-50 dark:bg-gray-800">
                  <span className="text-gray-400 text-sm">{savingsMode === 'pct' ? '%' : getCurrencySymbol()}</span>
                  <input type="number" placeholder={savingsMode === 'pct' ? '20' : '1000'} value={savingsValue}
                    onChange={e => setSavingsValue(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-bold outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    inputMode="decimal" />
                </div>
                {savingsAmt > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1.5 text-right">
                    = {formatCurrency(savingsAmt)} / mo
                  </p>
                )}
                {analyzed && savingsPct > 0 && (
                  <p className="text-xs text-gray-400 mt-2 text-left">
                    AI suggests <span className="text-green-600 font-semibold">{savingsPct}%</span> ({formatCurrency(income * savingsPct / 100)}/mo) for savings
                  </p>
                )}
              </>
            )}
          </div>


          {(budget.customGoals ?? []).map(goal => {
            const GoalIcon = iconMap[goal.icon] || PiggyBank;
            const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
            const daysLeft = Math.max(0, Math.round((new Date(goal.startDate).getTime() + goal.durationDays * 86400000 - Date.now()) / 86400000));
            return (
              <div key={goal.id} className="px-5 py-4 border-b border-gray-50 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: goal.color + '20' }}>
                    <GoalIcon size={16} style={{ color: goal.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold dark:text-white truncate">{goal.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)} · {daysLeft}d left</p>
                  </div>
                  <button type="button" onClick={() => removeCustomGoal(goal.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: goal.color }} />
                </div>
              </div>
            );
          })}
          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => navigate('/goals/new')}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
            >
              <Plus size={16} />
              Add Goal
            </button>
          </div>
          </>)}
        </div>

        {/* Donut + total */}
        {analyzed && (
          <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 rounded-3xl p-5 border border-green-700 shadow-lg shadow-green-500/20 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-green-100 uppercase tracking-wider">Budget Allocation</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${Math.abs(totalPct - 100) < 1 ? 'bg-white/20 text-white' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-500'}`}>
                {totalPct.toFixed(0)}% allocated
              </span>
            </div>
            {(savingsAmt > 0 || investAmt > 0) && income > 0 && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white/10 rounded-xl">
                <span className="text-xs text-green-100/90 flex-1">Spendable after goals</span>
                <span className="text-xs font-bold text-white">{formatCurrency(netIncome)}</span>
                <span className="text-[10px] text-green-100/80">/ {formatCurrency(income)}</span>
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              {/* Fixed-size wrapper so inset-0 always aligns with the SVG circle */}
              <div className="relative" style={{ width: 140, height: 140 }}>
                <MiniDonut
                  allocations={displayAllocations}
                  size={140}
                  activeSlice={activeSlice}
                  onSliceClick={setActiveSlice}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-gray-400 font-medium">Spendable</span>
                  <span className="text-base font-black dark:text-white">{formatCurrency(chartAmount)}</span>
                </div>
              </div>
              {/* Tooltip rendered outside the fixed container so it never shifts center text */}
              {(() => {
                const sel = displayAllocations.find(a => a.categoryId === activeSlice);
                return sel ? (
                  <div className="flex items-center gap-2 glass rounded-full px-3 py-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sel.color }} />
                    <span className="text-xs text-white font-medium">{sel.label}</span>
                    <span className="text-xs text-white/80">{sel.percentage}%</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-green-100/80">Tap a slice to view category details</p>
                );
              })()}
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

            {(showAllAdjust ? allocations : allocations.slice(0, 5)).map((alloc, idx) => {
              const group = BUDGET_GROUPS[idx];
              const { Icon } = group;
              const budgetAmt = netIncome > 0 ? Math.round(netIncome * alloc.percentage / 100) : 0;
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
                            <span className="text-xs text-gray-400">{formatCurrency(budgetAmt)}</span>
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
                          <span className="text-gray-400">Budget: <span className="font-semibold dark:text-white">{formatCurrency(budgetAmt)}</span></span>
                          <span className={over ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                            Actual: {formatCurrency(actual)} {over ? '▲ Over' : '✓ OK'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {allocations.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllAdjust(v => !v)}
                className="w-full py-3 border-t border-gray-100 dark:border-gray-800 text-[12px] font-semibold text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {showAllAdjust
                  ? 'Show less'
                  : `Show ${allocations.length - 5} more categories`}
              </button>
            )}
          </div>
        )}

        {analyzed && (
          <div className="px-0 pb-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className={`w-full py-4 rounded-2xl font-bold text-base shadow-lg transition-transform ${isDirty ? 'bg-green-600 text-white shadow-green-600/30 active:scale-[0.98]' : 'bg-gray-300 text-gray-700 cursor-not-allowed shadow-none'}`}>
              Save Budget Plan
            </button>
          </div>
        )}

        {/* This Month Summary */}
        {analyzed && income > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">This Month Summary</p>
            {allocations.filter(a => a.percentage > 0 && actualByGroup[a.categoryId] > 0).map(a => {
              const budgetAmt = Math.round(netIncome * a.percentage / 100);
              const actual = actualByGroup[a.categoryId] || 0;
              const pct = budgetAmt > 0 ? Math.min(130, (actual / budgetAmt) * 100) : 0;
              const over = actual > budgetAmt;
              return (
                <div key={a.categoryId} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium dark:text-white">{a.label}</span>
                    <span className={`text-xs font-bold ${over ? 'text-red-500' : 'text-green-600'}`}>
                      {formatCurrency(actual)} / {formatCurrency(budgetAmt)}
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
              <p className="text-xs text-gray-400 text-left py-2">No expense data for this month yet</p>
            )}
          </div>
        )}
      </div>

      {showRecoTooltip && (() => {
        const goalsEl = document.querySelector('[data-tour="budget-goals"]');
        const r = goalsEl?.getBoundingClientRect();
        const pad = 10;
        const vw = window.innerWidth;
        const tooltipW = Math.min(320, vw - 32);
        const tooltipLeft = Math.max(16, Math.min(vw - tooltipW - 16, vw / 2 - tooltipW / 2));
        const tooltipTop = r ? Math.min(window.innerHeight - 240, r.bottom + 14) : window.innerHeight - 260;
        return (
          <>
            {r ? (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, r.top - pad), background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9980 }} onClick={dismissRecoTooltip} />
                <div style={{ position: 'fixed', top: r.bottom + pad, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9980 }} onClick={dismissRecoTooltip} />
                <div style={{ position: 'fixed', top: r.top - pad, left: 0, width: Math.max(0, r.left - pad), height: r.height + pad * 2, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9980 }} onClick={dismissRecoTooltip} />
                <div style={{ position: 'fixed', top: r.top - pad, left: r.right + pad, right: 0, height: r.height + pad * 2, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9980 }} onClick={dismissRecoTooltip} />
                <div style={{ position: 'fixed', top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2, borderRadius: 16, border: '2px solid rgba(255,255,255,0.5)', zIndex: 9981, pointerEvents: 'none' }} />
              </>
            ) : (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', zIndex: 9980 }} onClick={dismissRecoTooltip} />
            )}
            <div
              style={{ position: 'fixed', zIndex: 9985, left: tooltipLeft, top: tooltipTop, width: tooltipW, pointerEvents: 'all' }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl border border-gray-100 dark:border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-3xl mb-2 text-center">{recoIsHighGoal ? '🎯' : '🌱'}</div>
              <p className="text-sm font-bold dark:text-white mb-1.5 text-center">
                {recoIsHighGoal ? 'High Achiever Detected!' : 'Starting Your Journey?'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4 text-center">
                {recoIsHighGoal
                  ? "You're very disciplined, so we've set higher savings & investment goals for you. You have what it takes — don't hold back on ambitious targets!"
                  : "We recommend starting slowly with a conservative savings goal. Building the habit first matters more than the amount — you can always increase it later!"}
              </p>
              <button
                type="button"
                onClick={dismissRecoTooltip}
                className="w-full py-3 rounded-2xl bg-green-600 text-white font-bold text-sm active:scale-[0.98] transition-all shadow-md shadow-green-600/20"
              >
                Got it!
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
