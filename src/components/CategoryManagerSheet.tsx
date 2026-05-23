import { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, ICON_OPTIONS, COLOR_OPTIONS, CustomCategory } from '../types';
import CategoryIcon, { CategoryIconRaw } from './home/CategoryIcon';

type Tab = 'expense' | 'income';

interface AddFormState {
  label: string;
  icon: string;
  color: string;
  type: Tab;
}

const DEFAULT_FORM: AddFormState = { label: '', icon: 'Star', color: '#f97316', type: 'expense' };

function AddCategoryForm({
  initial,
  defaultType,
  onSave,
  onCancel,
}: {
  initial?: AddFormState;
  defaultType: Tab;
  onSave: (data: Omit<CustomCategory, 'id'>) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<AddFormState>(initial ?? { ...DEFAULT_FORM, type: defaultType });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-bold dark:text-white">{initial ? t('catmgr.edit') : t('catmgr.new')}</h3>
        <button type="button" onClick={onCancel} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <X size={15} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        {/* Type — always shown so user can set/change the category type */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">{t('catmgr.type')}</label>
          <div className="flex rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-0.5 bg-gray-50 dark:bg-gray-800 gap-0.5">
            {(['expense', 'income'] as Tab[]).map(tabType => (
              <button key={tabType} type="button" onClick={() => setForm(f => ({ ...f, type: tabType }))}
                className={`flex-1 py-2 rounded-[10px] text-sm font-semibold capitalize transition-all ${form.type === tabType ? (tabType === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'bg-green-600 text-white shadow-sm') : 'text-gray-400'}`}>
                {tabType === 'expense' ? t('common.expense') : t('common.income')}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">{t('catmgr.name')}</label>
          <input
            type="text"
            placeholder={t('catmgr.name_ph')}
            value={form.label}
            maxLength={24}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:border-green-500 transition-colors placeholder:text-gray-300"
          />
        </div>

        {/* Color */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">{t('catmgr.color')}</label>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_OPTIONS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{ background: c }}>
                {form.color === c && <Check size={14} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview + Icon grid */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('catmgr.icon')}</label>
            <div className="flex items-center gap-2 ml-auto">
              <CategoryIcon icon={form.icon} color={form.color} size={16} />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{form.label || t('gform.preview')}</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {ICON_OPTIONS.map(ico => (
              <button key={ico} type="button" onClick={() => setForm(f => ({ ...f, icon: ico }))}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${form.icon === ico ? 'ring-2 ring-offset-1 ring-green-500' : 'bg-gray-100 dark:bg-gray-800'}`}
                style={form.icon === ico ? { background: form.color + '25' } : {}}>
                <CategoryIconRaw icon={ico} color={form.icon === ico ? form.color : '#9ca3af'} size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex-shrink-0 px-5 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          disabled={!form.label.trim()}
          onClick={() => onSave({ label: form.label.trim(), icon: form.icon, color: form.color, type: form.type })}
          className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-600/30 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('catmgr.save')}
        </button>
      </div>
    </div>
  );
}

// Lightweight inline form used inside ManualEntryModal
export function QuickAddCategorySheet({
  defaultType,
  onSave,
  onCancel,
}: {
  defaultType: 'expense' | 'income';
  onSave: (cat: CustomCategory) => void;
  onCancel: () => void;
}) {
  const { addCustomCategory } = useApp();

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60" onClick={onCancel}>
      <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col" style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <AddCategoryForm
          defaultType={defaultType}
          onSave={d => { const c = addCustomCategory(d); onSave(c); }}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export default function CategoryManagerSheet({ onClose }: Props) {
  const { customCategories, disabledCategories, updateCustomCategory, removeCustomCategory, toggleCategoryEnabled } = useApp();
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CustomCategory | null>(null);

  const expenseCustoms = customCategories.filter(c => c.type === 'expense');
  const incomeCustoms = customCategories.filter(c => c.type === 'income');

  function handleSaveEdit(data: Omit<CustomCategory, 'id'>) {
    if (!editing) return;
    updateCustomCategory(editing.id, data);
    setEditing(null);
  }

  function BuiltinRow({ cat }: { cat: typeof EXPENSE_CATEGORIES[0] }) {
    const enabled = !disabledCategories.includes(cat.id);
    return (
      <div className="flex items-center gap-3 px-5 py-2.5">
        <CategoryIcon icon={cat.icon} color={enabled ? cat.color : '#d1d5db'} size={16} />
        <span className={`flex-1 text-sm font-medium ${enabled ? 'dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{cat.label}</span>
        <button type="button" onClick={() => toggleCategoryEnabled(cat.id)}
          className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
          <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
    );
  }

  function CustomRow({ cat }: { cat: CustomCategory }) {
    return (
      <div className="flex items-center gap-3 px-5 py-2.5">
        <CategoryIcon icon={cat.icon} color={cat.color} size={16} />
        <span className="flex-1 text-sm font-medium dark:text-white">{cat.label}</span>
        <button type="button" onClick={() => setEditing(cat)}
          className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-1">
          <Edit2 size={12} className="text-blue-500" />
        </button>
        <button type="button" onClick={() => removeCustomCategory(cat.id)}
          className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <Trash2 size={12} className="text-red-500" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50" onClick={onClose}>
        <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl flex flex-col animate-slide-up" style={{ maxHeight: '88vh' }}
          onClick={e => e.stopPropagation()}>

          {/* Drag pill */}
          <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
            <h2 className="text-lg font-bold dark:text-white">{t('catmgr.title')}</h2>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Scrollable list — expense section then income section */}
          <div className="flex-1 min-h-0 overflow-y-auto">

            {/* ── Expenses ── */}
            <p className="text-[10px] font-bold text-red-400 dark:text-red-500 uppercase tracking-wider px-5 pt-3 pb-2">
              {t('common.expense')}
            </p>
            {EXPENSE_CATEGORIES.map(cat => <BuiltinRow key={cat.id} cat={cat} />)}
            {expenseCustoms.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-5 pt-3 pb-2">
                  {t('catmgr.my_cats')}
                </p>
                {expenseCustoms.map(cat => <CustomRow key={cat.id} cat={cat} />)}
              </>
            )}

            {/* Divider */}
            <div className="mx-5 my-3 border-t border-gray-100 dark:border-gray-800" />

            {/* ── Income ── */}
            <p className="text-[10px] font-bold text-green-500 dark:text-green-600 uppercase tracking-wider px-5 pb-2">
              {t('common.income')}
            </p>
            {INCOME_CATEGORIES.map(cat => <BuiltinRow key={cat.id} cat={cat} />)}
            {incomeCustoms.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-5 pt-3 pb-2">
                  {t('catmgr.my_cats')}
                </p>
                {incomeCustoms.map(cat => <CustomRow key={cat.id} cat={cat} />)}
              </>
            )}

            <div className="h-4" />
          </div>

          {/* Add button */}
          <div className="flex-shrink-0 px-5 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={() => setAdding(true)}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-green-300 dark:border-green-800 flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm active:scale-[0.98] transition-transform">
              <Plus size={16} />
              {t('catmgr.add')}
            </button>
          </div>
        </div>
      </div>

      {/* Add category — same QuickAddCategorySheet as in the add-transaction flow */}
      {adding && (
        <QuickAddCategorySheet
          defaultType="expense"
          onSave={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Edit category overlay */}
      {editing && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50" onClick={() => setEditing(null)}>
          <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl flex flex-col animate-slide-up" style={{ maxHeight: '92vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <AddCategoryForm
              initial={{ label: editing.label, icon: editing.icon, color: editing.color, type: editing.type }}
              defaultType={editing.type}
              onSave={handleSaveEdit}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
