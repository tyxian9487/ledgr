import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, NativeModules, Platform } from 'react-native';
import { Transaction, UserProfile, BudgetSettings, AutoDebitPeriod, CustomCategory, CustomGoal, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { initMixpanel, trackEvent, identifyUser, resetAnalytics } from '../utils/analytics';
import { supabase } from '../utils/supabase';

function advanceDate(date: Date, period: AutoDebitPeriod): Date {
  const d = new Date(date);
  if (period === 'daily') d.setDate(d.getDate() + 1);
  else if (period === 'weekly') d.setDate(d.getDate() + 7);
  else if (period === 'biweekly') d.setDate(d.getDate() + 14);
  else if (period === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (period === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d;
}

function processAutoDebits(txs: Transaction[]): Transaction[] {
  const ceiling = new Date();
  ceiling.setHours(23, 59, 59, 999);
  const existingIds = new Set(txs.map(t => t.id));
  const additions: Transaction[] = [];

  const templates = txs.filter(t => t.isAutoDebit && t.autoDebitPeriod && !t.id.includes('_auto_'));

  for (const tmpl of templates) {
    const related = txs.filter(t => t.id === tmpl.id || t.id.startsWith(`${tmpl.id}_auto_`));
    const lastMs = Math.max(...related.map(t => new Date(t.date).getTime()));
    let next = advanceDate(new Date(lastMs), tmpl.autoDebitPeriod!);
    while (next <= ceiling) {
      const nid = `${tmpl.id}_auto_${next.getTime()}`;
      if (!existingIds.has(nid)) {
        additions.push({ ...tmpl, id: nid, date: next.toISOString() });
        existingIds.add(nid);
      }
      next = advanceDate(next, tmpl.autoDebitPeriod!);
    }
  }

  return additions.length > 0 ? [...txs, ...additions] : txs;
}

export type Category = { id: string; label: string; icon: string; color: string };

interface AppContextType {
  transactions: Transaction[];
  userProfile: UserProfile;
  darkMode: boolean;
  budget: BudgetSettings;
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  hasCompletedOnboarding: boolean;
  customCategories: CustomCategory[];
  disabledCategories: string[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, data: Omit<Transaction, 'id'>) => void;
  updateUserProfile: (p: Partial<UserProfile>) => void;
  toggleDarkMode: () => void;
  updateBudget: (b: BudgetSettings) => void;
  getMonthTransactions: (year: number, month: number) => Transaction[];
  getMonthIncome: (year: number, month: number) => number;
  getMonthExpenses: (year: number, month: number) => number;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  completeOnboarding: () => void;
  addCustomCategory: (cat: Omit<CustomCategory, 'id'>) => CustomCategory;
  updateCustomCategory: (id: string, data: Partial<Omit<CustomCategory, 'id'>>) => void;
  removeCustomCategory: (id: string) => void;
  toggleCategoryEnabled: (id: string) => void;
  stopAutoDebit: (id: string) => void;
  endAutoDebitAt: (id: string) => void;
  restartAutoDebit: (templateId: string) => void;
  addCustomGoal: (goal: Omit<CustomGoal, 'id'>) => void;
  updateCustomGoal: (id: string, data: Partial<Omit<CustomGoal, 'id'>>) => void;
  removeCustomGoal: (id: string) => void;
  analyticsConsent: boolean | null;
  grantAnalyticsConsent: () => void;
  denyAnalyticsConsent: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'expensewise_data';

type ProfileOverrides = {
  name?: boolean;
  avatar?: boolean;
};

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

type RemoteProfile = Partial<UserProfile> & {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  plan?: string | null;
  currency?: string | null;
  language?: string | null;
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  email: 'user@example.com',
  avatar: null,
  plan: 'free',
  currency: 'USD',
  language: 'en',
};

function metadataString(meta: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function authProfileFromUser(user: AuthUser): Pick<UserProfile, 'name' | 'email' | 'avatar'> {
  const meta = user.user_metadata ?? {};
  return {
    name: metadataString(meta, 'full_name', 'name') || DEFAULT_PROFILE.name,
    email: user.email || DEFAULT_PROFILE.email,
    avatar: metadataString(meta, 'avatar_url', 'picture') || null,
  };
}

function validPlan(plan: unknown): UserProfile['plan'] | undefined {
  return plan === 'free' || plan === 'premium' ? plan : undefined;
}

function mergeAuthenticatedProfile(
  current: UserProfile,
  authProfile: Pick<UserProfile, 'name' | 'email' | 'avatar'>,
  remoteProfile: RemoteProfile | null | undefined,
  overrides: ProfileOverrides,
): UserProfile {
  const remoteName = typeof remoteProfile?.name === 'string' && remoteProfile.name.trim()
    ? remoteProfile.name.trim()
    : '';
  const remoteAvatar = typeof remoteProfile?.avatar === 'string' && remoteProfile.avatar.trim()
    ? remoteProfile.avatar.trim()
    : null;
  const remoteCurrency = typeof remoteProfile?.currency === 'string' && remoteProfile.currency.trim()
    ? remoteProfile.currency.trim()
    : undefined;
  const remoteLanguage = typeof remoteProfile?.language === 'string' && remoteProfile.language.trim()
    ? remoteProfile.language.trim()
    : undefined;

  const hasLocalNameOverride =
    overrides.name ||
    Boolean(current.name && current.name !== DEFAULT_PROFILE.name && current.name !== authProfile.name);
  const hasLocalAvatarOverride =
    overrides.avatar ||
    Boolean(current.avatar && current.avatar !== authProfile.avatar);

  return {
    ...current,
    name: hasLocalNameOverride
      ? current.name
      : remoteName || authProfile.name || current.name || DEFAULT_PROFILE.name,
    email: authProfile.email || remoteProfile?.email || current.email || DEFAULT_PROFILE.email,
    avatar: hasLocalAvatarOverride
      ? current.avatar
      : remoteAvatar ?? authProfile.avatar ?? current.avatar ?? DEFAULT_PROFILE.avatar,
    plan: validPlan(remoteProfile?.plan) ?? current.plan,
    currency: current.currency && current.currency !== DEFAULT_PROFILE.currency
      ? current.currency
      : remoteCurrency || current.currency || DEFAULT_PROFILE.currency,
    language: current.language && current.language !== DEFAULT_PROFILE.language
      ? current.language
      : remoteLanguage || current.language || DEFAULT_PROFILE.language,
  };
}

const SUPPORTED_LANGUAGES = ['en', 'zh', 'ja', 'ko', 'ms'] as const;

function detectDeviceLanguage(): string {
  try {
    const sources: string[] = [];
    if (Platform.OS === 'ios') {
      const s = NativeModules.SettingsManager?.settings;
      if (s?.AppleLanguages?.[0]) sources.push(s.AppleLanguages[0]);
      if (s?.AppleLocale) sources.push(s.AppleLocale);
    } else {
      const loc = NativeModules.I18nManager?.localeIdentifier;
      if (loc) sources.push(loc);
    }
    // Intl API — available in Hermes, good cross-platform fallback
    try {
      const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
      if (intlLocale && intlLocale !== 'und' && intlLocale !== 'root') sources.push(intlLocale);
    } catch {}

    for (const raw of sources) {
      if (!raw) continue;
      const tag = raw.replace(/_/g, '-').toLowerCase();
      const primary = tag.startsWith('zh') ? 'zh' : tag.split('-')[0];
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(primary)) return primary;
    }
    return 'en';
  } catch {
    return 'en';
  }
}

const DEFAULT_BUDGET: BudgetSettings = {
  expectedIncome: 0,
  allocations: [],
};

function generateSampleData(): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const samples: Transaction[] = [
    { id: '1', type: 'income', amount: 5000, category: 'salary', description: 'Monthly salary', date: new Date(year, month, 1).toISOString(), isAutoDebit: true, autoDebitPeriod: 'monthly' },
    { id: '2', type: 'expense', amount: 1200, category: 'housing', description: 'Monthly rent', date: new Date(year, month, 1).toISOString(), isAutoDebit: true, autoDebitPeriod: 'monthly' },
    { id: '3', type: 'expense', amount: 85, category: 'utilities', description: 'Electricity bill', date: new Date(year, month, 3).toISOString(), isAutoDebit: false },
    { id: '4', type: 'expense', amount: 240, category: 'food', description: 'Weekly groceries', date: new Date(year, month, 5).toISOString(), isAutoDebit: false },
    { id: '5', type: 'expense', amount: 45, category: 'transport', description: 'Monthly transit pass', date: new Date(year, month, 6).toISOString(), isAutoDebit: false },
    { id: '6', type: 'expense', amount: 120, category: 'entertainment', description: 'Concert tickets', date: new Date(year, month, 8).toISOString(), isAutoDebit: false },
    { id: '7', type: 'expense', amount: 35, category: 'subscriptions', description: 'Streaming services', date: new Date(year, month, 10).toISOString(), isAutoDebit: true, autoDebitPeriod: 'monthly' },
    { id: '8', type: 'expense', amount: 90, category: 'health', description: 'Gym membership', date: new Date(year, month, 12).toISOString(), isAutoDebit: true, autoDebitPeriod: 'monthly' },
    { id: '9', type: 'expense', amount: 180, category: 'shopping', description: 'Clothing', date: new Date(year, month, 14).toISOString(), isAutoDebit: false },
    { id: '10', type: 'income', amount: 800, category: 'freelance', description: 'Design project', date: new Date(year, month, 15).toISOString(), isAutoDebit: false },
    { id: '11', type: 'expense', amount: 55, category: 'food', description: 'Restaurant dinner', date: new Date(year, month, 17).toISOString(), isAutoDebit: false },
    { id: '12', type: 'expense', amount: 200, category: 'savings', description: 'Emergency fund', date: new Date(year, month, 20).toISOString(), isAutoDebit: false },
  ];
  return samples;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [darkMode, setDarkMode] = useState<boolean>(systemColorScheme === 'dark');
  const [darkModeManuallySet, setDarkModeManuallySet] = useState(false);

  const [budget, setBudget] = useState<BudgetSettings>(DEFAULT_BUDGET);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean | null>(null);
  const [profileOverrides, setProfileOverrides] = useState<ProfileOverrides>({});
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [languageManuallySelected, setLanguageManuallySelected] = useState(false);

  const userIdRef = useRef<string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileOverridesRef = useRef<ProfileOverrides>({});

  const loadRemoteProfile = useCallback(async (
    uid: string,
    authProfile: Pick<UserProfile, 'name' | 'email' | 'avatar'>,
  ) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name,email,avatar,plan,currency,language')
      .eq('id', uid)
      .maybeSingle();
    if (error) {
      console.warn('[Profile] Failed to load remote profile:', error.message);
      return;
    }
    if (data) {
      setUserProfile(prev => mergeAuthenticatedProfile(prev, authProfile, data, profileOverridesRef.current));
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          setTransactions(processAutoDebits(data.transactions || []));
          const savedProfile = data.userProfile || DEFAULT_PROFILE;
          const deviceLang = detectDeviceLanguage();
          // One-time migration: switch language from the old 'en' default to
          // the actual device language. langMigratedV1 prevents re-running
          // if the user later manually switches back to English.
          if (!data.langMigratedV1 && (!savedProfile.language || (savedProfile.language === 'en' && deviceLang !== 'en'))) {
            savedProfile.language = deviceLang;
          }
          const languageWasManual = data.languageManuallySelected ?? false;
          if (!languageWasManual) {
            savedProfile.language = detectDeviceLanguage();
          }
          setUserProfile(savedProfile);
          setLanguageManuallySelected(languageWasManual);
          const savedOverrides = data.profileOverrides || {};
          profileOverridesRef.current = savedOverrides;
          setProfileOverrides(savedOverrides);
          const manualDark = data.darkModeManuallySet ?? false;
          setDarkModeManuallySet(manualDark);
          setDarkMode(manualDark ? (data.dark_mode ?? systemColorScheme === 'dark') : systemColorScheme === 'dark');
          setBudget(data.budget || DEFAULT_BUDGET);
          setHasCompletedOnboarding(data.hasCompletedOnboarding ?? true);
          setCustomCategories(data.customCategories || []);
          setDisabledCategories(data.disabledCategories || []);
          const consent = data.analyticsConsent ?? null;
          setAnalyticsConsent(consent);
          if (consent === true) {
            initMixpanel().then(() => identifyUser(data.userProfile || DEFAULT_PROFILE));
          }
        } else {
          // Fresh install — seed language from device settings
          setTransactions([]);
          setUserProfile(prev => ({ ...prev, language: detectDeviceLanguage() }));
          profileOverridesRef.current = {};
          setProfileOverrides({});
          setLanguageManuallySelected(false);
        }
      } catch {
        setTransactions([]);
      } finally {
        setHasLoadedStorage(true);
      }
    };
    load();

    // Auth: check for existing Supabase session (persisted in SecureStore)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        userIdRef.current = session.user.id;
        const authProfile = authProfileFromUser(session.user);
        setUserProfile(prev => mergeAuthenticatedProfile(prev, authProfile, null, profileOverridesRef.current));
        loadRemoteProfile(session.user.id, authProfile);
      }
      // Fallback: mark auth ready if INITIAL_SESSION hasn't fired yet
      setIsAuthInitialized(true);
    });

    // Auth: listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') setIsAuthInitialized(true);
      if (session?.user) {
        setIsAuthenticated(true);
        userIdRef.current = session.user.id;
        const authProfile = authProfileFromUser(session.user);
        setUserProfile(prev => mergeAuthenticatedProfile(prev, authProfile, null, profileOverridesRef.current));

        // Upsert profile row on first sign-in (replaces the DB trigger)
        if (event === 'SIGNED_IN') {
          supabase.from('profiles').upsert({
            id: session.user.id,
            email: authProfile.email,
            name: authProfile.name,
            avatar: authProfile.avatar,
          }, { onConflict: 'id', ignoreDuplicates: true });
        }

        // Load cloud data if it is newer than the last local sync
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          const uid = session.user.id;
          (async () => {
            await loadRemoteProfile(uid, authProfile);
            const lastSynced = await AsyncStorage.getItem('kachingo_last_synced');
            const { data } = await supabase.from('user_data')
              .select('*').eq('user_id', uid).maybeSingle();
            if (!data) return;
            if (lastSynced && new Date(data.updated_at) <= new Date(lastSynced)) return;
            if (data.transactions?.length) setTransactions(processAutoDebits(data.transactions));
            if (data.budget && Object.keys(data.budget).length > 0) setBudget(data.budget);
            if (data.custom_categories?.length) setCustomCategories(data.custom_categories);
            setDisabledCategories(data.disabled_categories ?? []);
            if (data.dark_mode != null) { setDarkMode(data.dark_mode); setDarkModeManuallySet(true); }
            setHasCompletedOnboarding(data.has_completed_onboarding ?? false);
            if (data.analytics_consent !== null && data.analytics_consent !== undefined) {
              setAnalyticsConsent(data.analytics_consent);
            }
            await AsyncStorage.setItem('kachingo_last_synced', data.updated_at);
          })();
        }
      } else {
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
        setTransactions([]);
        setBudget(DEFAULT_BUDGET);
        setUserProfile(DEFAULT_PROFILE);
        profileOverridesRef.current = {};
        setProfileOverrides({});
        setCustomCategories([]);
        setDisabledCategories([]);
        userIdRef.current = null;
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const save = async () => {
      if (!hasLoadedStorage) return;
      const blob = {
        transactions, userProfile, budget,
        dark_mode: darkMode, darkModeManuallySet,
        hasCompletedOnboarding, customCategories, disabledCategories, analyticsConsent, profileOverrides,
        languageManuallySelected,
        langMigratedV1: true,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(blob));

      const uid = userIdRef.current;
      if (!uid) return;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      // Debounce cloud sync so rapid state changes don't fire many requests
      syncTimerRef.current = setTimeout(async () => {
        if (userIdRef.current !== uid) return;
        await supabase.from('profiles').upsert({
          id: uid,
          email: blob.userProfile.email,
          name: blob.userProfile.name,
          avatar: blob.userProfile.avatar,
          plan: blob.userProfile.plan,
          currency: blob.userProfile.currency ?? DEFAULT_PROFILE.currency,
          language: blob.userProfile.language ?? DEFAULT_PROFILE.language,
        }, { onConflict: 'id' });
        await supabase.from('user_data').upsert({
          user_id: uid,
          transactions: blob.transactions,
          budget: blob.budget,
          custom_categories: blob.customCategories,
          disabled_categories: blob.disabledCategories,
          dark_mode: blob.dark_mode,
          has_completed_onboarding: blob.hasCompletedOnboarding,
          analytics_consent: blob.analyticsConsent ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        await AsyncStorage.setItem('kachingo_last_synced', new Date().toISOString());
      }, 2000);
    };
    save();
  }, [transactions, userProfile, darkMode, darkModeManuallySet, budget, hasCompletedOnboarding, customCategories, disabledCategories, analyticsConsent, profileOverrides, languageManuallySelected, hasLoadedStorage]);

  // Follow system colour scheme in real time unless the user has manually set a preference.
  useEffect(() => {
    if (!darkModeManuallySet) setDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme, darkModeManuallySet]);

  const expenseCategories = useMemo<Category[]>(() => [
    ...EXPENSE_CATEGORIES.filter(c => !disabledCategories.includes(c.id)),
    ...customCategories.filter(c => c.type === 'expense'),
  ], [disabledCategories, customCategories]);

  const incomeCategories = useMemo<Category[]>(() => [
    ...INCOME_CATEGORIES.filter(c => !disabledCategories.includes(c.id)),
    ...customCategories.filter(c => c.type === 'income'),
  ], [disabledCategories, customCategories]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const baseId = Date.now().toString();
    const transactionsToAdd: Transaction[] = [{ ...t, id: baseId }];

    if (t.isAutoDebit && t.autoDebitPeriod) {
      const baseDate = new Date(t.date);
      const periods = 12;
      for (let i = 1; i <= periods; i++) {
        const newDate = new Date(baseDate);
        switch (t.autoDebitPeriod) {
          case 'daily': newDate.setDate(baseDate.getDate() + i); break;
          case 'weekly': newDate.setDate(baseDate.getDate() + i * 7); break;
          case 'biweekly': newDate.setDate(baseDate.getDate() + i * 14); break;
          case 'monthly': newDate.setMonth(baseDate.getMonth() + i); break;
          case 'yearly': newDate.setFullYear(baseDate.getFullYear() + i); break;
        }
        transactionsToAdd.push({ ...t, id: `${baseId}_auto_${i}`, date: newDate.toISOString() });
      }
    }

    setTransactions(prev => [...transactionsToAdd, ...prev]);
    trackEvent('transaction_added', {
      type: t.type,
      category: t.category,
      is_auto_debit: t.isAutoDebit ?? false,
    });
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id);
      if (tx?.isAutoDebit) {
        const baseId = id.includes('_auto_') ? id.split('_auto_')[0] : id;
        return prev.filter(t => t.id !== baseId && !t.id.startsWith(`${baseId}_auto_`));
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const updateTransaction = useCallback((id: string, data: Omit<Transaction, 'id'>) => {
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id);
      if (tx?.isAutoDebit && data.isAutoDebit) {
        const baseId = id.includes('_auto_') ? id.split('_auto_')[0] : id;
        return prev.map(t => {
          if (t.id === baseId) return { ...data, id: baseId };
          if (t.id.startsWith(`${baseId}_auto_`)) return { ...data, id: t.id, date: t.date };
          return t;
        });
      }
      return prev.map(t => t.id === id ? { ...data, id } : t);
    });
  }, []);

  const updateUserProfile = useCallback((p: Partial<UserProfile>) => {
    const nextOverrides: ProfileOverrides = {};
    if (Object.prototype.hasOwnProperty.call(p, 'name')) nextOverrides.name = true;
    if (Object.prototype.hasOwnProperty.call(p, 'avatar')) nextOverrides.avatar = true;
    if (Object.prototype.hasOwnProperty.call(p, 'language')) setLanguageManuallySelected(true);
    if (nextOverrides.name || nextOverrides.avatar) {
      setProfileOverrides(prev => {
        const next = { ...prev, ...nextOverrides };
        profileOverridesRef.current = next;
        return next;
      });
    }
    setUserProfile(prev => ({ ...prev, ...p }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkModeManuallySet(true);
    setDarkMode(prev => !prev);
  }, []);

  const updateBudget = useCallback((b: BudgetSettings) => {
    setBudget(b);
  }, []);

  const getMonthTransactions = useCallback((year: number, month: number) => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [transactions]);

  const getMonthIncome = useCallback((year: number, month: number) => {
    return getMonthTransactions(year, month)
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [getMonthTransactions]);

  const getMonthExpenses = useCallback((year: number, month: number) => {
    return getMonthTransactions(year, month)
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [getMonthTransactions]);

  const formatCurrency = useCallback((amount: number) => {
    const code = userProfile.currency || 'USD';
    const hasCents = Math.round(Math.abs(amount) * 100) !== Math.round(Math.abs(amount)) * 100;
    try {
      const s = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2,
      }).format(amount);
      return code === 'CNY' ? s.replace('CN¥', '¥') : s;
    } catch {
      const fallback = amount.toLocaleString(undefined, {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2,
      });
      return `$${fallback}`;
    }
  }, [userProfile.currency]);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEY, 'kachingo_last_synced', 'kachingo_pending_receipt']);
    await supabase.auth.signOut();
    resetAnalytics();
  }, []);

  const deleteAccount = useCallback(async () => {
    const uid = userIdRef.current;
    if (uid) {
      await supabase.from('user_data').delete().eq('user_id', uid);
      await supabase.from('profiles').delete().eq('id', uid);
    }
    await AsyncStorage.multiRemove([STORAGE_KEY, 'kachingo_last_synced', 'kachingo_pending_receipt']);
    await supabase.auth.signOut();
    resetAnalytics();
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    // sign_up_completed is tracked after consent is granted via grantAnalyticsConsent
  }, []);

  const getCurrencySymbol = useCallback(() => {
    const code = userProfile.currency || 'USD';
    if (code === 'CNY') return '¥';
    try {
      const s = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 0,
      }).format(0).replace(/[\d,.\s]/g, '').trim();
      return s || code;
    } catch {
      return '$';
    }
  }, [userProfile.currency]);

  const addCustomCategory = useCallback((cat: Omit<CustomCategory, 'id'>) => {
    const newCat: CustomCategory = { ...cat, id: `custom_${Date.now()}` };
    setCustomCategories(prev => [...prev, newCat]);
    return newCat;
  }, []);

  const updateCustomCategory = useCallback((id: string, data: Partial<Omit<CustomCategory, 'id'>>) => {
    setCustomCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const removeCustomCategory = useCallback((id: string) => {
    setCustomCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleCategoryEnabled = useCallback((id: string) => {
    setDisabledCategories(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  }, []);

  const stopAutoDebit = useCallback((id: string) => {
    setTransactions(prev => {
      const baseId = id.includes('_auto_') ? id.split('_auto_')[0] : id;
      const now = new Date();
      return prev
        .filter(t => !t.id.startsWith(`${baseId}_auto_`) || new Date(t.date) <= now)
        .map(t => t.id === baseId ? { ...t, isAutoDebit: false } : t);
    });
  }, []);

  const endAutoDebitAt = useCallback((id: string) => {
    setTransactions(prev => {
      const tx = prev.find(t => t.id === id);
      if (!tx) return prev;
      const cutoff = new Date(tx.date);
      const baseId = id.includes('_auto_') ? id.split('_auto_')[0] : id;
      return prev
        .filter(t => !t.id.startsWith(`${baseId}_auto_`) || new Date(t.date) <= cutoff)
        .map(t => t.id === baseId ? { ...t, isAutoDebit: false } : t);
    });
  }, []);

  const restartAutoDebit = useCallback((templateId: string) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === templateId ? { ...t, isAutoDebit: true } : t);
      return processAutoDebits(updated);
    });
  }, []);

  const addCustomGoal = useCallback((goal: Omit<CustomGoal, 'id'>) => {
    const newGoal: CustomGoal = { ...goal, id: `goal_${Date.now()}` };
    setBudget(prev => ({ ...prev, customGoals: [...(prev.customGoals ?? []), newGoal] }));
  }, []);

  const updateCustomGoal = useCallback((id: string, data: Partial<Omit<CustomGoal, 'id'>>) => {
    setBudget(prev => ({
      ...prev,
      customGoals: (prev.customGoals ?? []).map(g => g.id === id ? { ...g, ...data } : g),
    }));
  }, []);

  const removeCustomGoal = useCallback((id: string) => {
    setBudget(prev => ({
      ...prev,
      customGoals: (prev.customGoals ?? []).filter(g => g.id !== id),
    }));
  }, []);

  const grantAnalyticsConsent = useCallback(() => {
    setAnalyticsConsent(true);
    initMixpanel().then(() => {
      identifyUser(userProfile);
      trackEvent('sign_up_completed', {
        plan: userProfile.plan,
        currency: userProfile.currency || DEFAULT_PROFILE.currency || 'USD',
      });
    });
  }, [userProfile]);

  const denyAnalyticsConsent = useCallback(() => {
    setAnalyticsConsent(false);
  }, []);

  return (
    <AppContext.Provider value={{
      transactions,
      userProfile,
      darkMode,
      budget,
      isAuthenticated,
      isAuthInitialized,
      hasCompletedOnboarding,
      customCategories,
      disabledCategories,
      expenseCategories,
      incomeCategories,
      addTransaction,
      removeTransaction,
      updateTransaction,
      updateUserProfile,
      toggleDarkMode,
      updateBudget,
      getMonthTransactions,
      getMonthIncome,
      getMonthExpenses,
      formatCurrency,
      getCurrencySymbol,
      signOut,
      deleteAccount,
      completeOnboarding,
      addCustomCategory,
      updateCustomCategory,
      removeCustomCategory,
      toggleCategoryEnabled,
      stopAutoDebit,
      endAutoDebitAt,
      restartAutoDebit,
      addCustomGoal,
      updateCustomGoal,
      removeCustomGoal,
      analyticsConsent,
      grantAnalyticsConsent,
      denyAnalyticsConsent,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
