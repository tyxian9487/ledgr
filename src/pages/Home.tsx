import { useState } from 'react';
import { Plus, Target, TrendingUp, TrendingDown, Search, SlidersHorizontal, X, CalendarDays, LayoutList, CalendarRange } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GreenCard from '../components/home/GreenCard';
import Categories from '../components/home/Categories';
import ManualEntryModal from '../components/home/ManualEntryModal';
import GoalTrackerCard from '../components/home/GoalTrackerCard';
import { useApp } from '../context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Transaction } from '../types';

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

type TxView = 'category' | 'date';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Home() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showEntry, setShowEntry] = useState(false);
  const { budget, getMonthExpenses, userProfile, transactions, formatCurrency } = useApp();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [txView, setTxView] = useState<TxView>('category');
  const [showCalendar, setShowCalendar] = useState(false);

  function handlePrev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function handleNext() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const hasBudget = budget.expectedIncome > 0 && budget.allocations.length > 0;
  const totalExpenses = getMonthExpenses(now.getFullYear(), now.getMonth());
  const totalBudget = hasBudget
    ? budget.allocations.reduce((s, a) => s + (budget.expectedIncome * a.percentage / 100), 0)
    : 0;
  const budgetUsedPct = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
  const isOverBudget = hasBudget && totalExpenses > totalBudget;

  // Search across ALL transactions
  const q = searchQuery.trim().toLowerCase();
  const searchResults: Transaction[] = q
    ? transactions.filter(t => {
        const catLabel = ALL_CATEGORIES.find(c => c.id === t.category)?.label.toLowerCase() || '';
        return (
          t.description.toLowerCase().includes(q) ||
          catLabel.includes(q) ||
          String(t.amount).includes(q)
        );
      })
    : [];

  // Filter function passed to Categories
  const activeFilterCount =
    (filterType !== 'all' ? 1 : 0) +
    (filterMin ? 1 : 0) +
    (filterMax ? 1 : 0) +
    (filterCategory ? 1 : 0);

  const filterFn: ((t: Transaction) => boolean) | undefined = activeFilterCount > 0
    ? (t: Transaction) => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterMin && t.amount < parseFloat(filterMin)) return false;
        if (filterMax && t.amount > parseFloat(filterMax)) return false;
        if (filterCategory && t.category !== filterCategory) return false;
        return true;
      }
    : undefined;

  function clearFilters() {
    setFilterType('all');
    setFilterMin('');
    setFilterMax('');
    setFilterCategory('');
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Good {getGreeting()}</p>
          <h1 className="text-xl font-bold dark:text-white">My Finances</h1>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 overflow-hidden flex items-center justify-center active:scale-90 transition-transform"
        >
          {userProfile.avatar
            ? <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
            : <span className="text-green-700 dark:text-green-400 font-bold text-sm">{userProfile.name.charAt(0).toUpperCase()}</span>
          }
        </button>
      </div>

      {/* Green summary card */}
      <GreenCard year={year} month={month} onPrev={handlePrev} onNext={handleNext} onYearChange={setYear} />

      {/* Goal Tracker Card */}
      <GoalTrackerCard year={year} month={month} />

      {/* Action buttons — side by side, same height */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <button
          data-tour="add-transaction"
          type="button"
          onClick={() => setShowEntry(true)}
          className="flex items-center gap-2.5 bg-white dark:bg-gray-900 rounded-2xl px-4 py-3.5 shadow-sm border border-gray-50 dark:border-gray-800 active:scale-[0.98] transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
            <Plus size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 text-left leading-tight">Add Transaction</span>
        </button>

        <button
          data-tour="budget-goals-btn"
          type="button"
          onClick={() => navigate('/budget')}
          className={`flex items-center gap-2.5 rounded-2xl px-4 py-3.5 shadow-sm active:scale-[0.98] transition-all border ${
            !hasBudget
              ? 'bg-white dark:bg-gray-900 border-gray-50 dark:border-gray-800'
              : isOverBudget
              ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40'
              : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/40'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            !hasBudget ? 'bg-gray-100 dark:bg-gray-800'
              : isOverBudget ? 'bg-red-500' : 'bg-green-600'
          }`}>
            <Target size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className={`text-sm font-semibold leading-tight ${
              !hasBudget ? 'text-gray-600 dark:text-gray-300'
                : isOverBudget ? 'text-red-700 dark:text-red-400'
                : 'text-green-700 dark:text-green-400'
            }`}>
              {!hasBudget ? 'Set Budget & Goals' : isOverBudget ? 'Over Budget' : 'On Track'}
            </p>
            {hasBudget && (
              <p className={`text-[11px] font-semibold mt-0.5 ${isOverBudget ? 'text-red-400' : 'text-green-500'}`}>
                {budgetUsedPct.toFixed(0)}% used
              </p>
            )}
          </div>
          {hasBudget && (
            isOverBudget
              ? <TrendingDown size={16} className="text-red-400 flex-shrink-0" />
              : <TrendingUp size={16} className="text-green-500 flex-shrink-0" />
          )}
        </button>
      </div>

      {/* Search & Filter buttons */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => { setShowSearch(s => !s); if (showFilter) setShowFilter(false); }}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
            showSearch
              ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          <Search size={15} />
          Search
          {showSearch && q && (
            <span className="ml-auto text-xs opacity-80">{searchResults.length}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setShowFilter(f => !f); if (showSearch) setShowSearch(false); }}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
            showFilter
              ? 'bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20'
              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filter
          {activeFilterCount > 0 && (
            <span className={`ml-auto w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              showFilter ? 'bg-white text-green-600' : 'bg-green-600 text-white'
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="mx-4 mt-2 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 mb-3">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              placeholder="Description, category, or amount..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none dark:text-white placeholder:text-gray-400"
              autoFocus
            />
            {q && (
              <button type="button" onClick={() => setSearchQuery('')}>
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {!q && (
            <p className="text-xs text-gray-400 text-center">Search across all your transactions</p>
          )}

          {q && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-1">No transactions found</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {searchResults.map(t => {
                const cat = ALL_CATEGORIES.find(c => c.id === t.category);
                return (
                  <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat?.color || '#9ca3af' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium dark:text-white truncate">{t.description || cat?.label}</p>
                      <p className="text-[10px] text-gray-400">{cat?.label} · {formatDate(t.date)}</p>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter panel */}
      {showFilter && (
        <div className="mx-4 mt-2 bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-4">
          {/* Type */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">Type</p>
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map(t => (
                <button key={t} type="button" onClick={() => setFilterType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                    filterType === t ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount range */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">Amount Range</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Min $" value={filterMin} onChange={e => setFilterMin(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm outline-none dark:text-white placeholder:text-gray-400 border border-gray-100 dark:border-gray-700"
                inputMode="decimal" />
              <input type="number" placeholder="Max $" value={filterMax} onChange={e => setFilterMax(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm outline-none dark:text-white placeholder:text-gray-400 border border-gray-100 dark:border-gray-700"
                inputMode="decimal" />
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2">Category</p>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm outline-none dark:text-white border border-gray-100 dark:border-gray-700">
              <option value="">All Categories</option>
              {ALL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters}
              className="w-full py-2.5 text-xs text-red-500 dark:text-red-400 font-semibold rounded-xl bg-red-50 dark:bg-red-900/20">
              Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Categories / Transactions header */}
      <div className="mx-4 mt-5 mb-3 flex items-center gap-2">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex-1">
          {activeFilterCount > 0 ? 'Filtered Results' : (txView === 'category' ? 'Categories' : 'By Date')}
        </h2>
        {activeFilterCount > 0 && (
          <button type="button" onClick={clearFilters} className="text-xs text-green-600 font-semibold mr-1">Clear</button>
        )}
        {/* Calendar icon — only in date view, left of toggle */}
        {txView === 'date' && (
          <button type="button" onClick={() => setShowCalendar(true)}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <CalendarRange size={14} className="text-gray-500 dark:text-gray-400" />
          </button>
        )}
        {/* View toggle */}
        <div data-tour="view-toggle" className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 gap-0.5">
          <button type="button" onClick={() => setTxView('category')}
            className={`w-8 h-7 rounded-[9px] flex items-center justify-center transition-all ${txView === 'category' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>
            <LayoutList size={14} className={txView === 'category' ? 'text-green-600' : 'text-gray-400'} />
          </button>
          <button type="button" onClick={() => setTxView('date')}
            className={`w-8 h-7 rounded-[9px] flex items-center justify-center transition-all ${txView === 'date' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}>
            <CalendarDays size={14} className={txView === 'date' ? 'text-green-600' : 'text-gray-400'} />
          </button>
        </div>
      </div>

      <Categories year={year} month={month} filterFn={filterFn} view={txView}
        showCalendar={showCalendar} onCloseCalendar={() => setShowCalendar(false)} />

      {showEntry && <ManualEntryModal onClose={() => setShowEntry(false)} />}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
