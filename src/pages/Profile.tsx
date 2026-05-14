import { useState, useRef, useMemo } from 'react';
import {
  Moon, Sun, ChevronRight, Camera, Bell, Lock, HelpCircle,
  FileText, LogOut, Star, Trash2, Edit3, TrendingUp, TrendingDown,
  ChevronDown, X, Download, Eye, EyeOff, FileImage, FileType2,
  Globe, Search, Tag, Share2, Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCIES } from '../types';
import LegalSheet from '../components/LegalSheet';
import { computeStreaks, BADGES } from '../utils/achievements';
import CategoryManagerSheet from '../components/CategoryManagerSheet';

const PW_KEY = 'ledgr_password';
const DEFAULT_PW = 'ledgr123';

function getStoredPw() { return localStorage.getItem(PW_KEY) || DEFAULT_PW; }

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - score / 100);
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg width={144} height={144} viewBox="0 0 144 144" className="-rotate-90">
        <circle cx={72} cy={72} r={r} fill="none" stroke="currentColor" strokeWidth={10} className="text-gray-100 dark:text-gray-800" />
        <circle cx={72} cy={72} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Score</span>
      </div>
    </div>
  );
}

interface SettingsRowProps { icon: React.ReactNode; label: string; value?: string; onClick?: () => void; danger?: boolean; }
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
  { q: 'How do I add a transaction?', a: 'Tap "Add Transaction" on the home screen. Fill in the amount, category, and date, then tap "Confirm Transaction".' },
  { q: 'What is Auto Debit?', a: 'Auto Debit marks a transaction as recurring. You can set a period (daily, weekly, monthly, etc.) to track regular bills and income.' },
  { q: 'How is my Financial Score calculated?', a: 'Your score is based on the ratio of your expenses to income. A lower expense-to-income ratio earns a higher score (max 100).' },
  { q: 'Is my data stored securely?', a: 'All your data is stored locally on your device. We do not upload your financial information to any server.' },
  { q: 'How do I capture a receipt?', a: 'Tap the camera icon in the bottom navigation. Take or upload a photo and the app will auto-fill transaction details from the receipt.' },
  { q: 'Can I export my data?', a: 'Premium subscribers can export transaction data as CSV or PDF. Upgrade your plan to unlock this feature.' },
  { q: 'How do I delete a transaction?', a: 'On the home screen, find the transaction in its category section and tap the delete (trash) icon next to it.' },
  { q: 'How do I switch to dark mode?', a: 'Go to Profile → Preferences and tap the Dark Mode row to toggle it, or tap the sun/moon icon in the top-right of the Profile screen.' },
];

