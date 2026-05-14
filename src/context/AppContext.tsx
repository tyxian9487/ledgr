import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, UserProfile, BudgetSettings, AutoDebitPeriod } from '../types';

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

interface AppContextType {
  transactions: Transaction[];
  userProfile: UserProfile;
  darkMode: boolean;
  budget: BudgetSettings;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
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
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'expensewise_data';

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  email: 'user@example.com',
  avatar: null,
  plan: 'free',
  currency: 'USD',
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTransactions(processAutoDebits(data.transactions || generateSampleData()));
        setUserProfile(data.userProfile || DEFAULT_PROFILE);
        setDarkMode(data.darkMode || false);
        setBudget(data.budget || DEFAULT_BUDGET);
        // Existing users (data pre-dates auth) are treated as signed in
        setIsAuthenticated(data.isAuthenticated ?? true);
        setHasCompletedOnboarding(data.hasCompletedOnboarding ?? true);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, userProfile, darkMode, budget, isAuthenticated, hasCompletedOnboarding }));
  }, [transactions, userProfile, darkMode, budget, isAuthenticated, hasCompletedOnboarding]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newT: Transaction = { ...t, id: Date.now().toString() };
    setTransactions(prev => [newT, ...prev]);
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTransaction = useCallback((id: string, data: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...data, id } : t));
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
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: userProfile.currency || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${Math.round(amount).toLocaleString()}`;
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
    try {
      const s = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: userProfile.currency || 'USD',
        minimumFractionDigits: 0,
      }).format(0).replace(/[\d,.\s]/g, '').trim();
      return s || (userProfile.currency || 'USD');
    } catch {
      return '$';
    }
  }, [userProfile.currency]);

  return (
    <AppContext.Provider value={{
      transactions,
      userProfile,
      darkMode,
      budget,
      isAuthenticated,
      hasCompletedOnboarding,
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
