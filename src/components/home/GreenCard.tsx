import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EXPENSE_CATEGORIES, FinancialStatus } from '../../types';
import DonutChart from './DonutChart';
import type { Slice } from './DonutChart';
import StatusCelebration from '../StatusCelebration';

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  onYearChange: (year: number) => void;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getStatus(income: number, expenses: number): FinancialStatus {
  if (income === 0) return expenses === 0 ? 'excellent' : 'critical';
  const ratio = expenses / income;
  if (ratio < 0.5) return 'excellent';
  if (ratio < 0.8) return 'sustained';
  return 'critical';
}

function GoldCoin() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="9" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.6"/>
      <text x="14" y="18.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">$</text>
    </svg>
  );
}

function SilverCoin() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="9" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.6"/>
      <text x="14" y="18.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e293b">$</text>
    </svg>
  );
}

function CopperCoin() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="#b45309" stroke="#92400e" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="9" fill="none" stroke="#d97706" strokeWidth="1" opacity="0.6"/>
      <text x="14" y="18.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fef3c7">$</text>
    </svg>
  );
}

// Draws a rounded rectangle path (does not stroke/fill — caller does that)
function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDonutOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  outerR: number, innerR: number,
  slices: Slice[], total: number,
) {
  if (total === 0 || slices.length === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();
    return;
  }
  const GAP = 0.04;
  let angle = -Math.PI / 2;
  for (const slice of slices) {
    const sweep = (slice.amount / total) * Math.PI * 2 - GAP;
    if (sweep <= 0) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, angle + GAP / 2, angle + GAP / 2 + sweep);
    ctx.arc(cx, cy, innerR, angle + GAP / 2 + sweep, angle + GAP / 2, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    angle += sweep + GAP;
  }
}

