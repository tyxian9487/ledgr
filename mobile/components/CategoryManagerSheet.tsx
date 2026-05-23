import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';
import type { TKey } from '../i18n/translations';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  ICON_OPTIONS,
  COLOR_OPTIONS,
  CustomCategory,
} from '../types';
import CategoryIcon, { CategoryIconRaw } from './home/CategoryIcon';
import QuickAddCategorySheet from './QuickAddCategorySheet';

type Tab = 'expense' | 'income';

interface AddFormState {
  label: string;
  icon: string;
  color: string;
  type: Tab;
}

const DEFAULT_FORM: AddFormState = { label: '', icon: 'Star', color: '#f97316', type: 'expense' };

// ─── Inner Edit Form ──────────────────────────────────────────────────────────

interface AddFormProps {
  initial: AddFormState;
  onSave: (data: Omit<CustomCategory, 'id'>) => void;
  onCancel: () => void;
}

function EditCategoryForm({ initial, onSave, onCancel }: AddFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<AddFormState>(initial);

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <Text className="text-base font-bold text-gray-900 dark:text-white">
          {t('catmgr.edit')}
        </Text>
        <TouchableOpacity
          onPress={onCancel}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
        >
          <X size={15} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingVertical: 16, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type selector */}
        <View>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('catmgr.type')}</Text>
          <View className="flex-row rounded-xl border border-gray-100 dark:border-gray-800 p-0.5 bg-gray-50 dark:bg-gray-800 gap-0.5">
            {(['expense', 'income'] as Tab[]).map(tabType => (
              <TouchableOpacity
                key={tabType}
                onPress={() => setForm(f => ({ ...f, type: tabType }))}
                className={`flex-1 py-2 rounded-[10px] items-center ${
                  form.type === tabType
                    ? tabType === 'expense' ? 'bg-red-500' : 'bg-green-600'
                    : ''
                }`}
              >
                <Text className={`text-sm font-semibold capitalize ${form.type === tabType ? 'text-white' : 'text-gray-400'}`}>
                  {tabType === 'expense' ? t('common.expense') : t('common.income')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Name */}
        <View>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('catmgr.name')}</Text>
          <TextInput
            placeholder={t('catmgr.name_ph')}
            placeholderTextColor="#d1d5db"
            value={form.label}
            onChangeText={v => setForm(f => ({ ...f, label: v }))}
            maxLength={24}
            className="border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </View>

        {/* Color picker */}
        <View>
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('catmgr.color')}</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {COLOR_OPTIONS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setForm(f => ({ ...f, color: c }))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {form.color === c && <Check size={14} color="#ffffff" strokeWidth={3} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Icon picker with preview */}
        <View>
          <View className="flex-row items-center mb-3">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('catmgr.icon')}</Text>
            <View className="flex-row items-center gap-2 ml-auto">
              <CategoryIcon icon={form.icon} color={form.color} size={16} />
              <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {form.label || t('gform.preview')}
              </Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {ICON_OPTIONS.map(ico => (
              <TouchableOpacity
                key={ico}
                onPress={() => setForm(f => ({ ...f, icon: ico }))}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: form.icon === ico ? form.color + '25' : '#f3f4f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: form.icon === ico ? 2 : 0,
                  borderColor: form.icon === ico ? form.color : 'transparent',
                }}
              >
                <CategoryIconRaw icon={ico} color={form.icon === ico ? form.color : '#9ca3af'} size={18} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View className="px-5 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() =>
            onSave({ label: form.label.trim(), icon: form.icon, color: form.color, type: form.type })
          }
          disabled={!form.label.trim()}
          className={`w-full py-4 rounded-2xl items-center ${form.label.trim() ? 'bg-green-600' : 'bg-green-600 opacity-40'}`}
        >
          <Text className="text-white font-bold text-sm">{t('catmgr.save')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Sheet ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CategoryManagerSheet({ visible, onClose }: Props) {
  const {
    customCategories,
    disabledCategories,
    updateCustomCategory,
    removeCustomCategory,
    toggleCategoryEnabled,
  } = useApp();
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
      <View className="flex-row items-center gap-3 px-5 py-2.5">
        <CategoryIcon icon={cat.icon} color={enabled ? cat.color : '#d1d5db'} size={16} />
        <Text className={`flex-1 text-sm font-medium ${enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
          {(() => {
            const key = (`cat.${cat.id}` as unknown) as TKey;
            const translated = t(key);
            return translated === key ? cat.label : translated;
          })()}
        </Text>
        <Switch
          value={enabled}
          onValueChange={() => toggleCategoryEnabled(cat.id)}
          trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
          thumbColor="#ffffff"
        />
      </View>
    );
  }

  function CustomRow({ cat }: { cat: CustomCategory }) {
    return (
      <View className="flex-row items-center gap-3 px-5 py-2.5">
        <CategoryIcon icon={cat.icon} color={cat.color} size={16} />
        <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{cat.label}</Text>
        <TouchableOpacity
          onPress={() => setEditing(cat)}
          className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-1"
        >
          <Edit2 size={12} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => removeCustomCategory(cat.id)}
          className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center"
        >
          <Trash2 size={12} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Modal
        visible={visible && !editing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-white dark:bg-gray-900">
          {/* Drag pill */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('catmgr.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
            >
              <X size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Category list — expense section then income section */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* ── Expenses ── */}
            <Text className="text-[10px] font-bold text-red-400 dark:text-red-500 uppercase tracking-wider px-5 pt-3 pb-2">
              {t('common.expense')}
            </Text>
            {EXPENSE_CATEGORIES.map(cat => <BuiltinRow key={cat.id} cat={cat} />)}
            {expenseCustoms.length > 0 && (
              <>
                <Text className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-5 pt-4 pb-2">
                  {t('catmgr.my_cats')}
                </Text>
                {expenseCustoms.map(cat => <CustomRow key={cat.id} cat={cat} />)}
              </>
            )}

            {/* Divider */}
            <View className="mx-5 my-3 border-t border-gray-100 dark:border-gray-800" />

            {/* ── Income ── */}
            <Text className="text-[10px] font-bold text-green-500 dark:text-green-600 uppercase tracking-wider px-5 pb-2">
              {t('common.income')}
            </Text>
            {INCOME_CATEGORIES.map(cat => <BuiltinRow key={cat.id} cat={cat} />)}
            {incomeCustoms.length > 0 && (
              <>
                <Text className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-5 pt-4 pb-2">
                  {t('catmgr.my_cats')}
                </Text>
                {incomeCustoms.map(cat => <CustomRow key={cat.id} cat={cat} />)}
              </>
            )}
          </ScrollView>

          {/* Add button */}
          <View className="px-5 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
            <TouchableOpacity
              onPress={() => setAdding(true)}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-green-300 dark:border-green-800 flex-row items-center justify-center gap-2"
            >
              <Plus size={16} color="#16a34a" />
              <Text className="text-sm font-semibold text-green-600 dark:text-green-400">{t('catmgr.add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add category — same QuickAddCategorySheet as in the add-transaction flow */}
      <QuickAddCategorySheet
        visible={adding}
        defaultType="expense"
        onSave={() => setAdding(false)}
        onClose={() => setAdding(false)}
      />

      {/* Edit category — separate modal on top */}
      <Modal
        visible={!!editing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditing(null)}
      >
        <View className="flex-1 bg-white dark:bg-gray-900">
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </View>
          {editing && (
            <EditCategoryForm
              initial={{ label: editing.label, icon: editing.icon, color: editing.color, type: editing.type }}
              onSave={handleSaveEdit}
              onCancel={() => setEditing(null)}
            />
          )}
        </View>
      </Modal>
    </>
  );
}