function getStreakEmoji(n: number) {
  if (n >= 12) return '💎';
  if (n >= 6) return '⚡';
  if (n >= 1) return '🔥';
  return '🎯';
}
function getStreakLabel(n: number) {
  if (n >= 12) return 'Legendary';
  if (n >= 6) return 'On Fire';
  if (n >= 3) return 'Hot Streak';
  if (n >= 1) return 'Going!';
  return 'Start now';
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function Profile() {
  const navigate = useNavigate();
  const { transactions, userProfile, darkMode, toggleDarkMode, updateUserProfile, getCurrencySymbol, formatCurrency, signOut, budget } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(userProfile.email);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTransactions, setNotifTransactions] = useState(true);
  const [notifMonthlySummary, setNotifMonthlySummary] = useState(true);
  const [notifAutoDebit, setNotifAutoDebit] = useState(true);
  const [notifBudgetAlerts, setNotifBudgetAlerts] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const yearTxs = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
  const yearIncome = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const yearExpenses = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthsWithData = new Set(transactions.map(t => { const d = new Date(t.date); return `${d.getFullYear()}-${d.getMonth()}`; })).size || 1;
  const avgIncome = yearIncome / Math.max(monthsWithData, 1);
  const avgExpenses = yearExpenses / Math.max(monthsWithData, 1);
  const score = yearIncome > 0 ? Math.min(100, Math.max(0, Math.round(100 - (yearExpenses / yearIncome) * 100))) : 50;
  const scoreLabel = score >= 80 ? 'Excellent Financial Health' : score >= 60 ? 'Fair Financial Health' : 'Needs Improvement';
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

  const { current: currentStreak, best: bestStreak } = useMemo(() => computeStreaks(transactions), [transactions]);
  const badgesData = useMemo(
    () => BADGES.map(b => ({ ...b, unlocked: b.check({ transactions, budget, score, bestStreak }) })),
    [transactions, budget, score, bestStreak],
  );
  const unlockedBadges = badgesData.filter(b => b.unlocked).length;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUserProfile({ avatar: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  function handleChangePassword() {
    setPwError('');
    if (currentPw !== getStoredPw()) { setPwError('Current password is incorrect.'); return; }
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('New passwords do not match.'); return; }
    localStorage.setItem(PW_KEY, newPw);
    setPwSuccess(true);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => { setPwSuccess(false); setShowChangePw(false); }, 1800);
  }

  function generateReportPNG() {
    const SCALE = 2, W = 540, PAD = 28;
    const catData: { label: string; amount: number; color: string }[] = [];
    const catTotals: Record<string, number> = {};
    yearTxs.filter(t => t.type === 'expense').forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
    const COLORS: Record<string, string> = { food: '#f97316', transport: '#3b82f6', shopping: '#ec4899', entertainment: '#8b5cf6', health: '#ef4444', housing: '#14b8a6', utilities: '#eab308', education: '#06b6d4', travel: '#f43f5e', personal: '#a855f7', subscriptions: '#64748b', insurance: '#0ea5e9', savings: '#22c55e', others: '#94a3b8' };
    Object.entries(catTotals).sort((a, b) => b[1] - a[1]).forEach(([id, amt]) => { catData.push({ label: id.charAt(0).toUpperCase() + id.slice(1), amount: amt, color: COLORS[id] || '#94a3b8' }); });

    const rowH = 40;
    const H = 120 + 225 + 100 + Math.max(catData.length, 1) * rowH + 120;
    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE; canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    // BG
    ctx.fillStyle = '#f9fafb'; ctx.fillRect(0, 0, W, H);

    // Header bar
    const grad = ctx.createLinearGradient(0, 0, W, 80);
    grad.addColorStop(0, '#16a34a'); grad.addColorStop(1, '#14532d');
    drawRoundRect(ctx, 0, 0, W, 90, 0); ctx.fillStyle = grad; ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 20px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('ledgr', PAD, 36);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '12px -apple-system, sans-serif';
    ctx.fillText('Financial Health Report', PAD, 56);
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), W - PAD, 36);
    ctx.fillText(userProfile.name, W - PAD, 56);

    let y = 110;

    // Score ring
    const cx = W / 2, cy = y + 68;
    const rOuter = 58, rInner = 38;
    ctx.beginPath(); ctx.arc(cx, cy, (rOuter + rInner) / 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = rOuter - rInner; ctx.stroke();
    const start = -Math.PI / 2, end = start + (score / 100) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(cx, cy, (rOuter + rInner) / 2, start, end);
    ctx.strokeStyle = scoreColor; ctx.lineWidth = rOuter - rInner; ctx.lineCap = 'round'; ctx.stroke();
    // Score number centered inside the ring
    ctx.fillStyle = scoreColor; ctx.font = `bold 28px -apple-system, system-ui, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(String(score), cx, cy + 5);
    ctx.fillStyle = '#9ca3af'; ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText('SCORE', cx, cy + 22);
    // Status label placed clearly below the ring (ring bottom = cy + rOuter = cy + 58)
    ctx.fillStyle = '#111827'; ctx.font = 'bold 15px -apple-system, system-ui, sans-serif';
    ctx.fillText(scoreLabel, cx, cy + 82);

    y = cy + 105;

    // Income / Expense boxes
    const boxW = (W - PAD * 2 - 12) / 2;
    drawRoundRect(ctx, PAD, y, boxW, 72, 14);
    ctx.fillStyle = '#f0fdf4'; ctx.fill();
    ctx.fillStyle = '#16a34a'; ctx.font = 'bold 11px -apple-system, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('INCOME THIS YEAR', PAD + 14, y + 22);
    ctx.fillStyle = '#15803d'; ctx.font = 'bold 22px -apple-system, system-ui, sans-serif';
    ctx.fillText(formatCurrency(yearIncome), PAD + 14, y + 52);

    drawRoundRect(ctx, PAD + boxW + 12, y, boxW, 72, 14);
    ctx.fillStyle = '#fef2f2'; ctx.fill();
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 11px -apple-system, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('EXPENSES THIS YEAR', PAD + boxW + 26, y + 22);
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 22px -apple-system, system-ui, sans-serif';
    ctx.fillText(formatCurrency(yearExpenses), PAD + boxW + 26, y + 52);

    y += 90;

    // Savings box
    const savings = yearIncome - yearExpenses;
    drawRoundRect(ctx, PAD, y, W - PAD * 2, 50, 14);
    ctx.fillStyle = savings >= 0 ? '#f0fdf4' : '#fef2f2'; ctx.fill();
    ctx.fillStyle = '#6b7280'; ctx.font = 'bold 11px -apple-system, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('NET SAVINGS', PAD + 14, y + 20);
    ctx.fillStyle = savings >= 0 ? '#16a34a' : '#dc2626'; ctx.font = 'bold 18px -apple-system, system-ui, sans-serif';
    ctx.fillText(`${savings >= 0 ? '+' : ''}${formatCurrency(savings)}`, PAD + 14, y + 42);
    ctx.textAlign = 'right'; ctx.fillStyle = '#9ca3af'; ctx.font = '11px -apple-system, sans-serif';
    ctx.fillText(`Avg income: ${formatCurrency(avgIncome)}/mo  ·  Avg expenses: ${formatCurrency(avgExpenses)}/mo`, W - PAD, y + 42);

    y += 68;

    // Category breakdown title
    ctx.fillStyle = '#6b7280'; ctx.font = 'bold 11px -apple-system, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('EXPENSE BREAKDOWN', PAD, y + 14);
    y += 26;

    if (catData.length === 0) {
      ctx.fillStyle = '#9ca3af'; ctx.font = '13px -apple-system, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('No expense data for this year', W / 2, y + 20);
      y += 40;
    } else {
      const maxAmt = catData[0].amount;
      catData.forEach(cat => {
        const barW = Math.max(4, ((cat.amount / maxAmt) * (W - PAD * 2 - 90)));
        ctx.fillStyle = '#f9fafb';
        drawRoundRect(ctx, PAD, y, W - PAD * 2, rowH - 6, 10); ctx.fill();
        ctx.fillStyle = cat.color + '30';
        drawRoundRect(ctx, PAD, y, barW + 90, rowH - 6, 10); ctx.fill();
        ctx.fillStyle = cat.color; ctx.font = 'bold 12px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(cat.label, PAD + 10, y + (rowH - 6) / 2 + 4);
        ctx.fillStyle = '#111827'; ctx.font = 'bold 13px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(cat.amount), W - PAD - 8, y + (rowH - 6) / 2 + 4);
        y += rowH;
      });
    }

    // Footer
    y += 10;
    ctx.fillStyle = '#d1d5db'; ctx.fillRect(PAD, y, W - PAD * 2, 1);
    y += 16;
    ctx.fillStyle = '#9ca3af'; ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`Generated by ledgr · ${new Date().toLocaleDateString()}`, W / 2, y);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `ledgr-report-${currentYear}.png`;
    a.href = dataUrl; a.click();
    setShowReport(false);
  }

  function generateReportPDF() {
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const catTotals: Record<string, number> = {};
    yearTxs.filter(t => t.type === 'expense').forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
    const catRows = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
      .map(([id, amt]) => `<tr><td style="padding:6px 12px;font-size:13px;text-transform:capitalize">${id}</td><td style="padding:6px 12px;font-size:13px;text-align:right;font-weight:600">${formatCurrency(amt)}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ledgr Financial Report</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#fff;color:#111}
.header{background:linear-gradient(135deg,#16a34a,#14532d);color:white;padding:32px;display:flex;justify-content:space-between;align-items:flex-start}
.logo{font-size:24px;font-weight:900;margin-bottom:4px}.sub{opacity:.7;font-size:12px}
.meta{text-align:right;font-size:12px;opacity:.8}
.body{padding:32px}.score-section{display:flex;align-items:center;gap:24px;background:#f9fafb;border-radius:16px;padding:24px;margin-bottom:24px}
.score-circle{width:96px;height:96px;border-radius:50%;border:8px solid ${scoreColor};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}
.score-num{font-size:28px;font-weight:900;color:${scoreColor}}.score-label{font-size:10px;color:#9ca3af;font-weight:600;letter-spacing:.05em}
.score-desc h3{margin:0 0 4px;font-size:16px}.score-desc p{margin:0;color:#6b7280;font-size:13px}
.stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px}
.stat{border-radius:12px;padding:16px}.inc{background:#f0fdf4}.exp{background:#fef2f2}.sav{background:#eff6ff}
.stat-label{font-size:10px;font-weight:700;letter-spacing:.05em;margin-bottom:6px}.stat-val{font-size:20px;font-weight:900}
.inc .stat-label{color:#16a34a}.inc .stat-val{color:#15803d}
.exp .stat-label{color:#ef4444}.exp .stat-val{color:#dc2626}
.sav .stat-label{color:#2563eb}.sav .stat-val{color:${yearIncome - yearExpenses >= 0 ? '#15803d' : '#dc2626'}}
table{width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;overflow:hidden}
th{background:#f3f4f6;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:left;color:#6b7280}
tr:nth-child(even){background:#f9fafb}tr:nth-child(odd){background:white}
.footer{text-align:center;font-size:11px;color:#9ca3af;margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.header{-webkit-print-color-adjust:exact}}</style></head>
<body>
<div class="header">
  <div><div class="logo">ledgr</div><div class="sub">Financial Health Report</div></div>
  <div class="meta"><div>${userProfile.name}</div><div>${now}</div></div>
</div>
<div class="body">
  <div class="score-section">
    <div class="score-circle"><div class="score-num">${score}</div><div class="score-label">SCORE</div></div>
    <div class="score-desc"><h3>${scoreLabel}</h3><p>${score >= 80 ? "You're saving a healthy portion of your income. Keep it up!" : score >= 60 ? "You're managing well but there's room to save more." : "Your expenses are high relative to income. Try cutting discretionary spending."}</p><p style="margin-top:8px;font-size:12px;color:#9ca3af">Based on ${currentYear} transactions · ${yearTxs.length} total records</p></div>
  </div>
  <div class="stats">
    <div class="stat inc"><div class="stat-label">INCOME ${currentYear}</div><div class="stat-val">${formatCurrency(yearIncome)}</div><div style="font-size:12px;color:#16a34a;margin-top:4px">~${formatCurrency(avgIncome)}/mo avg</div></div>
    <div class="stat exp"><div class="stat-label">EXPENSES ${currentYear}</div><div class="stat-val">${formatCurrency(yearExpenses)}</div><div style="font-size:12px;color:#ef4444;margin-top:4px">~${formatCurrency(avgExpenses)}/mo avg</div></div>
    <div class="stat sav"><div class="stat-label">NET SAVINGS</div><div class="stat-val">${yearIncome - yearExpenses >= 0 ? '+' : ''}${formatCurrency(yearIncome - yearExpenses)}</div><div style="font-size:12px;color:#6b7280;margin-top:4px">${yearIncome > 0 ? Math.round((1 - yearExpenses / yearIncome) * 100) : 0}% saving rate</div></div>
  </div>
  ${catRows ? `<h3 style="font-size:12px;font-weight:700;letter-spacing:.05em;color:#6b7280;margin-bottom:10px">EXPENSE BREAKDOWN</h3>
  <table><thead><tr><th>Category</th><th style="text-align:right">Amount</th></tr></thead><tbody>${catRows}</tbody></table>` : ''}
  <div class="footer">Generated by ledgr · ${now}</div>
</div>
<script>window.onload=()=>{window.print()}<\/script>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    setShowReport(false);
  }

  async function shareStreak() {
    setSharing(true);
    try {
      const SCALE = 2, W = 750, H = 330, PAD = 28;
      const canvas = document.createElement('canvas');
      canvas.width = W * SCALE; canvas.height = H * SCALE;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(SCALE, SCALE);
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#052e16'); grad.addColorStop(0.5, '#166534'); grad.addColorStop(1, '#16a34a');
      ctx.fillStyle = grad;
      drawRoundRect(ctx, 0, 0, W, H, 24); ctx.fill();
      ctx.fillStyle = 'rgba(134,239,172,0.7)'; ctx.font = 'bold 11px -apple-system, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('BUDGET STREAK', PAD, 34);
      ctx.font = 'bold 72px -apple-system, sans-serif'; ctx.fillStyle = 'white'; ctx.textAlign = 'left';
      const numStr = String(currentStreak);
      ctx.fillText(numStr, PAD, 106);
      const numW = ctx.measureText(numStr).width;
      ctx.font = '20px -apple-system, sans-serif'; ctx.fillStyle = 'rgba(187,247,208,0.8)';
      ctx.fillText('month' + (currentStreak !== 1 ? 's' : ''), PAD + numW + 10, 97);
      ctx.font = '13px -apple-system, sans-serif'; ctx.fillStyle = 'rgba(209,250,229,0.6)';
      ctx.fillText('consecutive months spending less than income', PAD, 134);
      ctx.fillStyle = 'rgba(209,250,229,0.7)'; ctx.fillText('Best: ', PAD, 160);
      const bestLabel = `${bestStreak} month${bestStreak !== 1 ? 's' : ''}`;
      ctx.font = 'bold 13px -apple-system, sans-serif'; ctx.fillStyle = 'white';
      ctx.fillText(bestLabel, PAD + ctx.measureText('Best: ').width, 160);
      const gap = 6, dotW = (W - 2 * PAD - 11 * gap) / 12, dotY = 186;
      for (let i = 0; i < 12; i++) {
        const dx = PAD + i * (dotW + gap);
        ctx.fillStyle = i < currentStreak ? '#86efac' : 'rgba(255,255,255,0.15)';
        drawRoundRect(ctx, dx, dotY, dotW, 8, 4); ctx.fill();
      }
      ctx.fillStyle = 'rgba(187,247,208,0.4)'; ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('12-month track', W - PAD, 210);
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`Generated with ledgr · ${todayStr}`, W / 2, H - 16);
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `ledgr-streak-${currentStreak}-months.png`;
      if (navigator.share) {
        try {
          const blob = await fetch(dataUrl).then(r => r.blob());
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: `${currentStreak}-month budget streak – ledgr` });
            return;
          }
        } catch { /* fall through to download */ }
      }
      const a = document.createElement('a'); a.download = filename; a.href = dataUrl; a.click();
    } finally { setSharing(false); }
  }

  function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
      <button type="button" onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0 ${value ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${value ? 'left-[26px]' : 'left-0.5'}`} />
      </button>
    );
  }

  return (
    <div className="pb-28 overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold dark:text-white">Profile</h1>
        <button type="button" onClick={toggleDarkMode} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-500" />}
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center gap-3 pb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center overflow-hidden">
            {userProfile.avatar
              ? <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              : <span className="text-white font-black text-3xl">{userProfile.name.charAt(0).toUpperCase()}</span>}
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
            <Camera size={14} className="text-white" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        {editingName ? (
          <div className="flex items-center gap-2">
            <input value={nameInput} onChange={e => setNameInput(e.target.value)}
              className="border-b-2 border-green-600 bg-transparent text-center font-bold text-lg dark:text-white outline-none w-40"
              autoFocus onBlur={() => { updateUserProfile({ name: nameInput }); setEditingName(false); }}
              onKeyDown={e => e.key === 'Enter' && (updateUserProfile({ name: nameInput }), setEditingName(false))} />
          </div>
        ) : (
          <button type="button" onClick={() => setEditingName(true)} className="flex items-center gap-1.5">
            <span className="text-lg font-bold dark:text-white">{userProfile.name}</span>
            <Edit3 size={14} className="text-gray-400" />
          </button>
        )}
        {(() => {
          if (userProfile.plan === 'premium' && userProfile.trialStartDate) {
            const trialEnd = new Date(userProfile.trialStartDate);
            trialEnd.setDate(trialEnd.getDate() + 7);
            const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000));
            if (daysLeft > 0) {
              return (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Free Trial</span>
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/subscription')}
                    className="text-xs font-bold text-green-600 dark:text-green-400 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 active:scale-95 transition-transform"
                  >
                    Upgrade Now →
                  </button>
                </div>
              );
            }
          }
          return (
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold capitalize">
              {userProfile.plan} plan
            </span>
          );
        })()}
      </div>

      {/* Achievements */}
      <div className="mx-4 mb-4">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Achievements</h2>

        {/* Budget Streak Card — inline */}
        <div data-tour="profile-streak" className="rounded-3xl overflow-hidden shadow-lg mb-3"
          style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #16a34a 100%)' }}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-green-300/70 text-[11px] font-bold uppercase tracking-widest">Budget Streak</p>
              <button type="button" onClick={shareStreak} disabled={sharing}
                className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50 active:scale-90 transition-transform"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                {sharing
                  ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  : <Share2 size={13} className="text-white" />}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-end gap-2">
                  <span className="text-white font-black text-5xl leading-none">{currentStreak}</span>
                  <span className="text-green-200/80 text-sm font-medium mb-1.5">month{currentStreak !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-green-100/60 text-xs mt-1">consecutive months spending less than income</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Trophy size={12} className="text-yellow-300" />
                  <span className="text-green-100/70 text-xs">
                    Best: <span className="text-white font-bold">{bestStreak} month{bestStreak !== 1 ? 's' : ''}</span>
                  </span>
                </div>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/15 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-3xl">{getStreakEmoji(currentStreak)}</span>
                <span className="text-white/60 text-[10px] mt-1 font-semibold">{getStreakLabel(currentStreak)}</span>
              </div>
            </div>
            <div className="flex gap-1.5 mt-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < currentStreak ? 'bg-green-300' : 'bg-white/15'}`} />
              ))}
            </div>
            <p className="text-green-200/40 text-[10px] mt-1.5 text-right">12-month track</p>
          </div>
        </div>

        {/* Badges summary */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-50 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold dark:text-white">{unlockedBadges} / {BADGES.length} Badges</p>
            <button type="button" onClick={() => navigate('/achievements')}
              className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-0.5">
              View all <ChevronRight size={11} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {badgesData.slice(0, 6).map(b => (
              <div key={b.id} title={b.label}
                className={`aspect-square rounded-xl flex items-center justify-center text-xl ${b.unlocked ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <span className={b.unlocked ? '' : 'grayscale opacity-30'}>{b.icon}</span>
              </div>
            ))}
          </div>
        </div>
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
            <p className="text-xl font-black text-green-700 dark:text-green-400">{formatCurrency(yearIncome)}</p>
            <p className="text-[11px] text-green-600/70 mt-0.5">This year</p>
            <p className="text-[11px] text-green-600 mt-1 font-medium">~{formatCurrency(avgIncome)}/mo avg</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={14} className="text-red-500" />
              <span className="text-[11px] text-red-500 font-semibold uppercase tracking-wide">Expenses</span>
            </div>
            <p className="text-xl font-black text-red-600 dark:text-red-400">{formatCurrency(yearExpenses)}</p>
            <p className="text-[11px] text-red-500/70 mt-0.5">This year</p>
            <p className="text-[11px] text-red-500 mt-1 font-medium">~{formatCurrency(avgExpenses)}/mo avg</p>
          </div>
        </div>

        <div data-tour="profile-assessment" className="bg-white dark:bg-gray-900 rounded-2xl p-5 flex flex-col items-center gap-3 shadow-sm border border-gray-50 dark:border-gray-800">
          <ScoreRing score={score} />
          <div className="text-center">
            <p className="font-bold text-base dark:text-white">{scoreLabel}</p>
            <p className="text-xs text-gray-400 mt-1">
              {score >= 80 ? "You're saving a healthy portion of your income." : score >= 60 ? "You're managing well but there's room to improve." : 'Your expenses are high relative to income.'}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            {[{ color: '#22c55e', range: '80–100', label: 'Excellent' }, { color: '#eab308', range: '60–79', label: 'Fair' }, { color: '#ef4444', range: '0–59', label: 'Critical' }].map(b => (
              <div key={b.label}>
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: b.color }} />
                <p className="text-[10px] text-gray-400">{b.range}</p>
                <p className="text-[10px] font-medium" style={{ color: b.color }}>{b.label}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setShowReport(true)}
            className="w-full py-3 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Download size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Settings sections */}
      <div className="mx-4 space-y-3 mb-4">
        {/* Account */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-4 pt-3 pb-1">Account</p>
          {editingEmail ? (
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Edit3 size={16} className="text-gray-500" />
              </div>
              <input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                className="flex-1 text-sm bg-transparent border-b border-green-600 dark:text-white outline-none"
                autoFocus onBlur={() => { updateUserProfile({ email: emailInput }); setEditingEmail(false); }}
                onKeyDown={e => e.key === 'Enter' && (updateUserProfile({ email: emailInput }), setEditingEmail(false))} />
            </div>
          ) : (
            <SettingsRow icon={<Edit3 size={16} />} label="Email" value={userProfile.email} onClick={() => setEditingEmail(true)} />
          )}
          <SettingsRow icon={<Star size={16} />} label="Subscription Plan" value={userProfile.plan === 'free' ? 'Free' : 'Premium'} onClick={() => navigate('/subscription')} />
          <SettingsRow icon={<Lock size={16} />} label="Change Password" onClick={() => { setShowChangePw(true); setPwError(''); setPwSuccess(false); }} />
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-4 pt-3 pb-1">Preferences</p>
          <SettingsRow icon={<Tag size={16} />} label="Categories" onClick={() => setShowCategories(true)} />
          <SettingsRow icon={<Bell size={16} />} label="Notifications" onClick={() => setShowNotifications(true)} />
          <button type="button" onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
            <div className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {darkMode ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-yellow-500" />}
            </div>
            <span className="flex-1 text-sm font-medium dark:text-white">Dark Mode</span>
            <div className={`w-12 h-6 rounded-full transition-colors duration-200 relative pointer-events-none flex-shrink-0 ${darkMode ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow-md transition-all duration-200 ${darkMode ? 'left-[26px]' : 'left-0.5'}`} />
            </div>
          </button>
          <SettingsRow
            icon={<Globe size={16} />}
            label="Currency"
            value={`${userProfile.currency || 'USD'} · ${getCurrencySymbol()}`}
            onClick={() => setShowCurrency(true)}
          />
        </div>

        {/* Data */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-4 pt-3 pb-1">Data</p>
          <SettingsRow icon={<Download size={16} />} label="Export CSV" value="Transactions" onClick={() => setShowCSV(true)} />
        </div>

        {/* Legal */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider px-4 pt-3 pb-1">Legal & Support</p>
          <SettingsRow icon={<FileText size={16} />} label="Terms & Conditions" onClick={() => setShowTerms(true)} />
          <SettingsRow icon={<FileText size={16} />} label="Privacy Policy" onClick={() => setShowPrivacy(true)} />
          <SettingsRow icon={<HelpCircle size={16} />} label="Help & FAQ" onClick={() => setShowFAQ(true)} />
        </div>

        {/* Danger */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-50 dark:border-gray-800">
          <SettingsRow icon={<Trash2 size={16} />} label="Clear All Data" danger onClick={() => { if (window.confirm('Clear all transaction data? This cannot be undone.')) { localStorage.clear(); window.location.reload(); } }} />
          <SettingsRow icon={<LogOut size={16} />} label="Sign Out" danger onClick={signOut} />
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-300 dark:text-gray-700 pb-4">ledgr v1.0.0</p>

      {/* ── Currency picker modal ── */}
      {showCurrency && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowCurrency(false)}>
          <div
            className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold dark:text-white">Select Currency</h2>
              <button type="button" onClick={() => setShowCurrency(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  placeholder="Search currency..."
                  value={currencySearch}
                  onChange={e => setCurrencySearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none dark:text-white placeholder:text-gray-400"
                  autoFocus
                />
                {currencySearch && (
                  <button type="button" onClick={() => setCurrencySearch('')}>
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {CURRENCIES
                .filter(c =>
                  !currencySearch ||
                  c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                  c.name.toLowerCase().includes(currencySearch.toLowerCase())
                )
                .map(c => {
                  const isSelected = (userProfile.currency || 'USD') === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { updateUserProfile({ currency: c.code }); setShowCurrency(false); setCurrencySearch(''); }}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors ${isSelected ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <span className="w-12 text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">{c.code}</span>
                      <span className={`flex-1 text-sm text-left ${isSelected ? 'font-semibold text-green-700 dark:text-green-400' : 'dark:text-white'}`}>{c.name}</span>
                      {isSelected && <span className="text-green-600 text-sm">✓</span>}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Export modal ── */}
      {showCSV && (
        <CSVExportModal transactions={transactions} onClose={() => setShowCSV(false)} />
      )}

      {/* ── Report modal ── */}
      {showReport && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowReport(false)}>
          <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-1">Generate Report</h3>
            <p className="text-sm text-gray-400 mb-6">Export your {currentYear} financial health report</p>

            <div className="space-y-3">
              <button type="button" onClick={generateReportPNG}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-green-400 dark:hover:border-green-600 active:scale-[0.98] transition-all bg-white dark:bg-gray-900">
                <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <FileImage size={22} className="text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm dark:text-white">Download as PNG</p>
                  <p className="text-xs text-gray-400 mt-0.5">High-quality image you can share anywhere</p>
                </div>
              </button>

              <button type="button" onClick={generateReportPDF}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 active:scale-[0.98] transition-all bg-white dark:bg-gray-900">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <FileType2 size={22} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm dark:text-white">Download as PDF</p>
                  <p className="text-xs text-gray-400 mt-0.5">Print-ready document via your browser</p>
                </div>
              </button>
            </div>

            <button type="button" onClick={() => setShowReport(false)}
              className="w-full mt-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Change Password modal ── */}
      {showChangePw && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowChangePw(false)}>
          <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-bold dark:text-white">Change Password</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5 ml-[52px]">Enter your current password to set a new one</p>

            {pwSuccess ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <p className="font-bold text-green-600 text-base">Password updated!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Current password */}
                {[
                  { label: 'Current Password', val: currentPw, set: setCurrentPw, show: showCurrentPw, toggle: () => setShowCurrentPw(v => !v) },
                  { label: 'New Password', val: newPw, set: setNewPw, show: showNewPw, toggle: () => setShowNewPw(v => !v) },
                  { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, show: showConfirmPw, toggle: () => setShowConfirmPw(v => !v) },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">{field.label}</label>
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 gap-2 bg-gray-50 dark:bg-gray-800 focus-within:border-green-500 transition-colors">
                      <input type={field.show ? 'text' : 'password'} value={field.val}
                        onChange={e => { field.set(e.target.value); setPwError(''); }}
                        className="flex-1 bg-transparent text-sm font-medium outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                        placeholder="••••••••" />
                      <button type="button" onClick={field.toggle} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}

                {pwError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-4 py-3">
                    <p className="text-red-500 text-xs font-medium">{pwError}</p>
                  </div>
                )}

                <button type="button" onClick={handleChangePassword}
                  className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold mt-1 active:scale-[0.98] transition-transform shadow-md shadow-green-600/20">
                  Update Password
                </button>
                <button type="button" onClick={() => setShowChangePw(false)}
                  className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showTerms && <LegalSheet type="terms" onClose={() => setShowTerms(false)} />}
      {showPrivacy && <LegalSheet type="privacy" onClose={() => setShowPrivacy(false)} />}

      {showCategories && <CategoryManagerSheet onClose={() => setShowCategories(false)} />}

      {/* ── Notifications modal ── */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowNotifications(false)}>
          <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden" style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold dark:text-white">Notifications</h2>
              <button type="button" onClick={() => setShowNotifications(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-2">
              <div className={`rounded-2xl p-4 border-2 transition-colors ${notifEnabled ? 'border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-bold dark:text-white">Enable Notifications</p><p className="text-[11px] text-gray-400 mt-0.5">Turn all notifications on or off</p></div>
                  <Toggle value={notifEnabled} onChange={() => setNotifEnabled(!notifEnabled)} />
                </div>
              </div>
              {[
                { label: 'Transaction Reminders', sub: 'Remind me to log daily transactions', value: notifTransactions, set: setNotifTransactions },
                { label: 'Monthly Summary', sub: 'Get a summary at the end of each month', value: notifMonthlySummary, set: setNotifMonthlySummary },
                { label: 'Auto Debit Alerts', sub: 'Notify before a recurring payment is due', value: notifAutoDebit, set: setNotifAutoDebit },
                { label: 'Budget Alerts', sub: 'Alert when spending exceeds your goal', value: notifBudgetAlerts, set: setNotifBudgetAlerts },
              ].map(item => (
                <div key={item.label} className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 transition-opacity ${notifEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium dark:text-white">{item.label}</p><p className="text-[11px] text-gray-400 mt-0.5">{item.sub}</p></div>
                    <Toggle value={item.value} onChange={() => item.set(!item.value)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 px-6 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={() => setShowNotifications(false)} className="w-full py-3 rounded-2xl bg-green-600 text-white font-bold">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ── FAQ modal ── */}
      {showFAQ && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowFAQ(false)}>
          <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div><h2 className="text-lg font-bold dark:text-white">Help & FAQ</h2><p className="text-xs text-gray-400">Tap a question to expand</p></div>
              <button type="button" onClick={() => setShowFAQ(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
                  <button type="button" onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                    <span className="text-sm font-medium dark:text-white flex-1 pr-3">{item.q}</span>
                    <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedFAQ === i ? 'rotate-180' : ''}`} />
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
              <button type="button" onClick={() => setShowFAQ(false)} className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

function CSVExportModal({ transactions, onClose }: { transactions: import('../types').Transaction[]; onClose: () => void }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('all');

  function handleExport() {
    let filtered = transactions;
    if (dateFrom) filtered = filtered.filter(t => t.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(t => t.date <= dateTo + 'T23:59:59');
    if (category !== 'all') filtered = filtered.filter(t => t.category === category);

    const header = 'Date,Type,Category,Description,Amount';
    const rows = filtered.map(t => {
      const d = new Date(t.date).toLocaleDateString('en-US');
      const cat = ALL_CATEGORIES.find(c => c.id === t.category)?.label || t.category;
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      return `${d},${t.type},${cat},${desc},${t.amount.toFixed(2)}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgr-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
        style={{ maxHeight: '75vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold dark:text-white">Export Transactions</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors"
              style={{ colorScheme: 'auto' }} />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors"
              style={{ colorScheme: 'auto' }} />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1.5 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400 text-left">Leave dates empty to export all transactions. CSV includes: Date, Type, Category, Description, Amount.</p>
        </div>

        <div className="flex-shrink-0 px-5 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={handleExport}
            className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base active:scale-[0.98] transition-transform shadow-lg shadow-green-600/30 flex items-center justify-center gap-2">
            <Download size={18} />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
