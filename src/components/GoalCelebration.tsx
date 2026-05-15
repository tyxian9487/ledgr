import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { playRewardSound } from '../utils/sounds';

interface Props {
  goalName: string;
  totalAmount: number;
  color: string;
  isMonthly?: boolean;
  onContinue?: () => void;
  onDone?: () => void;
  onClose?: () => void;
  formatCurrency: (n: number) => string;
}

const EMOJIS = ['🎊', '⭐', '💫', '✨', '🌟', '🎉', '🏆', '💰'];

export default function GoalCelebration({ goalName, totalAmount, color, isMonthly, onContinue, onDone, onClose, formatCurrency }: Props) {
  const particles = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      left: `${4 + (i / 20) * 92}%`,
      delay: `${(i * 0.07).toFixed(2)}s`,
      duration: `${(1.4 + Math.sin(i) * 0.5).toFixed(2)}s`,
      emoji: EMOJIS[i % EMOJIS.length],
      size: 18 + (i % 4) * 5,
    }))
  );

  useEffect(() => {
    playRewardSound();
    if ('vibrate' in navigator) navigator.vibrate([80, 40, 160]);
  }, []);

  const content = (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.78)' }}>
      {/* Confetti particles */}
      {particles.current.map((p, i) => (
        <span
          key={i}
          className="animate-confetti fixed pointer-events-none select-none"
          style={{
            left: p.left,
            top: '-24px',
            fontSize: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* Card */}
      <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up">
        {/* Colour stripe */}
        <div style={{ height: 5, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />

        <div className="px-6 pt-7 pb-10 flex flex-col items-center text-center">
          {/* Big emoji */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: color + '20' }}
          >
            <span className="text-4xl">🎉</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
            {isMonthly ? 'Monthly Goal Hit!' : 'Goal Complete!'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{goalName}</p>
          <p className="text-3xl font-black mb-7" style={{ color }}>
            {formatCurrency(totalAmount)} saved!
          </p>

          {isMonthly ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-[0.98] transition-transform"
              style={{ background: color }}
            >
              Awesome! 🎉
            </button>
          ) : (
            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={onContinue}
                className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-[0.98] transition-transform shadow-lg"
                style={{ background: color, boxShadow: `0 4px 20px ${color}60` }}
              >
                Keep saving 💪
              </button>
              <button
                type="button"
                onClick={onDone}
                className="w-full py-4 rounded-2xl font-bold text-base border-2 active:scale-[0.98] transition-transform dark:text-white"
                style={{ borderColor: color + '60', color: color }}
              >
                I'm done! 🏆
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