export default function GreenCard({ year, month, onPrev, onNext, onYearChange }: Props) {
  const { getMonthTransactions, getMonthIncome, getMonthExpenses, formatCurrency } = useApp();
  const [sharing, setSharing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const txs = getMonthTransactions(year, month);
  const totalIncome = getMonthIncome(year, month);
  const totalExpenses = getMonthExpenses(year, month);
  const remaining = totalIncome - totalExpenses;

  const status = getStatus(totalIncome, totalExpenses);
  const todayLabel = String(new Date().getDate()).padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, idx) => currentYear - idx);

  const statusConfig = {
    excellent: { label: 'Excellent', Coin: GoldCoin, text: '#fbbf24', coinColor: '#f59e0b' },
    sustained: { label: 'Sustained', Coin: SilverCoin, text: '#cbd5e1', coinColor: '#94a3b8' },
    critical:  { label: 'Critical',  Coin: CopperCoin, text: '#f97316', coinColor: '#b45309' },
  };
  const { label, Coin, text, coinColor } = statusConfig[status];

  const categoryTotals: Record<string, number> = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const slices: Slice[] = EXPENSE_CATEGORIES
    .filter(c => categoryTotals[c.id])
    .map(c => ({ category: c.id, label: c.label, amount: categoryTotals[c.id], color: c.color }));

  const now = new Date();
  const isFuture = new Date(year, month) >= new Date(now.getFullYear(), now.getMonth());

  async function handleShare() {
    setSharing(true);
    try {
      const SCALE = 2;
      const W = 750, H = 460, PAD = 24;
      const canvas = document.createElement('canvas');
      canvas.width = W * SCALE;
      canvas.height = H * SCALE;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(SCALE, SCALE);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#16a34a');
      grad.addColorStop(0.5, '#15803d');
      grad.addColorStop(1, '#14532d');
      ctx.fillStyle = grad;
      rrPath(ctx, 0, 0, W, H, 24);
      ctx.fill();

      // ── Header: logo + month ──
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '13px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ExpenseWise', PAD, 34);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 20px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${MONTHS[month]} ${year}`, W / 2, 35);

      // ── Status glass box (y: 50–122) ──
      const sY = 50, sH = 72;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      rrPath(ctx, PAD, sY, W - PAD * 2, sH, 16);
      ctx.fill();

      // Coin circle
      const coinX = PAD + 38, coinY = sY + sH / 2;
      ctx.fillStyle = coinColor;
      ctx.beginPath();
      ctx.arc(coinX, coinY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = status === 'excellent' ? '#92400e' : status === 'sustained' ? '#1e293b' : '#fef3c7';
      ctx.font = 'bold 14px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', coinX, coinY + 5);

      // Status text
      const statusTextX = PAD + 68;
      const scoreTextX = W - PAD - 14;
      const statusLabelY = sY + 28;
      const statusSubY = sY + 48;
      const scoreLabelY = sY + 28;
      const scoreValueY = sY + 48;

      ctx.textBaseline = 'middle';
      ctx.fillStyle = text;
      ctx.font = 'bold 20px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, statusTextX, statusLabelY);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px -apple-system, system-ui, sans-serif';
      ctx.fillText('Financial Status', statusTextX, statusSubY);

      // Score right
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillText('Score', scoreTextX, scoreLabelY);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px -apple-system, system-ui, sans-serif';
      ctx.fillText(status === 'excellent' ? '90+' : status === 'sustained' ? '60–79' : '<60', scoreTextX, scoreValueY);
      ctx.textBaseline = 'alphabetic';

      // ── Donut + category list (y: 138–338) ──
      const chartY = sY + sH + 16;
      const chartH = 200;
      const chartCX = 140, chartCY = chartY + chartH / 2;
      const outerR = 74, innerR = 48;

      drawDonutOnCanvas(ctx, chartCX, chartCY, outerR, innerR, slices, totalExpenses);

      // Center label
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Expenses', chartCX, chartCY - 11);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 17px -apple-system, system-ui, sans-serif';
      ctx.fillText(formatCurrency(totalExpenses), chartCX, chartCY + 10);

      // Category list
      const catStartX = chartCX + outerR + 30;
      const topSlices = slices.slice(0, 4);
      ctx.textAlign = 'left';
      topSlices.forEach((slice, i) => {
        const rowY = chartY + 16 + i * 46;
        ctx.fillStyle = slice.color;
        ctx.beginPath();
        ctx.arc(catStartX, rowY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '14px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'left';
        // Truncate long labels
        const maxLabelW = W - PAD - catStartX - 16 - 80;
        let lbl = slice.label;
        ctx.font = '14px -apple-system, system-ui, sans-serif';
        while (ctx.measureText(lbl).width > maxLabelW && lbl.length > 3) {
          lbl = lbl.slice(0, -1);
        }
        if (lbl !== slice.label) lbl += '…';
        ctx.fillText(lbl, catStartX + 16, rowY + 13);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatCurrency(slice.amount), W - PAD, rowY + 13);
      });

      if (slices.length === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('No expenses recorded', catStartX, chartY + chartH / 2 + 5);
      }

      // ── Income / Remaining boxes (y: 354–426) ──
      const boxY = chartY + chartH + 16;
      const boxH = 72;
      const boxW = Math.floor((W - PAD * 2 - 12) / 2);

      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      rrPath(ctx, PAD, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('INCOME', PAD + 14, boxY + 24);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 22px -apple-system, system-ui, sans-serif';
      ctx.fillText(formatCurrency(totalIncome), PAD + 14, boxY + 54);

      const remX = PAD + boxW + 12;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      rrPath(ctx, remX, boxY, boxW, boxH, 16);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('REMAINING', remX + 14, boxY + 24);
      ctx.fillStyle = remaining >= 0 ? 'white' : '#fca5a5';
      ctx.font = 'bold 22px -apple-system, system-ui, sans-serif';
      ctx.fillText(formatCurrency(Math.abs(remaining)), remX + 14, boxY + 54);

      // ── Footer ──
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      ctx.fillText(`Generated with ExpenseWise · ${today}`, W / 2, boxY + boxH + 22);

      // Download / share
      const dataUrl = canvas.toDataURL('image/png');
      const filename = `ExpenseWise-${MONTHS[month]}-${year}.png`;

      if (navigator.share) {
        try {
          const blob = await fetch(dataUrl).then(r => r.blob());
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: `${MONTHS[month]} ${year} – ExpenseWise` });
            return;
          }
        } catch { /* fall through */ }
      }
      const a = document.createElement('a');
      a.download = filename;
      a.href = dataUrl;
      a.click();
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
    <div
      data-tour="green-card"
      className="mx-4 mt-4 rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 40%, #166534 100%)' }}
    >
      {/* Header: date pill | centered month nav | year dropdown — all in one flex row */}
      <div className="flex items-center px-5 pt-4 pb-2 gap-2">
        {/* Left — today's date pill */}
        <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-2 text-white text-sm font-semibold tracking-wide shadow-sm flex-shrink-0">
          {todayLabel}
        </div>

        {/* Center — month navigation, takes remaining space and centers content */}
        <div className="flex flex-1 items-center justify-center gap-2">
          <button onClick={onPrev} className="w-7 h-7 rounded-full glass flex items-center justify-center active:scale-90 transition-transform">
            <ChevronLeft size={16} className="text-white" />
          </button>
          <span className="text-white font-semibold text-sm tracking-wide uppercase w-10 text-center">
            {MONTHS[month].slice(0, 3)}
          </span>
          <button
            onClick={onNext}
            disabled={isFuture}
            className="w-7 h-7 rounded-full glass flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>

        {/* Right — year dropdown */}
        <div className="relative rounded-2xl border border-white/25 bg-white/10 shadow-sm flex-shrink-0">
          <select
            value={year}
            onChange={e => onYearChange(Number(e.target.value))}
            className="w-20 appearance-none rounded-2xl bg-transparent px-3 py-2 pr-8 text-white text-sm font-semibold focus:outline-none"
            aria-label="Select year"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white" />
        </div>
      </div>

      {/* Financial status glass box — tap to see celebration */}
      <div
        className="mx-4 mb-3 rounded-2xl glass p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => setShowCelebration(true)}
      >
        <Coin />
        <div>
          <p className="text-white/60 text-[10px] uppercase tracking-wider font-medium">Financial Status</p>
          <p className="font-bold text-base leading-tight" style={{ color: text }}>{label}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-white/60 text-[10px]">Score</p>
            <p className="text-white font-semibold text-sm">
              {status === 'excellent' ? '90+' : status === 'sustained' ? '60–79' : '<60'}
            </p>
          </div>
          <div onClick={e => e.stopPropagation()}>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-9 h-9 rounded-full glass flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
              title="Share financial status"
            >
              {sharing
                ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                : <Share2 size={14} className="text-white" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Donut chart */}
      <div className="flex justify-center pb-2">
        <DonutChart slices={slices} total={totalExpenses} formatCurrency={formatCurrency} />
      </div>

      {/* Income / Remaining row */}
      <div data-tour="stats-row" className="mx-4 mb-4 grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-3">
          <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Income</p>
          <p className="text-white font-bold text-base">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="glass rounded-2xl p-3">
          <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Remaining</p>
          <p className={`font-bold text-base ${remaining >= 0 ? 'text-white' : 'text-red-300'}`}>
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && <span className="text-[10px] ml-1">deficit</span>}
          </p>
        </div>
      </div>
    </div>
    {showCelebration && (
      <StatusCelebration status={status} onClose={() => setShowCelebration(false)} />
    )}
    </>
  );
}
