import { useState } from 'react';
import { X, ChevronDown, RefreshCw, Calendar, ImageIcon, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { TransactionType, AutoDebitPeriod, CustomCategory } from '../../types';
import { playCoinSound } from '../../utils/sounds';
import { QuickAddCategorySheet } from '../CategoryManagerSheet';

interface Props {
  onClose: () => void;
  transactionId?: string;
  prefill?: {
    type?: TransactionType;
    amount?: number;
    category?: string;
    description?: string;
    receiptImage?: string;
    date?: string;
    isAutoDebit?: boolean;
    autoDebitPeriod?: AutoDebitPeriod;
    linkedGoalId?: string;
  };
}

const DESCRIPTION_SUGGESTIONS: Record<string, string[]> = {
  food:          ['Breakfast', 'Lunch', 'Dinner', 'Coffee', 'Brunch', 'Snack', 'Takeaway', 'Groceries', 'Meal prep'],
  transport:     ['Fuel', 'Bus', 'Train', 'Subway', 'Taxi', 'Rideshare', 'Parking', 'Toll', 'Airplane', 'Ferry'],
  shopping:      ['Clothing', 'Electronics', 'Home goods', 'Online order', 'Department store', 'Gift purchase'],
  entertainment: ['Movie', 'Concert', 'Sports event', 'Gaming', 'Streaming', 'Books', 'Museum', 'Night out'],
  health:        ['Gym', 'Doctor visit', 'Pharmacy', 'Dentist', 'Vitamins', 'Therapy', 'Optician', 'Lab test'],
  housing:       ['Rent', 'Mortgage', 'Repairs', 'Furniture', 'Cleaning', 'HOA fee', 'Renovation'],
  utilities:     ['Electricity', 'Water', 'Gas', 'Internet', 'Phone bill', 'Trash', 'Cable'],
  education:     ['Tuition', 'Course', 'Books', 'Stationery', 'Workshop', 'Online class', 'Exam fee'],
  travel:        ['Flight', 'Hotel', 'Hostel', 'Car rental', 'Visa fee', 'Travel insurance', 'Activities'],
  personal:      ['Haircut', 'Salon', 'Skincare', 'Spa', 'Gym wear', 'Personal care', 'Grooming'],
  subscriptions: ['Netflix', 'Spotify', 'Software', 'Cloud storage', 'Magazine', 'App subscription'],
  insurance:     ['Health insurance', 'Car insurance', 'Life insurance', 'Home insurance', 'Travel insurance'],
  savings:       ['Emergency fund', 'Retirement', 'Holiday fund', 'Education fund', 'House deposit'],
  investment:    ['Stocks', 'ETF', 'Crypto', 'Bonds', 'Real estate', 'Index fund'],
  others:        ['Miscellaneous', 'Gift', 'Charity', 'Fees', 'Other expense'],
  salary:        ['Monthly salary', 'Base pay', 'Paycheck', 'Wages'],
  freelance:     ['Design project', 'Consulting', 'Writing', 'Development', 'Photography', 'Contract work'],
  business:      ['Revenue', 'Sales', 'Invoice payment', 'Client payment', 'Product sale'],
  gift:          ['Birthday gift', 'Holiday gift', 'Cash gift', 'Gift card'],
  other_income:  ['Bonus', 'Refund', 'Cashback', 'Side hustle', 'Rental income', 'Dividend'],
};


function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ManualEntryModal({ onClose, transactionId, prefill }: Props) {
  const { addTransaction, updateTransaction, getCurrencySymbol, expenseCategories, incomeCategories, budget, updateCustomGoal } = useApp();
  const { t } = useTranslation();

  const PERIODS: { value: AutoDebitPeriod; label: string }[] = [
    { value: 'daily',    label: t('period.daily') },
    { value: 'weekly',   label: t('period.weekly') },
    { value: 'biweekly', label: t('period.biweekly') },
    { value: 'monthly',  label: t('period.monthly') },
    { value: 'yearly',   label: t('period.yearly') },
  ];

  const [showAddTxHint, setShowAddTxHint] = useState(() => !localStorage.getItem('ledgr_addtx_hint_seen'));

  const [type, setType] = useState<TransactionType>(prefill?.type || 'expense');
  const [amount, setAmount] = useState(prefill?.amount ? String(prefill.amount) : '');
  const [date, setDate] = useState(prefill?.date || todayString());
  const [category, setCategory] = useState(prefill?.category || '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [isAutoDebit, setIsAutoDebit] = useState(prefill?.isAutoDebit || false);
  const [period, setPeriod] = useState<AutoDebitPeriod>(prefill?.autoDebitPeriod || 'monthly');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(false);
  const [linkedGoalId, setLinkedGoalId] = useState(prefill?.linkedGoalId ?? '');

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectedCategory = categories.find(c => c.id === category);

  const isSavings = type === 'expense' && category === 'savings';
  const saveOptions: Array<{ id: string; name: string }> = [];
  if (budget.savingsGoal?.enabled) saveOptions.push({ id: '__monthly__', name: t('tx.monthly_savings_goal') });
  (budget.customGoals ?? []).forEach(g => saveOptions.push({ id: g.id, name: g.name }));
  const savingsBlocked = isSavings && saveOptions.length > 0 && !linkedGoalId;

  function handleSubmit() {
    if (!amount || !category || savingsBlocked) return;
    const data = {
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date + 'T12:00:00').toISOString(),
      isAutoDebit,
      autoDebitPeriod: isAutoDebit ? period : undefined,
      receiptImage: prefill?.receiptImage,
      linkedGoalId: (category === 'savings' && linkedGoalId) ? linkedGoalId : undefined,
    };
    if (transactionId) {
      updateTransaction(transactionId, data);
    } else {
      addTransaction(data);
      playCoinSound();
      if (category === 'savings' && linkedGoalId && linkedGoalId !== '__monthly__') {
        const g = (budget.customGoals ?? []).find(g => g.id === linkedGoalId);
        if (g) updateCustomGoal(linkedGoalId, { savedAmount: g.savedAmount + parseFloat(amount) });
      }
    }
    onClose();
  }

  function handleNewCategoryCreated(cat: CustomCategory) {
    setShowAddCategory(false);
    setCategory(cat.id);
    setShowCategoryDropdown(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Sheet */}
        <div
          className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
          style={{ maxHeight: '92vh' }}
        >
          {/* Non-scrolling header */}
          <div className="flex-shrink-0">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-lg font-bold dark:text-white">{transactionId ? t('tx.edit') : t('tx.new')}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Scrollable form body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-4 pb-2" style={{ overscrollBehavior: 'contain' }}>

            {/* First-time hint */}
            {showAddTxHint && (
              <div className="mt-3 mb-1 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 rounded-2xl p-3 flex gap-3 items-start">
                <span className="text-lg flex-shrink-0">💡</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-green-800 dark:text-green-300 mb-0.5">{t('tx.quick_tip')}</p>
                  <p className="text-[11px] text-green-700 dark:text-green-400 leading-relaxed">
                    {t('tx.tip_body')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddTxHint(false); localStorage.setItem('ledgr_addtx_hint_seen', '1'); }}
                  className="text-green-500 flex-shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>
            )}

            {/* Receipt thumbnail (from capture) */}
            {prefill?.receiptImage && (
              <button
                onClick={() => setViewReceipt(true)}
                className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-3"
              >
                <img src={prefill.receiptImage} alt="Receipt" className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium dark:text-white">{t('tx.receipt')}</p>
                  <p className="text-xs text-gray-400">{t('tx.tap_view')}</p>
                </div>
                <ImageIcon size={16} className="text-gray-300 ml-auto flex-shrink-0" />
              </button>
            )}

            {/* Type selector */}
            <div className="flex rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-1 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => { setType('expense'); setCategory(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  type === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t('common.expense')}
              </button>
              <button
                onClick={() => { setType('income'); setCategory(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  type === 'income' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t('common.income')}
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">{t('common.amount')}</label>
              <div className="flex items-center border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 focus-within:border-green-500 transition-colors bg-gray-50 dark:bg-gray-800">
                <span className="text-gray-400 font-semibold mr-2">{getCurrencySymbol()}</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 bg-transparent text-xl font-bold outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  inputMode="decimal"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">{t('common.date')}</label>
              <div className="flex items-center border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 focus-within:border-green-500 transition-colors bg-gray-50 dark:bg-gray-800 gap-3">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium outline-none dark:text-white"
                  style={{ colorScheme: 'auto' }}
                />
              </div>
            </div>

            {/* Category */}
            <div className="relative">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">{t('tx.category_label')}</label>
              <button
                type="button"
                onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowPeriodDropdown(false); }}
                className="w-full flex items-center justify-between border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                {selectedCategory ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedCategory.color }} />
                    <span className="text-sm font-medium dark:text-white">{(() => { const k = 'cat.' + selectedCategory.id; const tr = t(k as any); return tr !== k ? tr : selectedCategory.label; })()}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">{t('tx.select_category')}</span>
                )}
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 max-h-52 overflow-y-auto scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setCategory(cat.id); setShowCategoryDropdown(false); if (cat.id !== 'savings') setLinkedGoalId(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="text-sm dark:text-white">{(() => { const k = 'cat.' + cat.id; const tr = t(k as any); return tr !== k ? tr : cat.label; })()}</span>
                      {category === cat.id && <span className="ml-auto text-green-600 text-sm">✓</span>}
                    </button>
                  ))}
                  {/* Add new category */}
                  <button
                    onClick={() => { setShowCategoryDropdown(false); setShowAddCategory(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <Plus size={11} className="text-green-600" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{t('tx.add_category')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">
                {t('common.description')} <span className="text-gray-300">({t('common.optional')})</span>
              </label>
              <textarea
                placeholder={t('tx.add_note')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              {/* Category-based quick labels */}
              {category && DESCRIPTION_SUGGESTIONS[category] && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {DESCRIPTION_SUGGESTIONS[category].map(label => (
                    <button key={label} type="button"
                      onClick={() => setDescription(label)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                        description === label
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-400 hover:text-green-600'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Savings goal selector — always shown when savings category is selected */}
            {isSavings && (
              <div>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1 text-green-700 dark:text-green-400">
                  <span>🐖</span> {t('tx.save_to')} <span className="text-red-400 ml-0.5">*</span>
                </label>
                {saveOptions.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 px-4 py-3 text-xs text-gray-400 text-center">
                    {t('tx.no_goals')}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {saveOptions.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLinkedGoalId(opt.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors flex items-center gap-2 ${
                          linkedGoalId === opt.id
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-green-300'
                        }`}
                      >
                        <span className="flex-1">{opt.name}</span>
                        {linkedGoalId === opt.id && <span className="text-green-500 text-base">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auto debit toggle */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="text-green-600" />
                  <div>
                    <p className="text-sm font-medium dark:text-white">{t('tx.auto_debit')}</p>
                    <p className="text-[11px] text-gray-400">{t('tx.repeat')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAutoDebit(!isAutoDebit)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${isAutoDebit ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${isAutoDebit ? 'left-[26px]' : 'left-0.5'}`} />
                </button>
              </div>

              {isAutoDebit && (
                <div className="mt-3 relative">
                  <button
                    type="button"
                    onClick={() => { setShowPeriodDropdown(!showPeriodDropdown); setShowCategoryDropdown(false); }}
                    className="w-full flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-900"
                  >
                    <span className="text-sm dark:text-white">{PERIODS.find(p => p.value === period)?.label}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>
                  {showPeriodDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-20">
                      {PERIODS.map(p => (
                        <button
                          key={p.value}
                          onClick={() => { setPeriod(p.value); setShowPeriodDropdown(false); }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
                        >
                          {p.label}
                          {period === p.value && <span className="float-right text-green-600">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-1" />
          </div>

          {/* Non-scrolling confirm button */}
          <div className="flex-shrink-0 px-5 pt-3 pb-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!amount || !category || savingsBlocked}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 shadow-lg shadow-green-600/30"
            >
              {!amount || !category ? t('tx.fill') : savingsBlocked ? t('tx.select_goal_first') : t('tx.confirm')}
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen receipt viewer */}
      {viewReceipt && prefill?.receiptImage && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewReceipt(false)}
        >
          <img src={prefill.receiptImage} alt="Receipt" className="max-w-full max-h-full object-contain rounded-2xl" />
          <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <X size={20} className="text-white" />
          </button>
        </div>
      )}

      {/* Quick add category sheet */}
      {showAddCategory && (
        <QuickAddCategorySheet
          defaultType={type}
          onSave={handleNewCategoryCreated}
          onCancel={() => setShowAddCategory(false)}
        />
      )}
    </>
  );
}
