import { useState, useMemo, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTourTarget } from '../../context/TourContext';
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
  Image,
} from 'react-native';

const happyMascotImg = require('../../assets/m_expression_happy.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Moon,
  Sun,
  Camera,
  ChevronRight,
  ChevronDown,
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
  Trophy,
  Bell,
  Link,
  Download,
  BarChart2,
  User,
} from 'lucide-react-native';
import { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../context/LanguageContext';
import { usePurchases, isUserCancelledError } from '../../context/PurchasesContext';
import {
  CURRENCIES,
  LANGUAGES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CustomCategory,
  COLOR_OPTIONS,
  ICON_OPTIONS,
} from '../../types';
import type { Transaction } from '../../types';
import { computeBadges, computeStreaks, BADGES, BadgeDef } from '../../utils/achievements';
import {
  NotifPrefs,
  DEFAULT_PREFS,
  loadNotifPrefs,
  saveNotifPrefs,
  syncNotificationSettings,
  getTranslationFunction,
} from '../../utils/notifications';
import BadgeCelebration from '../../components/BadgeCelebration';
import StatusCelebration from '../../components/StatusCelebration';

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, onPress }: { score: number; onPress?: () => void }) {
  const { t } = useTranslation();
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  const SIZE = 120;
  const BORDER = 10;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      className="items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
    >
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
    </TouchableOpacity>
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
          danger ? 'bg-red-50' : 'bg-gray-100 dark:bg-gray-800'
        }`}
      >
        {icon}
      </View>
      <Text className={`flex-1 text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
        {label}
      </Text>
      {value ? <Text className="text-xs text-gray-400 dark:text-gray-500 mr-1">{value}</Text> : null}
      {right ?? (!danger ? <ChevronRight size={14} color="#d1d5db" /> : null)}
    </TouchableOpacity>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden mb-2">
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        className="flex-row items-center px-4 py-3.5"
        activeOpacity={0.7}
      >
        <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white pr-3">{q}</Text>
        <ChevronDown
          size={16}
          color="#9ca3af"
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {open ? (
        <View className="px-4 pb-4">
          <Text className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Legal Sheet ──────────────────────────────────────────────────────────────
function LegalSheet({ type, onClose }: { type: 'terms' | 'privacy'; onClose: () => void }) {
  const { t } = useTranslation();
  const sections =
    type === 'terms'
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
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {type === 'terms' ? t('profile.terms') : t('profile.privacy')}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-5 py-4">
          <Text className="text-xs text-gray-400 mb-4">{t('legal.last_updated')}</Text>
          {sections.map((s, i) => (
            <View key={i} className="mb-5">
              <Text className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">{s.title}</Text>
              <Text className="text-sm text-gray-600 leading-relaxed">{s.body}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="px-5 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800">
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
      updateCustomCategory(editingId, {
        label: formName.trim(),
        type: formType,
        color: formColor,
        icon: formIcon,
      });
    } else {
      addCustomCategory({ label: formName.trim(), type: formType, color: formColor, icon: formIcon });
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    Alert.alert(t('catmgr.delete_title'), t('catmgr.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeCustomCategory(id) },
    ]);
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('catmgr.title')}</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {showForm ? (
          <ScrollView className="flex-1 px-5 py-4">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? t('catmgr.edit') : t('catmgr.new')}
            </Text>
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
                  <Text
                    className={`text-sm font-semibold ${
                      formType === tp ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {tp.charAt(0).toUpperCase() + tp.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-xs font-semibold text-gray-500 mb-1.5">{t('catmgr.name')}</Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              placeholder={t('catmgr.name_ph')}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
            />
            <Text className="text-xs font-semibold text-gray-500 mb-2">{t('catmgr.color')}</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {COLOR_OPTIONS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setFormColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: c,
                    borderWidth: formColor === c ? 3 : 0,
                    borderColor: '#111',
                  }}
                />
              ))}
            </View>
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
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-5 pt-4 pb-2">
              {t('catmgr.builtin')}
            </Text>
            {ALL_BUILTIN.map(cat => {
              const disabled = disabledCategories.includes(cat.id);
              return (
                <View key={cat.id} className="flex-row items-center px-5 py-3 border-b border-gray-50 dark:border-gray-900">
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: cat.color + '20' }}
                  >
                    <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  </View>
                  <Text
                    className={`flex-1 text-sm font-medium ${
                      disabled ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
                    }`}
                  >
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
            {customCategories.length > 0 ? (
              <>
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider px-5 pt-5 pb-2">
                  {t('catmgr.my_cats')}
                </Text>
                {customCategories.map(cat => (
                  <View key={cat.id} className="flex-row items-center px-5 py-3 border-b border-gray-50 dark:border-gray-900">
                    <View
                      className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{cat.label}</Text>
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

// ─── Notifications Sheet ──────────────────────────────────────────────────────
function NotificationsSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotifPrefs().then(p => {
      setPrefs(p);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveNotifPrefs(prefs);
      Alert.alert('', t('notif.saved'), [{ text: t('common.ok'), onPress: onClose }]);
    } finally {
      setSaving(false);
    }
  }

  const TOGGLES: Array<{ key: keyof NotifPrefs; icon: string; title: string; desc: string }> = [
    {
      key: 'weeklySummary',
      icon: '📊',
      title: t('notif.weekly_summary'),
      desc: t('notif.weekly_summary_desc'),
    },
    {
      key: 'budgetAlerts',
      icon: '🔔',
      title: t('notif.budget_alerts'),
      desc: t('notif.budget_alerts_desc'),
    },
    {
      key: 'streakReminders',
      icon: '🔥',
      title: t('notif.streak_reminders'),
      desc: t('notif.streak_reminders_desc'),
    },
    {
      key: 'tips',
      icon: '💡',
      title: t('notif.tips'),
      desc: t('notif.tips_desc'),
    },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('notif.title')}</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#16a34a" />
          </View>
        ) : (
          <ScrollView className="flex-1">
            <Text className="text-sm text-gray-500 dark:text-gray-400 px-5 pt-4 pb-2">{t('notif.desc')}</Text>
            <View className="mx-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-sm">
              {TOGGLES.map(({ key, icon, title, desc }, i) => (
                <View
                  key={key}
                  className={`flex-row items-center gap-3 px-4 py-4 ${
                    i < TOGGLES.length - 1 ? 'border-b border-gray-50 dark:border-gray-900' : ''
                  }`}
                >
                  <Text style={{ fontSize: 22, width: 28 }}>{icon}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 dark:text-white">{title}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">{desc}</Text>
                  </View>
                  <Switch
                    value={prefs[key]}
                    onValueChange={v => setPrefs(p => ({ ...p, [key]: v }))}
                    trackColor={{ false: '#e5e7eb', true: '#16a34a' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="mx-4 mt-6 mb-8 py-4 rounded-2xl bg-green-600 items-center"
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold">{t('notif.save')}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Subscription Sheet ───────────────────────────────────────────────────────
function SubscriptionSheet({ onClose }: { onClose: () => void }) {
  const { isPro, isLoading, presentPaywallIfNeeded, presentCustomerCenter, restorePurchases } =
    usePurchases();
  const { t } = useTranslation();
  const [working, setWorking] = useState(false);

  async function handleUpgrade() {
    setWorking(true);
    try {
      const result = await presentPaywallIfNeeded();
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        Alert.alert(t('profile.welcome_pro_title'), t('profile.welcome_pro_msg'));
        onClose();
      }
    } catch (e) {
      if (!isUserCancelledError(e)) {
        Alert.alert(t('profile.purchase_failed'), t('profile.something_wrong'));
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
        hasPro ? t('profile.restored_title') : t('profile.nothing_to_restore'),
        hasPro
          ? t('profile.pro_restored_msg')
          : t('profile.no_purchases_msg'),
      );
    } catch {
      Alert.alert(t('profile.restore_failed'), t('profile.something_wrong'));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.subscription')}</Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#16a34a" />
          </View>
        ) : isPro ? (
          <ScrollView className="flex-1">
            <View className="mx-4 mt-6 rounded-2xl overflow-hidden shadow-sm">
              <View className="px-5 py-5 items-center" style={{ backgroundColor: '#052e16' }}>
                <View className="flex-row items-center gap-2 mb-1">
                  <Star size={16} color="#4ade80" fill="#4ade80" />
                  <Text className="text-green-400 font-black text-sm uppercase tracking-widest">
                    {t('profile.pro_title')}
                  </Text>
                </View>
                <Text className="text-white/60 text-xs text-center">
                  {t('profile.pro_access')}
                </Text>
              </View>
              <View className="bg-white border-t border-gray-50 dark:border-gray-900">
                <TouchableOpacity
                  onPress={handleManage}
                  className="flex-row items-center gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-gray-900"
                  activeOpacity={0.7}
                >
                  <View className="w-8 h-8 rounded-xl bg-green-50 items-center justify-center">
                    <Settings size={15} color="#16a34a" />
                  </View>
                  <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {t('profile.manage_sub')}
                  </Text>
                  <ChevronRight size={14} color="#d1d5db" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRestore}
                  disabled={working}
                  className="flex-row items-center gap-3 px-5 py-3.5"
                  activeOpacity={0.7}
                >
                  <View className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
                    <RotateCcw size={15} color="#6b7280" />
                  </View>
                  <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                    {t('profile.restore_purchases')}
                  </Text>
                  {working ? (
                    <ActivityIndicator size="small" color="#6b7280" />
                  ) : (
                    <ChevronRight size={14} color="#d1d5db" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="flex-1">
            <View className="mx-4 mt-6 rounded-2xl overflow-hidden shadow-sm">
              <View className="px-5 py-5 items-center" style={{ backgroundColor: '#14532d' }}>
                <View className="w-12 h-12 rounded-2xl bg-green-400/20 items-center justify-center mb-3">
                  <Zap size={24} color="#4ade80" />
                </View>
                <Text className="text-white font-black text-base mb-1">{t('profile.unlock_pro')}</Text>
                <Text className="text-white/60 text-xs text-center leading-relaxed mb-4">
                  {t('profile.pro_subtitle')}
                </Text>
                <TouchableOpacity
                  onPress={handleUpgrade}
                  disabled={working}
                  className="w-full bg-green-400 rounded-xl py-3 items-center"
                  activeOpacity={0.85}
                >
                  {working ? (
                    <ActivityIndicator size="small" color="#052e16" />
                  ) : (
                    <Text className="text-green-950 font-black text-sm">{t('profile.upgrade_pro')}</Text>
                  )}
                </TouchableOpacity>
              </View>
              <View className="bg-white px-5 py-3 border-t border-gray-50 dark:border-gray-900">
                {([
                  t('profile.pro_feature1'),
                  t('profile.pro_feature2'),
                  t('profile.pro_feature3'),
                  t('profile.pro_feature4'),
                ] as string[]).map(feat => (
                  <View key={feat} className="flex-row items-center gap-2 py-1.5">
                    <Star size={12} color="#16a34a" fill="#16a34a" />
                    <Text className="text-xs text-gray-600">{feat}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleRestore}
                disabled={working}
                className="bg-white border-t border-gray-50 dark:border-gray-900 px-5 py-3 flex-row items-center justify-center gap-1.5"
                activeOpacity={0.7}
              >
                <RotateCcw size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-400">{t('profile.restore_prev')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Budget Streak Card ───────────────────────────────────────────────────────
function BudgetStreakCard({ transactions }: { transactions: Transaction[] }) {
  const { t } = useTranslation();
  const { current, best } = computeStreaks(transactions);

  const now = new Date();
  const dots = Array.from({ length: 12 }, (_, i) => {
    const monthOffset = 12 - i; // 12 = oldest, 1 = last month
    if (monthOffset === 0) return 'current';
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const txs = transactions.filter(tx => {
      const td = new Date(tx.date);
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    });
    if (!txs.length) return 'empty';
    const income = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
    const expenses = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
    return income > 0 && expenses < income ? 'good' : 'bad';
  });

  return (
    <View className="mx-4 mb-2 rounded-2xl p-4" style={{ backgroundColor: '#052e16' }}>
      <Text className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">
        {t('profile.budget_streak')}
      </Text>
      <View className="flex-row gap-1.5 mb-4 flex-wrap">
        {dots.map((dot, i) => (
          <View
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor:
                dot === 'good'
                  ? '#4ade80'
                  : dot === 'bad'
                  ? '#7f1d1d'
                  : '#166534',
              borderWidth: dot === 'current' ? 0 : 0,
            }}
          />
        ))}
      </View>
      <View className="flex-row gap-6 items-center">
        <View>
          <Text className="text-3xl font-black text-white">{current}</Text>
          <Text className="text-[11px] text-green-400/70 mt-0.5">{t('streak.current')}</Text>
        </View>
        <View className="w-px h-10 bg-green-900" />
        <View>
          <Text className="text-3xl font-black text-white">{best}</Text>
          <Text className="text-[11px] text-green-400/70 mt-0.5">{t('streak.best')}</Text>
        </View>
        {current > 0 && (
          <View className="ml-auto">
            <Text className="text-green-400 text-xs font-semibold">{t('streak.keep_going')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mx-4 mb-2 mt-1">
      {label}
    </Text>
  );
}

// ─── Main Profile Screen ──────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const {
    transactions,
    budget,
    userProfile,
    darkMode,
    toggleDarkMode,
    updateUserProfile,
    getCurrencySymbol,
    formatCurrency,
    signOut,
  } = useApp();
  const { isPro } = usePurchases();

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const FileSystem = await import('expo-file-system/legacy');
        const dest = (FileSystem.documentDirectory ?? '') + 'kachingo_avatar.jpg';
        await FileSystem.copyAsync({ from: result.assets[0].uri, to: dest });
        updateUserProfile({ avatar: dest });
      } catch {
        updateUserProfile({ avatar: result.assets[0].uri });
      }
    }
  }

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [celebrationBadge, setCelebrationBadge] = useState<BadgeDef | null>(null);
  const [showStatusCelebration, setShowStatusCelebration] = useState(false);
  const [seenBadgeIds, setSeenBadgeIds] = useState<Set<string>>(new Set());
  const [seenBadgesLoaded, setSeenBadgesLoaded] = useState(false);

  // Tour target refs
  const tourRefStreak     = useTourTarget('profile-streak', { scrollRef, scrollY: 120 });
  const tourRefAssessment = useTourTarget('profile-assessment', { scrollRef, scrollY: 520 });

  // ── Financial score ────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const yearTxs = useMemo(() => {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getFullYear() === currentYear && d <= todayEnd;
    });
  }, [transactions, currentYear]);
  const yearIncome = yearTxs
    .filter(tx => tx.type === 'income')
    .reduce((s, tx) => s + tx.amount, 0);
  const yearExpenses = yearTxs
    .filter(tx => tx.type === 'expense')
    .reduce((s, tx) => s + tx.amount, 0);
  const monthsWithData = Math.max(
    new Set(
      yearTxs.map(tx => {
        const d = new Date(tx.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      }),
    ).size,
    1,
  );
  const avgIncome = yearIncome / monthsWithData;
  const avgExpenses = yearExpenses / monthsWithData;

  // Multi-factor score (0–100):
  // 1. Expense ratio: 0–60 pts — 60 at ≤50% spending, 0 at ≥100%
  // 2. Budget adherence: 0–25 pts (12 neutral when no budget set)
  // 3. Tracking completeness: 0–15 pts
  let expRatioScore = 0;
  if (yearIncome > 0) {
    const ratio = yearExpenses / yearIncome;
    expRatioScore = Math.max(0, Math.round(60 * (1 - Math.max(0, ratio - 0.5) / 0.5)));
  }
  let budgetScore = 12;
  if (budget.expectedIncome > 0) {
    const monthlyExpAvg = yearExpenses / monthsWithData;
    const savingsReserve = budget.savingsGoal?.enabled ? (budget.savingsGoal.amount ?? 0) : 0;
    const targetExp = Math.max(0, budget.expectedIncome - savingsReserve);
    budgetScore = monthlyExpAvg <= targetExp ? 25
      : monthlyExpAvg <= targetExp * 1.15 ? 15
      : monthlyExpAvg <= targetExp * 1.30 ? 7 : 0;
  }
  const trackingScore = yearIncome > 0 && yearExpenses > 0 ? 15
    : (yearIncome > 0 || yearExpenses > 0) ? 7 : 0;
  const score = Math.min(100, Math.max(0, expRatioScore + budgetScore + trackingScore));
  const earnedBadgeIds = useMemo(
    () => new Set(computeBadges(transactions, budget).map(b => b.id)),
    [transactions, budget],
  );

  useEffect(() => {
    AsyncStorage.getItem('kachingo_seen_badges').then(raw => {
      if (raw) setSeenBadgeIds(new Set(JSON.parse(raw)));
      setSeenBadgesLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!seenBadgesLoaded) return;
    const unseen = [...earnedBadgeIds].filter(id => !seenBadgeIds.has(id));
    if (unseen.length === 0) return;
    const badge = BADGES.find(b => b.id === unseen[unseen.length - 1]);
    if (badge) setCelebrationBadge(badge);
  }, [earnedBadgeIds, seenBadgeIds, seenBadgesLoaded]);

  const scoreLabel =
    score >= 80
      ? t('profile.excellent_health')
      : score >= 60
      ? t('profile.fair_health')
      : t('profile.needs_improvement');

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
          Alert.alert(t('common.done'), t('profile.data_cleared_msg'));
        },
      },
    ]);
  }

  async function handleGenerateReport() {
    const { current, best } = computeStreaks(transactions);
    const scoreLabel2 = score >= 80 ? t('profile.score_excellent') : score >= 60 ? t('profile.score_fair') : t('profile.score_needs_imp');
    const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    const rTitle = t('profile.report_title');
    const rHealthScore = t('profile.financial_health_score');
    const rThisYear = t('profile.this_year');
    const rIncome = t('common.income');
    const rExpenses = t('common.expenses');
    const rNetBalance = t('profile.net_balance');
    const rSavingsRate = t('profile.savings_rate');
    const rBudgetStreak = t('profile.budget_streak');
    const rCurrentStreak = t('profile.current_streak');
    const rBestStreak = t('profile.best_streak');
    const rGeneratedWith = t('profile.generated_with');
    const rMonths = t('common.months');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:-apple-system,Arial,sans-serif;margin:0;padding:40px;color:#111827;background:#fff}
  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #f3f4f6}
  h1{color:#166534;font-size:22px;margin:0}
  .date{color:#9ca3af;font-size:12px;margin-top:4px}
  .score-row{display:flex;align-items:center;gap:16px;background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px}
  .score-circle{width:80px;height:80px;border-radius:50%;border:6px solid ${scoreColor};display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0}
  .score-num{font-size:24px;font-weight:800;color:${scoreColor};line-height:1}
  .score-denom{font-size:11px;color:#9ca3af}
  .score-label{font-size:18px;font-weight:700;color:${scoreColor}}
  .score-sub{font-size:13px;color:#6b7280;margin-top:4px}
  h2{color:#374151;font-size:14px;font-weight:700;margin:20px 0 8px;text-transform:uppercase;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse}
  td{padding:10px 6px;border-bottom:1px solid #f3f4f6;font-size:14px}
  .label{color:#6b7280}.value{font-weight:600;text-align:right}
  .positive{color:#16a34a}.negative{color:#dc2626}
  footer{margin-top:40px;color:#9ca3af;font-size:11px;text-align:center;border-top:1px solid #f3f4f6;padding-top:16px}
</style></head><body>
<div class="header">
  <div><h1>📊 ${rTitle}</h1><div class="date">${dateStr}</div></div>
</div>
<div class="score-row">
  <div class="score-circle"><span class="score-num">${score}</span><span class="score-denom">/100</span></div>
  <div><div class="score-label">${scoreLabel2}</div><div class="score-sub">${rHealthScore}</div></div>
</div>
<h2>${rThisYear}</h2>
<table>
  <tr><td class="label">${rIncome}</td><td class="value positive">${formatCurrency(yearIncome)}</td></tr>
  <tr><td class="label">${rExpenses}</td><td class="value">${formatCurrency(yearExpenses)}</td></tr>
  <tr><td class="label">${rNetBalance}</td><td class="value ${yearIncome - yearExpenses >= 0 ? 'positive' : 'negative'}">${formatCurrency(yearIncome - yearExpenses)}</td></tr>
  <tr><td class="label">${rSavingsRate}</td><td class="value">${yearIncome > 0 ? Math.round((1 - yearExpenses / yearIncome) * 100) : 0}%</td></tr>
</table>
<h2>${rBudgetStreak}</h2>
<table>
  <tr><td class="label">${rCurrentStreak}</td><td class="value">${current} ${rMonths}</td></tr>
  <tr><td class="label">${rBestStreak}</td><td class="value">${best} ${rMonths}</td></tr>
</table>
<footer>${rGeneratedWith} · ${dateStr}</footer>
</body></html>`;

    try {
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t('profile.generate_report') });
    } catch {
      Alert.alert(`📊 ${rTitle}`, `Score: ${score}/100 (${scoreLabel2})\n${rIncome}: ${formatCurrency(yearIncome)}\n${rExpenses}: ${formatCurrency(yearExpenses)}`);
    }
  }

  async function handleExportCSV() {
    const header = 'Date,Type,Category,Amount,Description';
    const rows = transactions.map(tx => {
      const d = new Date(tx.date).toISOString().slice(0, 10);
      const desc = (tx.description || '').replace(/,/g, ';');
      return `${d},${tx.type},${tx.category},${tx.amount},${desc}`;
    });
    const csv = [header, ...rows].join('\n');
    try {
      const FileSystem = await import('expo-file-system/legacy');
      const Sharing = await import('expo-sharing');
      const path = FileSystem.cacheDirectory + 'kachingo_transactions.csv';
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: t('profile.export_csv') });
    } catch {
      Alert.alert(t('profile.export_csv'), `${rows.length} transactions exported.`);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* ── Header ── */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</Text>
          <TouchableOpacity
            onPress={toggleDarkMode}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 items-center justify-center shadow-sm"
          >
            {darkMode ? (
              <Sun size={18} color="#fbbf24" />
            ) : (
              <Moon size={18} color="#6b7280" />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Avatar + Name ── */}
        <View className="items-center gap-2 pb-5">
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} style={{ position: 'relative' }}>
            {userProfile.avatar ? (
              <Image
                source={{ uri: userProfile.avatar }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            ) : (
              <View className="w-24 h-24 rounded-full bg-green-600 items-center justify-center">
                <Text className="text-white font-black text-3xl">
                  {(userProfile.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: darkMode ? '#111827' : '#f9fafb' }}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {editingName ? (
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              onBlur={() => {
                updateUserProfile({ name: nameInput });
                setEditingName(false);
              }}
              onSubmitEditing={() => {
                updateUserProfile({ name: nameInput });
                setEditingName(false);
              }}
              autoFocus
              className="border-b-2 border-green-600 text-center font-bold text-lg text-gray-900 w-48 pb-1"
            />
          ) : (
            <TouchableOpacity
              onPress={() => setEditingName(true)}
              className="flex-row items-center gap-1.5"
            >
              <Text className="text-lg font-bold text-gray-900 dark:text-white">{userProfile.name}</Text>
              <Edit3 size={14} color="#9ca3af" />
            </TouchableOpacity>
          )}

          <Text className="text-xs text-gray-500">{userProfile.email}</Text>

          {/* Plan pill */}
          {isPro ? (
            <View className="px-3 py-1 rounded-full bg-green-100 flex-row items-center gap-1">
              <Star size={10} color="#16a34a" fill="#16a34a" />
              <Text className="text-xs font-semibold text-green-700">Pro</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowSubscription(true)}
              className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 flex-row items-center gap-1.5"
            >
              <Zap size={10} color="#d97706" />
              <Text className="text-xs font-semibold text-amber-700">
                {t('profile.upgrade_banner')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── ACHIEVEMENTS ── */}
        <SectionHeader label={t('profile.achievements')} />

        {/* Budget Streak */}
        <View ref={tourRefStreak} collapsable={false}>
          <BudgetStreakCard transactions={transactions} />
        </View>

        {/* Badges */}
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800 mb-2">
          <View className="flex-row flex-wrap gap-2">
            {BADGES.slice(0, 9).map(badge => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <View
                  key={badge.id}
                  className={`items-center rounded-2xl py-3 px-2 ${
                    earned ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'
                  }`}
                  style={{ width: '30.5%' }}
                >
                  <Text style={{ fontSize: 22, opacity: earned ? 1 : 0.25 }}>{badge.icon}</Text>
                  <Text
                    className={`text-[10px] font-bold text-center mt-1 ${
                      earned ? 'text-green-700 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    numberOfLines={2}
                  >
                    {t(`badge.${badge.id}.label` as any)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-3">
            {earnedBadgeIds.size}/{BADGES.length} {t('achieve.unlocked')}
          </Text>
        </View>

        {/* Achievements link */}
        <TouchableOpacity
          onPress={() => router.push('/achievements' as any)}
          className="mx-4 mb-5 flex-row items-center justify-between bg-white dark:bg-gray-900 rounded-2xl px-4 py-3.5 shadow-sm border border-gray-50 dark:border-gray-800"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 items-center justify-center">
              <Trophy size={15} color="#d97706" />
            </View>
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">{t('profile.see_achievements')}</Text>
          </View>
          <ChevronRight size={14} color="#d1d5db" />
        </TouchableOpacity>

        {/* ── FINANCIAL ASSESSMENT ── */}
        <SectionHeader label={t('profile.assessment')} />
        <View ref={tourRefAssessment} collapsable={false} className="mx-4 mb-5">
          {/* Income / Expense year cards */}
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-green-50 rounded-2xl p-4 border border-green-100">
              <View className="flex-row items-center gap-1.5 mb-2">
                <TrendingUp size={14} color="#16a34a" />
                <Text className="text-[11px] text-green-600 font-semibold uppercase tracking-wide">
                  {t('profile.income_year')}
                </Text>
              </View>
              <Text className="text-xl font-black text-green-700">
                {formatCurrency(yearIncome)}
              </Text>
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
              <Text className="text-xl font-black text-red-600">
                {formatCurrency(yearExpenses)}
              </Text>
              <Text className="text-[11px] text-red-500/70 mt-0.5">{t('profile.this_year')}</Text>
              <Text className="text-[11px] text-red-500 mt-1 font-medium">
                {t('profile.avg_income', { amount: formatCurrency(avgExpenses) })}
              </Text>
            </View>
          </View>

          {/* Score ring */}
          <View className="bg-white dark:bg-gray-900 rounded-2xl p-5 items-center gap-3 shadow-sm border border-gray-800 mb-3">
            {score >= 80 && (
              <Image source={happyMascotImg} style={{ width: 72, height: 72 }} resizeMode="contain" />
            )}
            <ScoreRing score={score} onPress={() => setShowStatusCelebration(true)} />
            <View className="items-center">
              <Text className="font-bold text-base text-gray-900 dark:text-white">{scoreLabel}</Text>
              <Text className="text-xs text-gray-400 mt-1 text-center">
                {score >= 80
                  ? t('profile.saving_healthy')
                  : score >= 60
                  ? t('profile.managing_well')
                  : t('profile.expenses_high')}
              </Text>
            </View>
            <View className="flex-row gap-4 justify-center">
              {[
                { color: '#22c55e', range: '80–100', label: 'Excellent' },
                { color: '#eab308', range: '60–79', label: 'Fair' },
                { color: '#ef4444', range: '0–59', label: 'Critical' },
              ].map(b => (
                <View key={b.label} className="items-center">
                  <View className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: b.color }} />
                  <Text className="text-[10px] text-gray-400">{b.range}</Text>
                  <Text className="text-[10px] font-medium" style={{ color: b.color }}>
                    {b.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Generate Report button */}
          <TouchableOpacity
            onPress={handleGenerateReport}
            className="rounded-2xl py-3.5 items-center flex-row justify-center gap-2"
            style={{ backgroundColor: '#111827' }}
            activeOpacity={0.8}
          >
            <BarChart2 size={16} color="#fff" />
            <Text className="text-white font-bold text-sm">{t('profile.generate_report')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── ACCOUNT ── */}
        <SectionHeader label={t('profile.account')} />
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-800 mb-5">
          <SettingsRow
            icon={<Link size={16} color="#6b7280" />}
            label={t('profile.linked_account')}
            onPress={() => router.push('/linked-account' as any)}
          />
          <SettingsRow
            icon={<Star size={16} color="#6b7280" />}
            label={t('profile.subscription_plan')}
            value={isPro ? 'Pro' : t('profile.free_trial')}
            onPress={() => setShowSubscription(true)}
          />
        </View>

        {/* ── PREFERENCES ── */}
        <SectionHeader label={t('profile.preferences')} />
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-800 mb-5">
          <SettingsRow
            icon={<Tag size={16} color="#6b7280" />}
            label={t('profile.categories')}
            onPress={() => setShowCategories(true)}
          />
          <SettingsRow
            icon={<Bell size={16} color="#6b7280" />}
            label={t('profile.notifications')}
            onPress={() => setShowNotifications(true)}
          />
          {/* Dark Mode */}
          <View className="flex-row items-center gap-3 px-4 py-3.5 border-t border-gray-50 dark:border-gray-900">
            <View className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
              {darkMode ? (
                <Moon size={16} color="#60a5fa" />
              ) : (
                <Sun size={16} color="#f59e0b" />
              )}
            </View>
            <Text className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{t('profile.dark_mode')}</Text>
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
            value={
              LANGUAGES.find(l => l.code === (userProfile.language || 'en'))?.nativeLabel ??
              'English'
            }
            onPress={() => setShowLanguage(true)}
          />
        </View>

        {/* ── DATA ── */}
        <SectionHeader label={t('profile.data')} />
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-800 mb-5">
          <SettingsRow
            icon={<Download size={16} color="#6b7280" />}
            label={t('profile.export_csv')}
            onPress={handleExportCSV}
          />
        </View>

        {/* ── LEGAL & SUPPORT ── */}
        <SectionHeader label={t('profile.legal')} />
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-800 mb-5">
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

        {/* FAQ inline */}
        {showFAQ ? (
          <View className="mx-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-bold text-gray-900 dark:text-white">{t('faq.title')}</Text>
              <TouchableOpacity onPress={() => setShowFAQ(false)}>
                <X size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </View>
        ) : null}

        {/* ── Danger zone ── */}
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 mb-4">
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

        <Text className="text-center text-[11px] text-gray-300 pb-8">{t('misc.version')}</Text>

        {/* ── Currency picker ── */}
        <Modal
          visible={showCurrency}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCurrency(false)}
        >
          <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.select_currency')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCurrency(false);
                  setCurrencySearch('');
                }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
              >
                <X size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl mx-4 my-3 px-3 py-2.5">
              <Text className="text-gray-400 text-sm">🔍</Text>
              <TextInput
                placeholder={t('profile.search_currency')}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                className="flex-1 text-sm text-gray-900 dark:text-white"
                placeholderTextColor="#9ca3af"
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
                    className={`flex-row items-center gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-gray-900 ${
                      selected ? 'bg-green-50' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text className={`w-12 text-xs font-bold ${selected ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>{c.code}</Text>
                    <Text
                      className={`flex-1 text-sm ${
                        selected ? 'font-semibold text-green-700' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {c.name}
                    </Text>
                    {selected ? (
                      <Text className="text-green-600 text-sm font-bold">✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* ── Language picker ── */}
        <Modal
          visible={showLanguage}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowLanguage(false)}
        >
          <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.language')}</Text>
              <TouchableOpacity
                onPress={() => setShowLanguage(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
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
                    onPress={async () => {
                      updateUserProfile({ language: lang.code });
                      // Re-sync notifications with the new language
                      const prefs = await loadNotifPrefs();
                      const t = await getTranslationFunction(lang.code);
                      await syncNotificationSettings(prefs, t);
                      setShowLanguage(false);
                    }}
                    className={`flex-row items-center gap-4 px-5 py-4 border-b border-gray-50 dark:border-gray-900 ${
                      selected ? 'bg-green-50' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-semibold ${
                          selected
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {lang.nativeLabel}
                      </Text>
                      <Text className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">{lang.label}</Text>
                    </View>
                    {selected ? (
                      <Text className="text-green-600 dark:text-green-300 font-bold text-base">✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>

      {/* ── Modals ── */}
      {showTerms ? <LegalSheet type="terms" onClose={() => setShowTerms(false)} /> : null}
      {showPrivacy ? <LegalSheet type="privacy" onClose={() => setShowPrivacy(false)} /> : null}
      {showCategories ? <CategoryManagerSheet onClose={() => setShowCategories(false)} /> : null}
      {showNotifications ? (
        <NotificationsSheet onClose={() => setShowNotifications(false)} />
      ) : null}
      {showSubscription ? (
        <SubscriptionSheet onClose={() => setShowSubscription(false)} />
      ) : null}

      {celebrationBadge ? (
        <BadgeCelebration
          badge={celebrationBadge}
          earnedCount={earnedBadgeIds.size}
          onClose={() => {
            const updated = new Set([...seenBadgeIds, celebrationBadge.id]);
            setSeenBadgeIds(updated);
            AsyncStorage.setItem('kachingo_seen_badges', JSON.stringify([...updated]));
            setCelebrationBadge(null);
          }}
        />
      ) : null}

      {showStatusCelebration ? (
        <StatusCelebration
          status={score >= 80 ? 'excellent' : score >= 60 ? 'fair' : 'critical'}
          score={score}
          onClose={() => setShowStatusCelebration(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
