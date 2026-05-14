export type TransactionType = 'expense' | 'income';

export type AutoDebitPeriod = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type FinancialStatus = 'excellent' | 'sustained' | 'critical';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  isAutoDebit: boolean;
  autoDebitPeriod?: AutoDebitPeriod;
  receiptImage?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
  plan: 'free' | 'premium';
  currency?: string;
}

export const CURRENCIES: { code: string; name: string }[] = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'TWD', name: 'New Taiwan Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'BND', name: 'Brunei Dollar' },
  { code: 'MMK', name: 'Myanmar Kyat' },
  { code: 'KHR', name: 'Cambodian Riel' },
  { code: 'LAK', name: 'Lao Kip' },
  { code: 'MNT', name: 'Mongolian Tugrik' },
  { code: 'NPR', name: 'Nepalese Rupee' },
  { code: 'LKR', name: 'Sri Lankan Rupee' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'AFN', name: 'Afghan Afghani' },
  { code: 'BTN', name: 'Bhutanese Ngultrum' },
  { code: 'MVR', name: 'Maldivian Rufiyaa' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'BHD', name: 'Bahraini Dinar' },
  { code: 'OMR', name: 'Omani Rial' },
  { code: 'JOD', name: 'Jordanian Dinar' },
  { code: 'ILS', name: 'Israeli New Shekel' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'IRR', name: 'Iranian Rial' },
  { code: 'IQD', name: 'Iraqi Dinar' },
  { code: 'LBP', name: 'Lebanese Pound' },
  { code: 'YER', name: 'Yemeni Rial' },
  { code: 'UAH', name: 'Ukrainian Hryvnia' },
  { code: 'RUB', name: 'Russian Ruble' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'RSD', name: 'Serbian Dinar' },
  { code: 'HRK', name: 'Croatian Kuna' },
  { code: 'ISK', name: 'Icelandic Krona' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'ALL', name: 'Albanian Lek' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark' },
  { code: 'MKD', name: 'Macedonian Denar' },
  { code: 'MDL', name: 'Moldovan Leu' },
  { code: 'BYN', name: 'Belarusian Ruble' },
  { code: 'GEL', name: 'Georgian Lari' },
  { code: 'AMD', name: 'Armenian Dram' },
  { code: 'AZN', name: 'Azerbaijani Manat' },
  { code: 'KZT', name: 'Kazakhstani Tenge' },
  { code: 'UZS', name: 'Uzbekistani Som' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'PEN', name: 'Peruvian Sol' },
  { code: 'UYU', name: 'Uruguayan Peso' },
  { code: 'BOB', name: 'Bolivian Boliviano' },
  { code: 'PYG', name: 'Paraguayan Guarani' },
  { code: 'GTQ', name: 'Guatemalan Quetzal' },
  { code: 'HNL', name: 'Honduran Lempira' },
  { code: 'NIO', name: 'Nicaraguan Cordoba' },
  { code: 'CRC', name: 'Costa Rican Colon' },
  { code: 'DOP', name: 'Dominican Peso' },
  { code: 'JMD', name: 'Jamaican Dollar' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar' },
  { code: 'BBD', name: 'Barbadian Dollar' },
  { code: 'BSD', name: 'Bahamian Dollar' },
  { code: 'BZD', name: 'Belize Dollar' },
  { code: 'GYD', name: 'Guyanese Dollar' },
  { code: 'SRD', name: 'Surinamese Dollar' },
  { code: 'XCD', name: 'East Caribbean Dollar' },
  { code: 'CUP', name: 'Cuban Peso' },
  { code: 'HTG', name: 'Haitian Gourde' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'UGX', name: 'Ugandan Shilling' },
  { code: 'ETB', name: 'Ethiopian Birr' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'TND', name: 'Tunisian Dinar' },
  { code: 'DZD', name: 'Algerian Dinar' },
  { code: 'LYD', name: 'Libyan Dinar' },
  { code: 'SDG', name: 'Sudanese Pound' },
  { code: 'MZN', name: 'Mozambican Metical' },
  { code: 'ZMW', name: 'Zambian Kwacha' },
  { code: 'BWP', name: 'Botswanan Pula' },
  { code: 'NAD', name: 'Namibian Dollar' },
  { code: 'RWF', name: 'Rwandan Franc' },
  { code: 'BIF', name: 'Burundian Franc' },
  { code: 'SOS', name: 'Somali Shilling' },
  { code: 'DJF', name: 'Djiboutian Franc' },
  { code: 'ERN', name: 'Eritrean Nakfa' },
  { code: 'GMD', name: 'Gambian Dalasi' },
  { code: 'GNF', name: 'Guinean Franc' },
  { code: 'SLL', name: 'Sierra Leonean Leone' },
  { code: 'LRD', name: 'Liberian Dollar' },
  { code: 'CVE', name: 'Cape Verdean Escudo' },
  { code: 'AOA', name: 'Angolan Kwanza' },
  { code: 'CDF', name: 'Congolese Franc' },
  { code: 'XOF', name: 'West African CFA Franc' },
  { code: 'XAF', name: 'Central African CFA Franc' },
  { code: 'XPF', name: 'CFP Franc' },
  { code: 'MRU', name: 'Mauritanian Ouguiya' },
  { code: 'MUR', name: 'Mauritian Rupee' },
  { code: 'SCR', name: 'Seychellois Rupee' },
  { code: 'MOP', name: 'Macanese Pataca' },
  { code: 'FJD', name: 'Fijian Dollar' },
  { code: 'PGK', name: 'Papua New Guinean Kina' },
  { code: 'SBD', name: 'Solomon Islands Dollar' },
  { code: 'TOP', name: 'Tongan Pa\'anga' },
  { code: 'WST', name: 'Samoan Tala' },
  { code: 'VUV', name: 'Vanuatu Vatu' },
  { code: 'ZWL', name: 'Zimbabwean Dollar' },
  { code: 'SZL', name: 'Swazi Lilangeni' },
  { code: 'LSL', name: 'Lesotho Loti' },
  { code: 'MWK', name: 'Malawian Kwacha' },
  { code: 'SSP', name: 'South Sudanese Pound' },
];

export interface BudgetAllocation {
  categoryId: string;
  label: string;
  color: string;
  percentage: number;
}

export interface BudgetSettings {
  expectedIncome: number;
  allocations: BudgetAllocation[];
  incomeFixed?: boolean;
  savingsGoal?: {
    enabled: boolean;
    amount: number;
    mode: 'pct' | 'fixed';
  };
  investmentGoal?: {
    enabled: boolean;
    amount: number;
    mode: 'pct' | 'fixed';
  };
}

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', icon: 'UtensilsCrossed', color: '#f97316' },
  { id: 'transport', label: 'Transportation', icon: 'Car', color: '#3b82f6' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'entertainment', label: 'Entertainment', icon: 'Tv', color: '#8b5cf6' },
  { id: 'health', label: 'Health & Medical', icon: 'Heart', color: '#ef4444' },
  { id: 'housing', label: 'Housing & Rent', icon: 'Home', color: '#14b8a6' },
  { id: 'utilities', label: 'Utilities', icon: 'Zap', color: '#eab308' },
  { id: 'education', label: 'Education', icon: 'GraduationCap', color: '#06b6d4' },
  { id: 'travel', label: 'Travel', icon: 'Plane', color: '#f43f5e' },
  { id: 'personal', label: 'Personal Care', icon: 'Sparkles', color: '#a855f7' },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'RefreshCw', color: '#64748b' },
  { id: 'insurance', label: 'Insurance', icon: 'Shield', color: '#0ea5e9' },
  { id: 'savings', label: 'Savings', icon: 'PiggyBank', color: '#22c55e' },
  { id: 'investment', label: 'Investment', icon: 'TrendingUp', color: '#15803d' },
  { id: 'others', label: 'Others', icon: 'MoreHorizontal', color: '#94a3b8' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salary', icon: 'Briefcase', color: '#22c55e' },
  { id: 'freelance', label: 'Freelance', icon: 'Laptop', color: '#16a34a' },
  { id: 'investment', label: 'Investment', icon: 'TrendingUp', color: '#15803d' },
  { id: 'business', label: 'Business', icon: 'Building2', color: '#166534' },
  { id: 'gift', label: 'Gift', icon: 'Gift', color: '#4ade80' },
  { id: 'other_income', label: 'Other Income', icon: 'Plus', color: '#86efac' },
];
