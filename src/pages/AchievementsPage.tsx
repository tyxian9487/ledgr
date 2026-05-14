import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Trophy } from 'lucide-react';
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
function streakLabel(n: number) {
  if (n >= 12) return 'Legendary';
  if (n >= 6)  return 'On Fire';
  if (n >= 3)  return 'Hot Streak';
  if (n >= 1)  return 'Going!';
  return 'Start now';
}

export default function AchievementsPage() {
  const navigate = useNavigate();
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
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Fair' : 'Critical';
  const nextLabel  = score >= 80 ? 'keep it up' : score >= 60 ? 'Excellent' : 'Fair';

  const tips = tipsForScore(score);

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
          <h1 className="text-xl font-bold dark:text-white">Achievements</h1>
          <p className="text-xs text-gray-400 mt-0.5">{unlockedCount} of {badges.length} badges earned</p>
        </div>
      </div>

      {/* ── Streak card ── */}
      <div
        className="mx-4 mb-4 rounded-3xl overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #166534 50%, #16a34a 100%)' }}
      >
        <div className="p-5">
          <p className="text-green-300/70 text-[11px] font-bold uppercase tracking-widest mb-3">
            Budget Streak
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-end gap-2">
                <span className="text-white font-black text-5xl leading-none">{currentStreak}</span>
                <span className="text-green-200/80 text-sm font-medium mb-1.5">
                  month{currentStreak !== 1 ? 's' : ''}
                </span>
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
              <span className="text-3xl">{streakEmoji(currentStreak)}</span>
              <span className="text-white/60 text-[10px] mt-1 font-semibold">{streakLabel(currentStreak)}</span>
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
          <p className="text-green-200/40 text-[10px] mt-1.5 text-right">12-month track</p>
        </div>
      </div>

      {/* ── Badges ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-sm font-bold dark:text-white mb-3">Badges</h2>
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
                {badge.label}
              </p>
              <p className={`text-[9px] text-center leading-tight ${
                badge.unlocked ? 'text-gray-400' : 'text-gray-300 dark:text-gray-700'
              }`}>
                {badge.description}
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
            <h2 className="text-sm font-bold dark:text-white">Knowledge Base</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Tips to move{score < 80 ? ` from ${scoreLabel} to ${nextLabel}` : ' and stay at Excellent'}
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
                  {tip.title}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedTip === i ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedTip === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{tip.body}</p>
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
