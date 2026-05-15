import { useEffect } from 'react';
import { X } from 'lucide-react';
import { playRewardSound } from '../utils/sounds';
import { useTranslation } from '../context/LanguageContext';

interface BadgeInfo {
  icon: string;
  label: string;
  description: string;
}

interface Props {
  badge: BadgeInfo;
  remaining: number;
  onClose: () => void;
}

export default function BadgeCelebration({ badge, remaining, onClose }: Props) {
  const { t } = useTranslation();

  useEffect(() => { playRewardSound(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[150] overflow-hidden animate-celebration-in"
      style={{ background: 'linear-gradient(170deg, #0c0a09 0%, #1c1917 45%, #292524 100%)' }}
      onClick={onClose}
    >
      {/* Ambient gold glow behind badge */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 70%)' }}
      />

      {/* Content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-yellow-400/80 text-xs font-bold uppercase tracking-[0.2em]">
          {t('badge.unlocked')}
        </p>

        <div
          className="animate-badge-pop leading-none"
          style={{ fontSize: 96 }}
        >
          {badge.icon}
        </div>

        <div className="text-center">
          <p className="text-white font-black text-2xl mb-2">{badge.label}</p>
          <p className="text-white/55 text-sm leading-relaxed">{badge.description}</p>
        </div>

        {remaining > 0 && (
          <div
            className="px-4 py-2 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
          >
            {t('badge.more', { n: String(remaining), s: remaining > 1 ? 's' : '' })}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-12 right-5 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.1)' }}
      >
        <X size={18} className="text-white" />
      </button>

      <p className="absolute bottom-12 left-0 right-0 text-center text-white/30 text-xs">
        {remaining > 0 ? t('badge.tap_continue') : t('badge.tap_dismiss')}
      </p>
    </div>
  );
}
