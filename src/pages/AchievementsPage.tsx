import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Trophy, Share2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
import { useApp } from '../context/AppContext';
import { computeStreaks, BADGES, tipsForScore, BadgeDef } from '../utils/achievements';
import BadgeCelebration from '../components/BadgeCelebration';

function streakEmoji(n: number) {
  if (n >= 12) return '💎';
  if (n >= 6)  return '⚡';
  if (n >= 3)  return '🔥';
  if (n >= 1)  return '🔥';
  return '❄️';
}
function streakLabelKey(n: number): 'ach.legendary' | 'ach.on_fire' | 'ach.hot_streak' | 'ach.going' | 'ach.start_now' {
  if (n >= 12) return 'ach.legendary';
  if (n >= 6)  return 'ach.on_fire';
  if (n >= 3)  return 'ach.hot_streak';
  if (n >= 1)  return 'ach.going';
  return 'ach.start_now';
}

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { transactions, budget } = useApp();
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [currentBadge, setCurrentBadge] = useState<(BadgeDef & { unlocked: boolean }) | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<Array<BadgeDef & { unlocked: boolean }>>([]);
  const initRef = useRef(false);

  const now = new Date();
  const yearTxs = useMemo(
    () => transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear()),
    [transactions],
  );
  const yearIncome   = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const yearExpenses = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const score = yearIncome > 0
    ? Math.min(100, Math.max(0, Math.round(100 - (yearExpenses / yearIncome) * 100)))
    : 50;

  const { current: currentStreak, best: bestStreak } = useMemo(
    () => computeStreaks(transactions), [transactions],
  );

  const badges = useMemo(
    () => BADGES.map(b => ({ ...b, unlocked: b.check({ transactions, budget, score, bestStreak }) })),
    [transactions, budget, score, bestStreak],
  );
  const unlockedCount = badges.filter(b => b.unlocked).length;

  // Show newly earned badges once per session
  if (!initRef.current && badges.length > 0) {
    initRef.current = true;
    const seen: string[] = JSON.parse(localStorage.getItem('ledgr_seen_badges') ?? '[]');
    const newOnes = badges.filter(b => b.unlocked && !seen.includes(b.id));
    if (newOnes.length > 0) {
      // defer to avoid setState during render
      setTimeout(() => {
        setCurrentBadge(newOnes[0]);
        setBadgeQueue(newOnes.slice(1));
      }, 400);
    }
  }

  function dismissBadge() {
    if (!currentBadge) return;
    const seen: string[] = JSON.parse(localStorage.getItem('ledgr_seen_badges') ?? '[]');
    if (!seen.includes(currentBadge.id)) seen.push(currentBadge.id);
    localStorage.setItem('ledgr_seen_badges', JSON.stringify(seen));
    if (badgeQueue.length > 0) {
      setCurrentBadge(badgeQueue[0]);
      setBadgeQueue(badgeQueue.slice(1));
    } else {
      setCurrentBadge(null);
    }
  }

  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  const scoreLabel = score >= 80 ? t('ach.excellent') : score >= 60 ? t('ach.fair') : t('ach.critical');
  const nextLabel  = score >= 80 ? t('ach.excellent') : score >= 60 ? t('ach.excellent') : t('ach.fair');

  const tips = tipsForScore(score);
  const [sharing, setSharing] = useState(false);

  async function shareStreak() {
    setSharing(true);
    try {
      const SCALE = 2, W = 750, H = 330, PAD = 28;
      const canvas = document.createElement('canvas');
      canvas.width = W * SCALE; canvas.height = H * SCALE;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(SCALE, SCALE);

      // Background
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#052e16'); grad.addColorStop(0.5, '#166534'); grad.addColorStop(1, '#16a34a');
      ctx.fillStyle = grad;
      rrPath(ctx, 0, 0, W, H, 24); ctx.fill();

      // Header
      ctx.fillStyle = 'rgba(134,239,172,0.7)';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(t('ach.streak').toUpperCase(), PAD, 34);

      // Big streak number
      ctx.font = 'bold 72px -apple-system, sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      const numStr = String(currentStreak);
      ctx.fillText(numStr, PAD, 106);
      const numW = ctx.measureText(numStr).width;

      // "months" suffix
      ctx.font = '20px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(187,247,208,0.8)';
      ctx.fillText(currentStreak !== 1 ? t('ach.months') : t('ach.month'), PAD + numW + 10, 97);

      // Description
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(209,250,229,0.6)';
      ctx.fillText(t('ach.consecutive'), PAD, 134);

      // Best streak
      ctx.font = '13px -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(209,250,229,0.7)';
      const bestPrefix = t('ach.best') + ': ';
      ctx.fillText(bestPrefix, PAD, 160);
      const bestLabel = `${bestStreak} ${bestStreak !== 1 ? t('ach.months') : t('ach.month')}`;
      ctx.font = 'bold 13px -apple-system, sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText(bestLabel, PAD + ctx.measureText(bestPrefix).width, 160);

      // 12-dot progress bar
      const gap = 6;
      const dotW = (W - 2 * PAD - 11 * gap) / 12;
      const dotY = 186;
      for (let i = 0; i < 12; i++) {
        const dx = PAD + i * (dotW + gap);
        ctx.fillStyle = i < currentStreak ? '#86efac' : 'rgba(255,255,255,0.15)';
        rrPath(ctx, dx, dotY, dotW, 8, 4); ctx.fill();
      }
      ctx.fillStyle = 'rgba(187,247,208,0.4)';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(t('ach.track'), W - PAD, 210);

      // Footer
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Generated with Kachingo · ${today}`, W / 2, H - 16);

      const dataUrl = canvas.toDataURL('image/png');
      const filename = `kachingo-streak-${currentStreak}-months.png`;
      if (navigator.share) {
        try {
          const blob = await fetch(dataUrl).then(r => r.blob());
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: `${currentStreak}-month budget streak – Kachingo` });
            return;
          }
        } catch { /* fall through to download */ }
      }
      const a = document.createElement('a'); a.download = filename; a.href = dataUrl; a.click();
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
    <div className="pb-28 overflow-y-auto min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-xl font-bold dark:text-white">{t('ach.title')}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{t('ach.earned', { n: unlockedCount, total: badges.length })}</p>
        </div>
      </div>

      {/* ── Streak card ── */}
      <div
        className="mx-4 mb-4 rounded-3xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #16a34a 100%)' }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-300/70 text-[11px] font-bold uppercase tracking-widest">
              {t('ach.streak')}
            </p>
            <button
              type="button"
              onClick={shareStreak}
              disabled={sharing}
              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-50 active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              title="Share streak"
            >
              {sharing
                ? <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                : <Share2 size={13} className="text-white" />
              }
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-end gap-2">
                <span className="text-white font-black text-5xl leading-none">{currentStreak}</span>
                <span className="text-green-200/80 text-sm font-medium mb-1.5">
                  {currentStreak !== 1 ? t('ach.months') : t('ach.month')}
                </span>
              </div>
              <p className="text-green-100/60 text-xs mt-1">{t('ach.consecutive')}</p>
              <div className="flex items-center gap-1.5 mt-3">
                <Trophy size={12} className="text-yellow-300" />
                <span className="text-green-100/70 text-xs">
                  {t('ach.best')}: <span className="text-white font-bold">{bestStreak} {bestStreak !== 1 ? t('ach.months') : t('ach.month')}</span>
                </span>
              </div>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/15 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-3xl">{streakEmoji(currentStreak)}</span>
              <span className="text-white/60 text-[10px] mt-1 font-semibold">{t(streakLabelKey(currentStreak))}</span>
            </div>
          </div>

          {/* 12-dot progress */}
          <div className="flex gap-1.5 mt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < currentStreak ? 'bg-green-300' : 'bg-white/15'}`}
              />
            ))}
          </div>
          <p className="text-green-200/40 text-[10px] mt-1.5 text-right">{t('ach.track')}</p>
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-sm font-bold dark:text-white mb-3">{t('ach.badges')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {badges.map(badge => (
            <div
              key={badge.id}
              title={badge.description}
              className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 border transition-all ${
                badge.unlocked
                  ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm'
                  : 'bg-gray-100/60 dark:bg-gray-900/40 border-transparent'
              }`}
            >
              <span className={`text-2xl ${badge.unlocked ? '' : 'grayscale opacity-30'}`}>
                {badge.icon}
              </span>
              <p className={`text-[11px] font-semibold text-center leading-tight ${
                badge.unlocked ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-600'
              }`}>
                {(() => { const k = 'badge.' + badge.id + '.label'; const tr = t(k as any); return tr !== k ? tr : badge.label; })()}
              </p>
              <p className={`text-[9px] text-center leading-tight ${
                badge.unlocked ? 'text-gray-400' : 'text-gray-300 dark:text-gray-700'
              }`}>
                {(() => { const k = 'badge.' + badge.id + '.desc'; const tr = t(k as any); return tr !== k ? tr : badge.description; })()}
              </p>
              {badge.unlocked && (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                  <span className="text-white text-[9px] font-black">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Knowledge Base ── */}
      <div className="mx-4 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold dark:text-white">{t('ach.knowledge')}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {score < 80
                ? t('ach.tips', { from: scoreLabel, to: nextLabel })
                : t('ach.tips', { from: scoreLabel, to: t('ach.excellent') })}
            </p>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 mt-0.5"
            style={{ background: scoreColor + '18', color: scoreColor }}
          >
            {scoreLabel}
          </div>
        </div>

        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-50 dark:border-gray-800 shadow-sm"
            >
              <button
                type="button"
                onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <div
                  className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-base"
                  style={{ background: scoreColor + '18' }}
                >
                  💡
                </div>
                <span className="flex-1 text-sm font-medium dark:text-white leading-snug pr-1">
                  {(() => { const k = 'tip.' + tip.id + '.title'; const tr = t(k as any); return tr !== k ? tr : tip.title; })()}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedTip === i ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedTip === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{(() => { const k = 'tip.' + tip.id + '.body'; const tr = t(k as any); return tr !== k ? tr : tip.body; })()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>

    {currentBadge && (
      <BadgeCelebration
        key={currentBadge.id}
        badge={currentBadge}
        remaining={badgeQueue.length}
        onClose={dismissBadge}
      />
    )}
    </>
  );
}
