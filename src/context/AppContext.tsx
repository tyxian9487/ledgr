import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, UserProfile, BudgetSettings } from '../types';

interface AppContextType {
  transactions: Transaction[];
  userProfile: UserProfile;
  darkMode: boolean;
  budget: BudgetSettings;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, data: Omit<Transaction, 'id'>) => void;
  updateUserProfile: (p: Partial<UserProfile>) => void;
  toggleDarkMode: () => void;
  updateBudget: (b: BudgetSettings) => void;
  getMonthTransactions: (year: number, month: number) => Transaction[];
  getMonthIncome: (year: number, month: number) => number;
  getMonthExpenses: (year: number, month: number) => number;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'expensewise_data';

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  email: 'user@example.com',
  avatar: null,
  plan: 'free',
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTransactions(data.transactions || generateSampleData());
        setUserProfile(data.userProfile || DEFAULT_PROFILE);
        setDarkMode(data.darkMode || false);
        setBudget(data.budget || DEFAULT_BUDGET);
      } else {
        setTransactions(generateSampleData());
      }
    } catch {
      setTransactions(generateSampleData());
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, userProfile, darkMode, budget }));
  }, [transactions, userProfile, darkMode, budget]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const transactionsToAdd: Transaction[] = [];
    const baseId = Date.now().toString();
    
    // Add the original transaction
    transactionsToAdd.push({ ...t, id: baseId });
    
    // If auto debit is enabled, create recurring transactions
    if (t.isAutoDebit && t.autoDebitPeriod) {
      const baseDate = new Date(t.date);
      const periods = 12; // Create transactions for next 12 periods
      
      for (let i = 1; i <= periods; i++) {
        const newDate = new Date(baseDate);
        
        switch (t.autoDebitPeriod) {
          case 'daily':
            newDate.setDate(baseDate.getDate() + i);
            break;
          case 'weekly':
            newDate.setDate(baseDate.getDate() + i * 7);
            break;
          case 'biweekly':
            newDate.setDate(baseDate.getDate() + i * 14);
            break;
          case 'monthly':
            newDate.setMonth(baseDate.getMonth() + i);
            break;
          case 'yearly':
            newDate.setFullYear(baseDate.getFullYear() + i);
            break;
        }
        
        transactionsToAdd.push({
          ...t,
          id: `${baseId}_${i}`,
          date: newDate.toISOString(),
        });
      }
    }
    
    setTransactions(prev => [...transactionsToAdd, ...prev]);
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const transactionToRemove = prev.find(t => t.id === id);
      if (transactionToRemove?.isAutoDebit) {
        // Remove all transactions with the same base ID
        const baseId = id.split('_')[0];
        return prev.filter(t => !t.id.startsWith(baseId));
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const updateTransaction = useCallback((id: string, data: Omit<Transaction, 'id'>) => {
    setTransactions(prev => {
      const transactionToUpdate = prev.find(t => t.id === id);
      if (transactionToUpdate?.isAutoDebit && data.isAutoDebit) {
        // Update all transactions with the same base ID
        const baseId = id.split('_')[0];
        return prev.map(t => {
          if (t.id.startsWith(baseId)) {
            // For recurring transactions, only update certain fields, keep original date
            if (t.id !== baseId) {
              return {
                ...data,
                id: t.id,
                date: t.date, // Keep original date for recurring transactions
              };
            }
            return { ...data, id };
          }
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

  return (
    <AppContext.Provider value={{
      transactions,
      userProfile,
      darkMode,
      budget,
      addTransaction,
      removeTransaction,
      updateTransaction,
      updateUserProfile,
      toggleDarkMode,
      updateBudget,
      getMonthTransactions,
      getMonthIncome,
      getMonthExpenses,
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
