import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, UserProfile, BudgetSettings, AutoDebitPeriod, CustomCategory, CustomGoal, EXPENSE_CATEGORIES, INCOME_CATEGORIES, LANGUAGES } from '../types';

const SUPPORTED_LANG_CODES = LANGUAGES.map(l => l.code);

function detectDeviceLanguage(): string {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const code = lang.split('-')[0].toLowerCase();
    if (SUPPORTED_LANG_CODES.includes(code)) return code;
  }
  return 'en';
}

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
  signIn: (provider: 'google' | 'apple') => void;
  signOut: () => void;
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
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'expensewise_data';

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  email: 'user@example.com',
  avatar: null,
  plan: 'free',
  currency: 'USD',
  language: detectDeviceLanguage(),
};

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [darkMode, setDarkMode] = useState(false);
  const [budget, setBudget] = useState<BudgetSettings>(DEFAULT_BUDGET);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [disabledCategories, setDisabledCategories] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTransactions(processAutoDebits(data.transactions || generateSampleData()));
        const savedProfile = data.userProfile || DEFAULT_PROFILE;
        if (!savedProfile.language) savedProfile.language = detectDeviceLanguage();
        setUserProfile(savedProfile);
        setDarkMode(data.darkMode || false);
        setBudget(data.budget || DEFAULT_BUDGET);
        setIsAuthenticated(data.isAuthenticated ?? true);
        setHasCompletedOnboarding(data.hasCompletedOnboarding ?? true);
        setCustomCategories(data.customCategories || []);
        setDisabledCategories(data.disabledCategories || []);
      } else {
        setTransactions(processAutoDebits(generateSampleData()));
      }
    } catch {
      setTransactions(processAutoDebits(generateSampleData()));
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      transactions, userProfile, darkMode, budget,
      isAuthenticated, hasCompletedOnboarding,
      customCategories, disabledCategories,
    }));
  }, [transactions, userProfile, darkMode, budget, isAuthenticated, hasCompletedOnboarding, customCategories, disabledCategories]);

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
    setUserProfile(prev => ({ ...prev, ...p }));
  }, []);

  const toggleDarkMode = useCallback(() => {
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

  const signIn = useCallback((_provider: 'google' | 'apple') => {
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
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

  return (
    <AppContext.Provider value={{
      transactions,
      userProfile,
      darkMode,
      budget,
      isAuthenticated,
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
      signIn,
      signOut,
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
