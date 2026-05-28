import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { X, Plus, Trash2, Edit2 } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../context/LanguageContext';
import type { TKey } from '../i18n/translations';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CustomCategory,
} from '../types';
import CategoryIcon from './home/CategoryIcon';
import QuickAddCategorySheet from './QuickAddCategorySheet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CategoryManagerSheet({ visible, onClose }: Props) {
  const {
    customCategories,
    disabledCategories,
    removeCustomCategory,
    toggleCategoryEnabled,
  } = useApp();
  const { t } = useTranslation();
  const { bottom, top } = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';

  const [adding, setAdding] = useState(false);
  const [addDefaultType, setAddDefaultType] = useState<'expense' | 'income'>('expense');
  const [editing, setEditing] = useState<CustomCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<CustomCategory | null>(null);

  function confirmDelete() {
    if (!deletingCat) return;
    removeCustomCategory(deletingCat.id);
    setDeletingCat(null);
  }

  function openAdd(type: 'expense' | 'income') {
    setAddDefaultType(type);
    setAdding(true);
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
          onPress={() => setDeletingCat(cat)}
          className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center"
        >
          <Trash2 size={12} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  }

  function Section({ tab }: { tab: 'expense' | 'income' }) {
    const isExpense = tab === 'expense';
    const builtins = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const customs = customCategories.filter(c => c.type === tab);

    return (
      <View>
        {/* Section header */}
        <View className="flex-row items-center gap-3 px-5 pt-4 pb-1">
          <Text className={`text-[11px] font-black uppercase tracking-widest ${isExpense ? 'text-red-500' : 'text-green-600'}`}>
            {isExpense ? t('common.expense') : t('common.income')}
          </Text>
          <View className={`flex-1 h-px ${isExpense ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`} />
        </View>

        {/* Built-in categories */}
        {builtins.map(cat => <BuiltinRow key={cat.id} cat={cat} />)}

        {/* My custom categories */}
        {customs.length > 0 && (
          <>
            <View className="mx-5 my-2 border-t border-gray-100 dark:border-gray-800" />
            <Text className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-5 pb-1.5">
              {t('catmgr.my_cats')}
            </Text>
            {customs.map(cat => <CustomRow key={cat.id} cat={cat} />)}
          </>
        )}

        {/* Add button for this section */}
        <TouchableOpacity
          onPress={() => openAdd(tab)}
          className="flex-row items-center gap-2 px-5 py-2.5 mt-1"
        >
          <View className={`w-6 h-6 rounded-full items-center justify-center ${isExpense ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
            <Plus size={12} color={isExpense ? '#ef4444' : '#16a34a'} strokeWidth={3} />
          </View>
          <Text className={`text-sm font-semibold ${isExpense ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {t('catmgr.add')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dlgBg     = dark ? '#1f2937' : '#ffffff';
  const dlgBorder = dark ? '#374151' : '#e5e7eb';
  const dlgText   = dark ? '#f9fafb' : '#111827';
  const dlgSub    = dark ? '#9ca3af' : '#6b7280';

  return (
    <>
      {/* ── Main manager sheet ── */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-white dark:bg-gray-900">
          {/* Drag pill */}
          <View className="items-center pb-1" style={{ paddingTop: Math.max(12, top) }}>
            <View className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('catmgr.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
            >
              <X size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Category list — expense then income, no tab switcher */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(24, bottom + 8) }}
          >
            <Section tab="expense" />
            <View className="mx-5 mt-3 border-t border-gray-200 dark:border-gray-700" />
            <Section tab="income" />
          </ScrollView>
        </View>
      </Modal>

      {/* ── Delete confirmation — sibling modal, not nested ── */}
      <Modal
        visible={!!deletingCat}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingCat(null)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{
            width: '86%',
            backgroundColor: dlgBg,
            borderRadius: 14,
            padding: 18,
            borderWidth: 1,
            borderColor: dlgBorder,
          }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: dlgText, marginBottom: 8 }}>
              {t('catmgr.delete_title')}
            </Text>
            <Text style={{ fontSize: 14, color: dlgSub, marginBottom: 14 }}>
              {deletingCat ? `"${deletingCat.label}" — ${t('catmgr.delete_confirm')}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setDeletingCat(null)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
              >
                <Text style={{ color: dlgSub }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
              >
                <Text style={{ color: '#ef4444', fontWeight: '700' }}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add / Edit category sheet ── */}
      <QuickAddCategorySheet
        visible={adding || !!editing}
        defaultType={editing ? editing.type : addDefaultType}
        editMode={editing ?? undefined}
        onSave={() => { setAdding(false); setEditing(null); }}
        onClose={() => { setAdding(false); setEditing(null); }}
      />
    </>
  );
}
