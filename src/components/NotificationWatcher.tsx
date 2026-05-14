import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BADGES, computeStreaks } from '../utils/achievements';
import BadgeCelebration from './BadgeCelebration';
import StatusCelebration from './StatusCelebration';

type StatusType = 'excellent' | 'sustained' | 'critical';

type BadgeItem = { id: string; icon: string; label: string; description: string };

function computeMonthStatus(
  transactions: { date: string; type: string; amount: number }[],
  year: number,
  month: number,
): StatusType {
  const txs = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const income   = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  if (income === 0) return expenses === 0 ? 'excellent' : 'critical';
  const ratio = expenses / income;
  return ratio < 0.5 ? 'excellent' : ratio < 0.8 ? 'sustained' : 'critical';
}

export default function NotificationWatcher() {
  const { transactions, budget } = useApp();
  const isFirst = useRef(true);
  const prevUnlocked = useRef<string[]>([]);
  const prevStatus = useRef<StatusType | null>(null);

  const [badgeQueue, setBadgeQueue] = useState<BadgeItem[]>([]);
  const [autoStatus, setAutoStatus] = useState<StatusType | null>(null);

  useEffect(() => {
    const now = new Date();

    // Compute annual score for badge checks
    const yearTxs = transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
    const yi = yearTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const ye = yearTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const score = yi > 0 ? Math.min(100, Math.max(0, Math.round(100 - (ye / yi) * 100))) : 50;
    const { best: bestStreak } = computeStreaks(transactions);

    const currentUnlocked = BADGES
      .filter(b => b.check({ transactions, budget, score, bestStreak }))
      .map(b => b.id);

    const currentStatus = computeMonthStatus(transactions, now.getFullYear(), now.getMonth());

    // First run: capture baseline silently
    if (isFirst.current) {
      isFirst.current = false;
      prevUnlocked.current = currentUnlocked;
      prevStatus.current = currentStatus;
      return;
    }

    // Detect newly unlocked badges
    const newIds = currentUnlocked.filter(id => !prevUnlocked.current.includes(id));
    if (newIds.length > 0) {
      // Mark in localStorage immediately so AchievementsPage won't re-show them
      const seen: string[] = JSON.parse(localStorage.getItem('ledgr_seen_badges') ?? '[]');
      newIds.forEach(id => { if (!seen.includes(id)) seen.push(id); });
      localStorage.setItem('ledgr_seen_badges', JSON.stringify(seen));

      const newBadges = BADGES
        .filter(b => newIds.includes(b.id))
        .map(({ id, icon, label, description }) => ({ id, icon, label, description }));
      setBadgeQueue(q => [...q, ...newBadges]);
    }

    // Detect status change to excellent or critical only
    if (currentStatus !== prevStatus.current &&
        (currentStatus === 'excellent' || currentStatus === 'critical')) {
      setAutoStatus(currentStatus);
    }

    prevUnlocked.current = currentUnlocked;
    prevStatus.current = currentStatus;
  }, [transactions, budget]);

  const currentBadge = badgeQueue[0] ?? null;

  function dismissBadge() {
    setBadgeQueue(q => q.slice(1));
  }

  return (
    <>
      {currentBadge && (
        <BadgeCelebration
          key={currentBadge.id}
          badge={currentBadge}
          remaining={badgeQueue.length - 1}
          onClose={dismissBadge}
        />
      )}
      {!currentBadge && autoStatus && (
        <StatusCelebration
          status={autoStatus}
          onClose={() => setAutoStatus(null)}
        />
      )}
    </>
  );
}
