import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon,
  Sun,
  ChevronRight,
  ChevronDown,
  Lock,
  HelpCircle,
  FileText,
  LogOut,
  Trash2,
  Edit3,
  TrendingUp,
  TrendingDown,
  X,
  Tag,
  Globe,
  Star,
  RotateCcw,
  Settings,
  Zap,
} from 'lucide-react-native';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { usePurchases, isUserCancelledError } from '../../context/PurchasesContext';
import { CURRENCIES, LANGUAGES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CustomCategory, COLOR_OPTIONS, ICON_OPTIONS } from '../../types';

// ─── Score Ring (pure RN, no SVG) ────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const { t } = useTranslation();
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  const SIZE = 120;
  const BORDER = 10;
  // We approximate the arc fill via a conic-like trick using two overlaid rounded containers
  // Simple approach: show score text inside a bordered circle whose border color reflects score
  return (
    <View className="items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: BORDER,
          borderColor: '#e5e7eb',
          position: 'absolute',
        }}
      />
      {/* Filled arc approximation: inner colored ring segment via clipping would need SVG.
          Use a simple solid colored ring instead, full circle at reduced opacity + text. */}
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: BORDER,
          borderColor: color,
          position: 'absolute',
          opacity: 0.25 + (score / 100) * 0.75,
        }}
      />
      <View className="items-center">
        <Text className="font-black text-3xl" style={{ color }}>{score}</Text>
        <Text className="text-gray-400 text-[10px] font-semibold uppercase tracking-widest">
          {t('profile.score')}
        </Text>
      </View>
    </View>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────
interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}
function SettingsRow({ icon, label, value, onPress, danger, right }: SettingsRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-gray-50"
      activeOpacity={0.7}
    >
      <View
        className={`w-9 h-9 rounded-2xl items-center justify-center ${
          danger ? 'bg-red-50' : 'bg-gray-100'
        }`}
      >
        <View style={{ opacity: 1 }}>{icon}</View>
      </View>
      <Text
        className={`flex-1 text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-900'}`}
      >
        {label}
      </Text>
      {value ? (
        <Text className="text-xs text-gray-400 mr-1">{value}</Text>
      ) : null}
      {right ?? (!danger ? <ChevronRight size={14} color="#d1d5db" /> : null)}
    </TouchableOpacity>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="bg-gray-50 rounded-2xl overflow-hidden mb-2">
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        className="flex-row items-center px-4 py-3.5"
        activeOpacity={0.7}
      >
        <Text className="flex-1 text-sm font-medium text-gray-900 pr-3">{q}</Text>
        <ChevronDown
          size={16}
          color="#9ca3af"
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {open ? (
        <View className="px-4 pb-4">
          <Text className="text-sm text-gray-500 leading-relaxed">{a}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Legal Sheet Modal ────────────────────────────────────────────────────────
function LegalSheet({
  type,
  onClose,
}: {
  type: 'terms' | 'privacy';
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const sections = type === 'terms'
    ? [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
        title: t(`terms.t${n}` as any),
        body: t(`terms.b${n}` as any),
      }))
    : [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({
        title: t(`privacy.t${n}` as any),
        body: t(`privacy.b${n}` as any),
      }));

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">
            {type === 'terms' ? t('profile.terms') : t('profile.privacy')}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
          >
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-5 py-4">
          <Text className="text-xs text-gray-400 mb-4">{t('legal.last_updated')}</Text>
          {sections.map((s, i) => (
            <View key={i} className="mb-5">
              <Text className="text-sm font-bold text-gray-900 mb-1.5">{s.title}</Text>
              <Text className="text-sm text-gray-600 leading-relaxed">{s.body}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="px-5 pb-6 pt-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={onClose}
            className="w-full py-3.5 rounded-2xl bg-green-600 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold">{t('legal.i_understand')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Category Manager Sheet ───────────────────────────────────────────────────
function CategoryManagerSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const {
    customCategories,
    disabledCategories,
    addCustomCategory,
    updateCustomCategory,
    removeCustomCategory,
    toggleCategoryEnabled,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const [formIcon, setFormIcon] = useState(ICON_OPTIONS[0]);

  const ALL_BUILTIN = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  function openNew() {
    setEditingId(null);
    setFormName('');
    setFormType('expense');
    setFormColor(COLOR_OPTIONS[0]);
    setFormIcon(ICON_OPTIONS[0]);
    setShowForm(true);
  }

  function openEdit(cat: CustomCategory) {
    setEditingId(cat.id);
    setFormName(cat.label);
    setFormType(cat.type);
    setFormColor(cat.color);
    setFormIcon(cat.icon);
    setShowForm(true);
  }

  function handleSave() {
    if (!formName.trim()) return;
    if (editingId) {
      updateCustomCategory(editingId, { label: formName.trim(), type: formType, color: formColor, icon: formIcon });
    } else {
      addCustomCategory({ label: formName.trim(), type: formType, color: formColor, icon: formIcon });
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    Alert.alert('Delete Category', 'Remove this custom category?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeCustomCategory(id) },
    ]);
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">{t('catmgr.title')}</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
          >
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {showForm ? (
          <ScrollView className="flex-1 px-5 py-4">
            <Text className="text-base font-bold text-gray-900 mb-4">
              {editingId ? t('catmgr.edit') : t('catmgr.new')}
            </Text>

            {/* Type toggle */}
            <Text className="text-xs font-semibold text-gray-500 mb-2">{t('catmgr.type')}</Text>
            <View className="flex-row gap-3 mb-4">
              {(['expense', 'income'] as const).map(tp => (
                <TouchableOpacity
                  key={tp}
                  onPress={() => setFormType(tp)}
                  className={`flex-1 py-2.5 rounded-xl items-center border-2 ${
                    formType === tp ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <Text className={`text-sm font-semibold ${formType === tp ? 'text-green-700' : 'text-gray-500'}`}>
                    {tp.charAt(0).toUpperCase() + tp.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Name */}
            <Text className="text-xs font-semibold text-gray-500 mb-1.5">{t('catmgr.name')}</Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              placeholder={t('catmgr.name_ph')}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4 focus:border-green-500"
            />

            {/* Color */}
            <Text className="text-xs font-semibold text-gray-500 mb-2">{t('catmgr.color')}</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {COLOR_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setFormColor(c)}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c,
                    borderWidth: formColor === c ? 3 : 0, borderColor: '#111' }}
                />
              ))}
            </View>

            {/* Icon */}
            <Text className="text-xs font-semibold text-gray-500 mb-2">{t('catmgr.icon')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              <View className="flex-row gap-2">
                {ICON_OPTIONS.map(ic => (
                  <TouchableOpacity
                    key={ic}
                    onPress={() => setFormIcon(ic)}
                    className={`w-10 h-10 rounded-xl items-center justify-center border-2 ${
                      formIcon === ic ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <Text className="text-xs text-gray-600">{ic.slice(0, 2)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowForm(false)}
                className="flex-1 py-3 rounded-2xl bg-gray-100 items-center"
              >
                <Text className="font-semibold text-gray-600">{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 py-3 rounded-2xl bg-green-600 items-center"
                activeOpacity={0.8}
              >
                <Text className="font-bold text-white">{t('catmgr.save')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="flex-1">
            {/* Built-in categories */}
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-5 pt-4 pb-2">
              {t('catmgr.builtin')}
            </Text>
            {ALL_BUILTIN.map(cat => {
              const disabled = disabledCategories.includes(cat.id);
              return (
                <View key={cat.id} className="flex-row items-center px-5 py-3 border-b border-gray-50">
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  </View>
                  <Text className={`flex-1 text-sm font-medium ${disabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {cat.label}
                  </Text>
                  <Switch
                    value={!disabled}
                    onValueChange={() => toggleCategoryEnabled(cat.id)}
                    trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
                    thumbColor="#fff"
                  />
                </View>
              );
            })}

            {/* Custom categories */}
            {customCategories.length > 0 ? (
              <>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-5 pt-5 pb-2">
                  {t('catmgr.my_cats')}
                </Text>
                {customCategories.map(cat => (
                  <View key={cat.id} className="flex-row items-center px-5 py-3 border-b border-gray-50">
                    <View
                      className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-gray-900">{cat.label}</Text>
                    <TouchableOpacity onPress={() => openEdit(cat)} className="p-2 mr-1">
                      <Edit3 size={15} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(cat.id)} className="p-2">
                      <Trash2 size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : null}

            {/* Add button */}
            <TouchableOpacity
              onPress={openNew}
              className="mx-5 mt-4 mb-8 py-3.5 rounded-2xl bg-green-600 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">{t('catmgr.add')}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Subscription Card ────────────────────────────────────────────────────────
function SubscriptionCard() {
  const { isPro, isLoading, presentPaywallIfNeeded, presentCustomerCenter, restorePurchases } =
    usePurchases();
  const [working, setWorking] = useState(false);

  async function handleUpgrade() {
    setWorking(true);
    try {
      const result = await presentPaywallIfNeeded();
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        Alert.alert('Welcome to Kachingo Pro!', 'All premium features are now unlocked.');
      }
    } catch (e) {
      if (!isUserCancelledError(e)) {
        Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setWorking(false);
    }
  }

  async function handleManage() {
    try {
      await presentCustomerCenter();
    } catch (e) {
      console.warn('[RevenueCat] Customer Center error:', e);
    }
  }

  async function handleRestore() {
    setWorking(true);
    try {
      const hasPro = await restorePurchases();
      Alert.alert(
        hasPro ? 'Restored!' : 'Nothing to restore',
        hasPro
          ? 'Kachingo Pro has been restored.'
          : 'No previous purchases were found for this account.',
      );
    } catch (e) {
      Alert.alert('Restore failed', 'Something went wrong. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  if (isLoading) {
    return (
      <View className="mx-4 mb-4 bg-white rounded-2xl p-5 items-center shadow-sm border border-gray-50">
        <ActivityIndicator size="small" color="#16a34a" />
      </View>
    );
  }

  if (isPro) {
    return (
      <View className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm">
        {/* Pro banner */}
        <View
          className="px-5 py-4 items-center"
          style={{ backgroundColor: '#052e16' }}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <Star size={16} color="#4ade80" fill="#4ade80" />
            <Text className="text-green-400 font-black text-sm uppercase tracking-widest">
              Kachingo Pro
            </Text>
          </View>
          <Text className="text-white/60 text-xs text-center">
            You have access to all premium features
          </Text>
        </View>

        {/* Actions */}
        <View className="bg-white border-t border-gray-50">
          <TouchableOpacity
            onPress={handleManage}
            className="flex-row items-center gap-3 px-5 py-3.5 border-b border-gray-50"
            activeOpacity={0.7}
          >
            <View className="w-8 h-8 rounded-xl bg-green-50 items-center justify-center">
              <Settings size={15} color="#16a34a" />
            </View>
            <Text className="flex-1 text-sm font-medium text-gray-900">Manage Subscription</Text>
            <ChevronRight size={14} color="#d1d5db" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRestore}
            disabled={working}
            className="flex-row items-center gap-3 px-5 py-3.5"
            activeOpacity={0.7}
          >
            <View className="w-8 h-8 rounded-xl bg-gray-100 items-center justify-center">
              <RotateCcw size={15} color="#6b7280" />
            </View>
            <Text className="flex-1 text-sm font-medium text-gray-900">Restore Purchases</Text>
            {working ? <ActivityIndicator size="small" color="#6b7280" /> : <ChevronRight size={14} color="#d1d5db" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm">
      {/* Upgrade banner */}
      <View className="bg-gradient-to-b px-5 py-5 items-center" style={{ backgroundColor: '#14532d' }}>
        <View className="w-12 h-12 rounded-2xl bg-green-400/20 items-center justify-center mb-3">
          <Zap size={24} color="#4ade80" />
        </View>
        <Text className="text-white font-black text-base mb-1">Unlock Kachingo Pro</Text>
        <Text className="text-white/60 text-xs text-center leading-relaxed mb-4">
          Advanced analytics, unlimited goals, AI receipt scanning & more
        </Text>
        <TouchableOpacity
          onPress={handleUpgrade}
          disabled={working}
          className="w-full bg-green-400 rounded-xl py-3 items-center"
          activeOpacity={0.85}
        >
          {working
            ? <ActivityIndicator size="small" color="#052e16" />
            : <Text className="text-green-950 font-black text-sm">Upgrade to Pro</Text>}
        </TouchableOpacity>
      </View>

      {/* Pro features list */}
      <View className="bg-white px-5 py-3 border-t border-gray-50">
        {[
          'Unlimited savings goals',
          'AI-powered receipt scanning',
          'Advanced spending trends',
          'Priority support',
        ].map(feat => (
          <View key={feat} className="flex-row items-center gap-2 py-1.5">
            <Star size={12} color="#16a34a" fill="#16a34a" />
            <Text className="text-xs text-gray-600">{feat}</Text>
          </View>
        ))}
      </View>

      {/* Restore */}
      <TouchableOpacity
        onPress={handleRestore}
        disabled={working}
        className="bg-white border-t border-gray-50 px-5 py-3 flex-row items-center justify-center gap-1.5"
        activeOpacity={0.7}
      >
        <RotateCcw size={12} color="#9ca3af" />
        <Text className="text-xs text-gray-400">Restore previous purchases</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Profile Screen ──────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { t } = useTranslation();
  const {
    transactions,
    userProfile,
    darkMode,
    toggleDarkMode,
    updateUserProfile,
    getCurrencySymbol,
    formatCurrency,
    signOut,
  } = useApp();

  const FAQ_ITEMS = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
    { q: t('faq.q7'), a: t('faq.a7') },
    { q: t('faq.q8'), a: t('faq.a8') },
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // ── Financial score ────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const yearTxs = useMemo(
    () => transactions.filter(tx => new Date(tx.date).getFullYear() === currentYear),
    [transactions, currentYear],
  );
  const yearIncome = yearTxs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const yearExpenses = yearTxs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const monthsWithData = Math.max(
    new Set(transactions.map(tx => {
      const d = new Date(tx.date);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })).size,
    1,
  );
  const avgIncome = yearIncome / monthsWithData;
  const avgExpenses = yearExpenses / monthsWithData;
  const score = yearIncome > 0
    ? Math.min(100, Math.max(0, Math.round(100 - (yearExpenses / yearIncome) * 100)))
    : 50;
  const scoreLabel =
    score >= 80 ? t('profile.excellent_health') :
    score >= 60 ? t('profile.fair_health') :
    t('profile.needs_improvement');
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

  // ── Handlers ───────────────────────────────────────────────────────────────
  function confirmSignOut() {
    Alert.alert(t('profile.sign_out'), t('profile.sign_out_confirm' as any) ?? 'Sign out?', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.sign_out'), style: 'destructive', onPress: signOut },
    ]);
  }

  function confirmClearData() {
    Alert.alert(t('profile.clear_data'), t('profile.clear_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.clear_data'),
        style: 'destructive',
        onPress: async () => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.clear();
          Alert.alert('Done', 'All data cleared. Restart the app.');
        },
      },
    ]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Text className="text-xl font-bold text-gray-900">{t('profile.title')}</Text>
          <TouchableOpacity
            onPress={toggleDarkMode}
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
          >
            {darkMode
              ? <Sun size={18} color="#fbbf24" />
              : <Moon size={18} color="#6b7280" />}
          </TouchableOpacity>
        </View>

        {/* Avatar + Name */}
        <View className="items-center gap-3 pb-5">
          <View className="w-24 h-24 rounded-full bg-green-600 items-center justify-center">
            <Text className="text-white font-black text-3xl">
              {(userProfile.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>

          {editingName ? (
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              onBlur={() => { updateUserProfile({ name: nameInput }); setEditingName(false); }}
              onSubmitEditing={() => { updateUserProfile({ name: nameInput }); setEditingName(false); }}
              autoFocus
              className="border-b-2 border-green-600 text-center font-bold text-lg text-gray-900 w-48 pb-1"
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingName(true)} className="flex-row items-center gap-1.5">
              <Text className="text-lg font-bold text-gray-900">{userProfile.name}</Text>
              <Edit3 size={14} color="#9ca3af" />
            </TouchableOpacity>
          )}

          <Text className="text-xs text-gray-500">{userProfile.email}</Text>

          <View className="px-3 py-1 rounded-full bg-green-100">
            <Text className="text-xs font-semibold text-green-700 capitalize">
              {t('profile.plan_label', { plan: userProfile.plan })}
            </Text>
          </View>
        </View>

        {/* Financial Assessment */}
        <View className="mx-4 mb-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {t('profile.assessment')}
          </Text>

          {/* Income / Expense cards */}
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-green-50 rounded-2xl p-4 border border-green-100">
              <View className="flex-row items-center gap-1.5 mb-2">
                <TrendingUp size={14} color="#16a34a" />
                <Text className="text-[11px] text-green-600 font-semibold uppercase tracking-wide">
                  {t('profile.income_year')}
                </Text>
              </View>
              <Text className="text-xl font-black text-green-700">{formatCurrency(yearIncome)}</Text>
              <Text className="text-[11px] text-green-600/70 mt-0.5">{t('profile.this_year')}</Text>
              <Text className="text-[11px] text-green-600 mt-1 font-medium">
                {t('profile.avg_income', { amount: formatCurrency(avgIncome) })}
              </Text>
            </View>
            <View className="flex-1 bg-red-50 rounded-2xl p-4 border border-red-100">
              <View className="flex-row items-center gap-1.5 mb-2">
                <TrendingDown size={14} color="#ef4444" />
                <Text className="text-[11px] text-red-500 font-semibold uppercase tracking-wide">
                  {t('profile.expenses_year')}
                </Text>
              </View>
              <Text className="text-xl font-black text-red-600">{formatCurrency(yearExpenses)}</Text>
              <Text className="text-[11px] text-red-500/70 mt-0.5">{t('profile.this_year')}</Text>
              <Text className="text-[11px] text-red-500 mt-1 font-medium">
                {t('profile.avg_income', { amount: formatCurrency(avgExpenses) })}
              </Text>
            </View>
          </View>

          {/* Score ring card */}
          <View className="bg-white rounded-2xl p-5 items-center gap-3 shadow-sm border border-gray-50">
            <ScoreRing score={score} />
            <View className="items-center">
              <Text className="font-bold text-base text-gray-900">{scoreLabel}</Text>
              <Text className="text-xs text-gray-400 mt-1 text-center">
                {score >= 80
                  ? t('profile.saving_healthy')
                  : score >= 60
                    ? t('profile.managing_well')
                    : t('profile.expenses_high')}
              </Text>
            </View>
            {/* Legend */}
            <View className="flex-row gap-4 justify-center">
              {[
                { color: '#22c55e', range: '80–100', label: 'Excellent' },
                { color: '#eab308', range: '60–79', label: 'Fair' },
                { color: '#ef4444', range: '0–59', label: 'Critical' },
              ].map(b => (
                <View key={b.label} className="items-center">
                  <View className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: b.color }} />
                  <Text className="text-[10px] text-gray-400">{b.range}</Text>
                  <Text className="text-[10px] font-medium" style={{ color: b.color }}>{b.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Subscription */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mx-4 mb-2">
          Subscription
        </Text>
        <SubscriptionCard />

        {/* Settings sections */}
        <View className="mx-4 gap-3 mb-4">

          {/* Preferences */}
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50">
            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
              {t('profile.preferences')}
            </Text>
            {/* Dark Mode toggle row */}
            <View className="flex-row items-center gap-3 px-4 py-3.5">
              <View className="w-9 h-9 rounded-2xl bg-gray-100 items-center justify-center">
                {darkMode
                  ? <Moon size={16} color="#60a5fa" />
                  : <Sun size={16} color="#f59e0b" />}
              </View>
              <Text className="flex-1 text-sm font-medium text-gray-900">{t('profile.dark_mode')}</Text>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
                thumbColor="#fff"
              />
            </View>
            <SettingsRow
              icon={<Globe size={16} color="#6b7280" />}
              label={t('profile.currency')}
              value={`${userProfile.currency || 'USD'} · ${getCurrencySymbol()}`}
              onPress={() => setShowCurrency(true)}
            />
            <SettingsRow
              icon={<Text style={{ fontSize: 16 }}>🌐</Text>}
              label={t('profile.language')}
              value={LANGUAGES.find(l => l.code === (userProfile.language || 'en'))?.nativeLabel ?? 'English'}
              onPress={() => setShowLanguage(true)}
            />
            <SettingsRow
              icon={<Tag size={16} color="#6b7280" />}
              label={t('profile.categories')}
              onPress={() => setShowCategories(true)}
            />
          </View>

          {/* Account */}
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50">
            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
              {t('profile.account')}
            </Text>
            <SettingsRow
              icon={<Lock size={16} color="#6b7280" />}
              label={t('profile.change_pw')}
              onPress={() =>
                Alert.alert(
                  t('profile.change_pw'),
                  'Password change is not available in this version.',
                )
              }
            />
          </View>

          {/* Legal & Support */}
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50">
            <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
              {t('profile.legal')}
            </Text>
            <SettingsRow
              icon={<FileText size={16} color="#6b7280" />}
              label={t('profile.terms')}
              onPress={() => setShowTerms(true)}
            />
            <SettingsRow
              icon={<FileText size={16} color="#6b7280" />}
              label={t('profile.privacy')}
              onPress={() => setShowPrivacy(true)}
            />
            <SettingsRow
              icon={<HelpCircle size={16} color="#6b7280" />}
              label={t('profile.help_faq')}
              onPress={() => setShowFAQ(true)}
            />
          </View>

          {/* FAQ inline section */}
          {showFAQ ? (
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-gray-900">{t('faq.title')}</Text>
                <TouchableOpacity onPress={() => setShowFAQ(false)}>
                  <X size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              {FAQ_ITEMS.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </View>
          ) : null}

          {/* Danger zone */}
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-50">
            <SettingsRow
              icon={<Trash2 size={16} color="#ef4444" />}
              label={t('profile.clear_data')}
              danger
              onPress={confirmClearData}
            />
            <SettingsRow
              icon={<LogOut size={16} color="#ef4444" />}
              label={t('profile.sign_out')}
              danger
              onPress={confirmSignOut}
            />
          </View>
        </View>

        <Text className="text-center text-[11px] text-gray-300 pb-8">
          {t('misc.version')}
        </Text>

        {/* ── Currency picker modal ── */}
        <Modal
          visible={showCurrency}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCurrency(false)}
        >
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">{t('profile.select_currency')}</Text>
              <TouchableOpacity
                onPress={() => { setShowCurrency(false); setCurrencySearch(''); }}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-2 bg-gray-50 rounded-xl mx-4 my-3 px-3 py-2.5">
              <Text className="text-gray-400 text-sm">🔍</Text>
              <TextInput
                placeholder={t('profile.search_currency')}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                className="flex-1 text-sm text-gray-900"
                autoFocus
              />
              {currencySearch ? (
                <TouchableOpacity onPress={() => setCurrencySearch('')}>
                  <X size={14} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView className="flex-1">
              {CURRENCIES.filter(
                c =>
                  !currencySearch ||
                  c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                  c.name.toLowerCase().includes(currencySearch.toLowerCase()),
              ).map(c => {
                const selected = (userProfile.currency || 'USD') === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => {
                      updateUserProfile({ currency: c.code });
                      setShowCurrency(false);
                      setCurrencySearch('');
                    }}
                    className={`flex-row items-center gap-3 px-5 py-3.5 border-b border-gray-50 ${
                      selected ? 'bg-green-50' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className="w-12 text-xs font-bold text-gray-500">{c.code}</Text>
                    <Text
                      className={`flex-1 text-sm ${selected ? 'font-semibold text-green-700' : 'text-gray-900'}`}
                    >
                      {c.name}
                    </Text>
                    {selected ? <Text className="text-green-600 text-sm font-bold">✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* ── Language picker modal ── */}
        <Modal
          visible={showLanguage}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowLanguage(false)}
        >
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-900">{t('profile.language')}</Text>
              <TouchableOpacity
                onPress={() => setShowLanguage(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView className="flex-1">
              {LANGUAGES.map(lang => {
                const selected = (userProfile.language || 'en') === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => { updateUserProfile({ language: lang.code }); setShowLanguage(false); }}
                    className={`flex-row items-center gap-4 px-5 py-4 border-b border-gray-50 ${
                      selected ? 'bg-green-50' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-1">
                      <Text className={`text-sm font-semibold ${selected ? 'text-green-700' : 'text-gray-900'}`}>
                        {lang.nativeLabel}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{lang.label}</Text>
                    </View>
                    {selected ? <Text className="text-green-600 font-bold text-base">✓</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>

      </ScrollView>

      {/* Modals rendered outside ScrollView */}
      {showTerms ? <LegalSheet type="terms" onClose={() => setShowTerms(false)} /> : null}
      {showPrivacy ? <LegalSheet type="privacy" onClose={() => setShowPrivacy(false)} /> : null}
      {showCategories ? <CategoryManagerSheet onClose={() => setShowCategories(false)} /> : null}
    </SafeAreaView>
  );
}
