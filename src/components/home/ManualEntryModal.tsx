import { useState } from 'react';
import { X, ChevronDown, RefreshCw, Calendar, ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TransactionType, AutoDebitPeriod } from '../../types';

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
  };
}

const PERIODS: { value: AutoDebitPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ManualEntryModal({ onClose, transactionId, prefill }: Props) {
  const { addTransaction, updateTransaction, getCurrencySymbol } = useApp();

  const [type, setType] = useState<TransactionType>(prefill?.type || 'expense');
  const [amount, setAmount] = useState(prefill?.amount ? String(prefill.amount) : '');
  const [date, setDate] = useState(prefill?.date || todayString());
  const [category, setCategory] = useState(prefill?.category || '');
  const [description, setDescription] = useState(prefill?.description || '');
  const [isAutoDebit, setIsAutoDebit] = useState(false);
  const [period, setPeriod] = useState<AutoDebitPeriod>('monthly');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const selectedCategory = categories.find(c => c.id === category);

  function handleSubmit() {
    if (!amount || !category) return;
    const data = {
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date + 'T12:00:00').toISOString(),
      isAutoDebit,
      autoDebitPeriod: isAutoDebit ? period : undefined,
      receiptImage: prefill?.receiptImage,
    };
    if (transactionId) {
      updateTransaction(transactionId, data);
    } else {
      addTransaction(data);
    }
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Sheet — flex column so header+footer never scroll away */}
        <div
          className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
          style={{ maxHeight: '92vh' }}
        >
          {/* ── Non-scrolling header ── */}
          <div className="flex-shrink-0">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-lg font-bold dark:text-white">{transactionId ? 'Edit Record' : 'New Record'}</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* ── Scrollable form body — min-h-0 is required so flex-1 can shrink below content size ── */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-4 pb-2" style={{ overscrollBehavior: 'contain' }}>

            {/* Receipt thumbnail (from capture) */}
            {prefill?.receiptImage && (
              <button
                onClick={() => setViewReceipt(true)}
                className="w-full flex items-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-3"
              >
                <img src={prefill.receiptImage} alt="Receipt" className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium dark:text-white">Receipt attached</p>
                  <p className="text-xs text-gray-400">Tap to view full image</p>
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
                Expense
              </button>
              <button
                onClick={() => { setType('income'); setCategory(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  type === 'income' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Income
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">Amount</label>
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
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">Date</label>
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
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">Category</label>
              <button
                type="button"
                onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowPeriodDropdown(false); }}
                className="w-full flex items-center justify-between border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                {selectedCategory ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: selectedCategory.color }} />
                    <span className="text-sm font-medium dark:text-white">{selectedCategory.label}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Select category</span>
                )}
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 max-h-48 overflow-y-auto scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setCategory(cat.id); setShowCategoryDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="text-sm dark:text-white">{cat.label}</span>
                      {category === cat.id && <span className="ml-auto text-green-600 text-sm">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">
                Description <span className="text-gray-300">(optional)</span>
              </label>
              <textarea
                placeholder="Add a note..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </div>

            {/* Auto debit toggle */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw size={16} className="text-green-600" />
                  <div>
                    <p className="text-sm font-medium dark:text-white">Auto Debit</p>
                    <p className="text-[11px] text-gray-400">Repeat this transaction</p>
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

            {/* Spacer so last field isn't right at the confirm button border */}
            <div className="h-1" />
          </div>

          {/* ── Non-scrolling confirm button ── */}
          <div className="flex-shrink-0 px-5 pt-3 pb-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!amount || !category}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 shadow-lg shadow-green-600/30"
            >
              {!amount || !category ? 'Fill in Amount & Category' : 'Confirm Transaction'}
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
    </>
  );
}
