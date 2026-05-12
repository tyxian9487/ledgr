import { useState, useRef } from 'react';
import {
  Moon, Sun, ChevronRight, Camera, Bell, Lock, HelpCircle,
  FileText, LogOut, Star, Trash2, Edit3, TrendingUp, TrendingDown,
  ChevronDown, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - score / 100);
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg width={144} height={144} viewBox="0 0 144 144" className="-rotate-90">
        <circle cx={72} cy={72} r={r} fill="none" stroke="currentColor" strokeWidth={10} className="text-gray-100 dark:text-gray-800" />
        <circle
          cx={72} cy={72} r={r}
          fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Score</span>
      </div>
    </div>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, onClick, danger }: SettingsRowProps) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
        <span className={danger ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}>{icon}</span>
      </div>
      <span className={`flex-1 text-sm font-medium text-left ${danger ? 'text-red-500' : 'dark:text-white'}`}>{label}</span>
      {value && <span className="text-xs text-gray-400">{value}</span>}
      {!danger && <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />}
    </button>
  );
}

const FAQ_ITEMS = [
  {
    q: 'How do I add a transaction?',
    a: 'Tap "Add Transaction" on the home screen. Fill in the amount, category, and date, then tap "Confirm Transaction".',
  },
  {
    q: 'What is Auto Debit?',
    a: 'Auto Debit marks a transaction as recurring. You can set a period (daily, weekly, monthly, etc.) to track regular bills and income.',
  },
  {
    q: 'How is my Financial Score calculated?',
    a: 'Your score is based on the ratio of your expenses to income. A lower expense-to-income ratio earns a higher score (max 100).',
  },
  {
    q: 'Is my data stored securely?',
    a: 'All your data is stored locally on your device. We do not upload your financial information to any server.',
  },
  {
    q: 'How do I capture a receipt?',
    a: 'Tap the camera icon in the bottom navigation. Take or upload a photo and the app will auto-fill transaction details from the receipt.',
  },
  {
    q: 'Can I export my data?',
    a: 'Premium subscribers can export transaction data as CSV or PDF. Upgrade your plan to unlock this feature.',
  },
  {
    q: 'How do I delete a transaction?',
    a: 'On the home screen, find the transaction in its category section and tap the delete (trash) icon next to it.',
  },
  {
    q: 'How do I switch to dark mode?',
    a: 'Go to Profile → Preferences and tap the Dark Mode row to toggle it, or tap the sun/moon icon in the top-right of the Profile screen.',
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const { transactions, userProfile, darkMode, toggleDarkMode, updateUserProfile } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(userProfile.email);
  const [showTerms, setShowTerms] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Notification preferences state
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTransactions, setNotifTransactions] = useState(true);
  const [notifMonthlySummary, setNotifMonthlySummary] = useState(true);
  const [notifAutoDebit, setNotifAutoDebit] = useState(true);
  const [notifBudgetAlerts, setNotifBudgetAlerts] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const yearTxs = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
  const yearIncome = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const yearExpenses = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const monthsWithData = new Set(transactions.map(t => {
    const d = new Date(t.date);
    return `${d.getFullYear()}-${d.getMonth()}`;
  })).size || 1;
  const avgIncome = yearIncome / Math.max(monthsWithData, 1);
  const avgExpenses = yearExpenses / Math.max(monthsWithData, 1);

  const score = yearIncome > 0
    ? Math.min(100, Math.max(0, Math.round(100 - (yearExpenses / yearIncome) * 100)))
    : 50;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUserProfile({ avatar: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
      <button
        type="button"
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${value ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${value ? 'left-[26px]' : 'left-0.5'}`} />
      </button>
    );
  }

  return (
    <div className="pb-28 overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold dark:text-white">Profile</h1>
        <button
          type="button"
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        >
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-500" />}
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-3 pb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center overflow-hidden">
            {userProfile.avatar
              ? <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              : <span className="text-white font-black text-3xl">{userProfile.name.charAt(0).toUpperCase()}</span>
            }
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-lg"
          >
            <Camera size={14} className="text-white" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              className="border-b-2 border-green-600 bg-transparent text-center font-bold text-lg dark:text-white outline-none w-40"
              autoFocus
              onBlur={() => { updateUserProfile({ name: nameInput }); setEditingName(false); }}
              onKeyDown={e => e.key === 'Enter' && (updateUserProfile({ name: nameInput }), setEditingName(false))}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setEditingName(true)} className="flex items-center gap-1.5">
            <span className="text-lg font-bold dark:text-white">{userProfile.name}</span>
            <Edit3 size={14} className="text-gray-400" />
          </button>
        )}

        <span className="text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold capitalize">
          {userProfile.plan} plan
        </span>
      </div>

      {/* Financial Assessment */}
      <div className="mx-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Financial Assessment</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-900/30">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-[11px] text-green-600 font-semibold uppercase tracking-wide">Income</span>
            </div>
            <p className="text-xl font-black text-green-700 dark:text-green-400">${yearIncome.toLocaleString()}</p>
            <p className="text-[11px] text-green-600/70 mt-0.5">This year</p>
            <p className="text-[11px] text-green-600 mt-1 font-medium">~${Math.round(avgIncome).toLocaleString()}/mo avg</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={14} className="text-red-500" />
              <span className="text-[11px] text-red-500 font-semibold uppercase tracking-wide">Expenses</span>
            </div>
            <p className="text-xl font-black text-red-600 dark:text-red-400">${yearExpenses.toLocaleString()}</p>
            <p className="text-[11px] text-red-500/70 mt-0.5">This year</p>
            <p className="text-[11px] text-red-500 mt-1 font-medium">~${Math.round(avgExpenses).toLocaleString()}/mo avg</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 flex flex-col items-center gap-3 shadow-sm border border-gray-50 dark:border-gray-800">
          <ScoreRing score={score} />
          <div className="text-center">
            <p className="font-bold text-base dark:text-white">
              {score >= 80 ? 'Excellent Financial Health' : score >= 60 ? 'Fair Financial Health' : 'Needs Improvement'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {score >= 80
                ? 'You\'re saving a healthy portion of your income.'
                : score >= 60
                ? 'You\'re managing well but there\'s room to improve.'
                : 'Your expenses are high relative to income.'}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">80–100</p>
              <p className="text-[10px] font-medium text-green-600">Excellent</p>
            </div>
            <div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">60–79</p>
              <p className="text-[10px] font-medium text-yellow-600">Fair</p>
            </div>
            <div>
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">0–59</p>
              <p className="text-[10px] font-medium text-red-500">Critical</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="mx-4 space-y-3 mb-4">
        {/* Account */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-4 pt-3 pb-1">Account</p>
          <div>
            {editingEmail ? (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Edit3 size={16} className="text-gray-500" />
                </div>
                <input
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="flex-1 text-sm bg-transparent border-b border-green-600 dark:text-white outline-none"
                  autoFocus
                  onBlur={() => { updateUserProfile({ email: emailInput }); setEditingEmail(false); }}
                  onKeyDown={e => e.key === 'Enter' && (updateUserProfile({ email: emailInput }), setEditingEmail(false))}
                />
              </div>
            ) : (
              <SettingsRow icon={<Edit3 size={16} />} label="Email" value={userProfile.email} onClick={() => setEditingEmail(true)} />
            )}
            <SettingsRow
              icon={<Star size={16} />}
              label="Subscription Plan"
              value={userProfile.plan === 'free' ? 'Free' : 'Premium'}
              onClick={() => navigate('/subscription')}
            />
            <SettingsRow icon={<Lock size={16} />} label="Change Password" />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-4 pt-3 pb-1">Preferences</p>
          <SettingsRow icon={<Bell size={16} />} label="Notifications" onClick={() => setShowNotifications(true)} />
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {darkMode ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-yellow-500" />}
            </div>
            <span className="flex-1 text-sm font-medium dark:text-white">Dark Mode</span>
            <div
              className={`w-12 h-6 rounded-full transition-colors duration-200 relative pointer-events-none flex-shrink-0 ${darkMode ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${darkMode ? 'left-[26px]' : 'left-0.5'}`} />
            </div>
          </button>
        </div>

        {/* Legal */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-4 pt-3 pb-1">Legal & Support</p>
          <SettingsRow icon={<FileText size={16} />} label="Terms & Conditions" onClick={() => setShowTerms(true)} />
          <SettingsRow icon={<HelpCircle size={16} />} label="Help & FAQ" onClick={() => setShowFAQ(true)} />
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <SettingsRow icon={<Trash2 size={16} />} label="Clear All Data" danger onClick={() => {
            if (window.confirm('Clear all transaction data? This cannot be undone.')) {
              localStorage.clear();
              window.location.reload();
            }
          }} />
          <SettingsRow icon={<LogOut size={16} />} label="Sign Out" danger />
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-300 dark:text-gray-700 pb-4">ledgr v1.0.0</p>

      {/* ── Terms modal ── */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowTerms(false)}>
          <div
            className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-shrink-0 px-6 pt-6 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold dark:text-white">Terms & Conditions</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
                <p><strong>1. Acceptance of Terms</strong><br />By using ledgr, you agree to these terms and conditions.</p>
                <p><strong>2. Data Storage</strong><br />All financial data is stored locally on your device. We do not transmit your personal financial information to our servers.</p>
                <p><strong>3. Privacy</strong><br />Your privacy is important to us. We collect minimal data necessary for app functionality.</p>
                <p><strong>4. AI Receipt Capture</strong><br />The AI receipt scanning feature is provided as-is. Always verify captured data before confirming.</p>
                <p><strong>5. Financial Advice Disclaimer</strong><br />ledgr is a tracking tool only. It does not provide financial advice. Consult a qualified financial advisor for personal finance decisions.</p>
                <p><strong>6. Limitation of Liability</strong><br />We are not liable for any financial decisions made based on information displayed in the app.</p>
                <p><strong>7. Updates</strong><br />We reserve the right to update these terms at any time.</p>
              </div>
            </div>
            <div className="flex-shrink-0 px-6 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setShowTerms(false)} className="w-full py-3 rounded-2xl bg-green-600 text-white font-bold">
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications modal ── */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowNotifications(false)}>
          <div
            className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold dark:text-white">Notifications</h2>
              <button type="button" onClick={() => setShowNotifications(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-2">
              {/* Master toggle */}
              <div className={`rounded-2xl p-4 border-2 transition-colors ${notifEnabled ? 'border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold dark:text-white">Enable Notifications</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Turn all notifications on or off</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifEnabled(!notifEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${notifEnabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${notifEnabled ? 'left-[26px]' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Individual toggles */}
              {[
                { label: 'Transaction Reminders', sub: 'Remind me to log daily transactions', value: notifTransactions, set: setNotifTransactions },
                { label: 'Monthly Summary', sub: 'Get a summary at the end of each month', value: notifMonthlySummary, set: setNotifMonthlySummary },
                { label: 'Auto Debit Alerts', sub: 'Notify before a recurring payment is due', value: notifAutoDebit, set: setNotifAutoDebit },
                { label: 'Budget Alerts', sub: 'Alert when spending exceeds your goal', value: notifBudgetAlerts, set: setNotifBudgetAlerts },
              ].map(item => (
                <div
                  key={item.label}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 transition-opacity ${notifEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium dark:text-white">{item.label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.set(!item.value)}
                      className={`w-12 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${item.value ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${item.value ? 'left-[26px]' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 px-6 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setShowNotifications(false)} className="w-full py-3 rounded-2xl bg-green-600 text-white font-bold">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Help & FAQ modal ── */}
      {showFAQ && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowFAQ(false)}>
          <div
            className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold dark:text-white">Help & FAQ</h2>
                <p className="text-xs text-gray-400">Tap a question to expand</p>
              </div>
              <button type="button" onClick={() => setShowFAQ(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-medium dark:text-white flex-1 pr-3">{item.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedFAQ === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedFAQ === i && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 px-6 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setShowFAQ(false)} className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
