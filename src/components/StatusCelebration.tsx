import { useEffect } from 'react';
import { X } from 'lucide-react';

type Status = 'excellent' | 'sustained' | 'critical';

interface Props {
  status: Status;
  onClose: () => void;
}

function BigGoldCoin() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="animate-coin-float" style={{ filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.6))' }}>
      <defs>
        <radialGradient id="sc-gcg" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fde68a"/>
          <stop offset="100%" stopColor="#b45309"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#sc-gcg)" stroke="#d97706" strokeWidth="3"/>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.5"/>
      <text x="60" y="79" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#92400e" fontFamily="-apple-system, sans-serif">$</text>
    </svg>
  );
}

function BigOrangeCoin() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="animate-coin-float" style={{ filter: 'drop-shadow(0 0 24px rgba(251,146,60,0.6))' }}>
      <defs>
        <radialGradient id="sc-ocg" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fed7aa"/>
          <stop offset="100%" stopColor="#c2410c"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#sc-ocg)" stroke="#ea580c" strokeWidth="3"/>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#fb923c" strokeWidth="2" opacity="0.5"/>
      <text x="60" y="79" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#fff7ed" fontFamily="-apple-system, sans-serif">$</text>
    </svg>
  );
}

function BigCopperCoin() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="animate-coin-float" style={{ filter: 'drop-shadow(0 0 24px rgba(180,83,9,0.7))' }}>
      <defs>
        <radialGradient id="sc-ccg" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fef3c7"/>
          <stop offset="100%" stopColor="#7c2d12"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#sc-ccg)" stroke="#92400e" strokeWidth="3"/>
      <circle cx="60" cy="60" r="44" fill="none" stroke="#d97706" strokeWidth="2" opacity="0.5"/>
      <text x="60" y="79" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#fef3c7" fontFamily="-apple-system, sans-serif">$</text>
    </svg>
  );
}

const SPARKLES: Array<{ top: string; left?: string; right?: string; delay: string; size: number }> = [
  { top: '14%', left: '14%',  delay: '0s',    size: 8  },
  { top: '10%', left: '56%',  delay: '0.45s', size: 6  },
  { top: '16%', right: '11%', delay: '0.9s',  size: 10 },
  { top: '50%', left: '5%',   delay: '0.2s',  size: 7  },
  { top: '50%', right: '5%',  delay: '1.15s', size: 9  },
  { top: '80%', left: '17%',  delay: '0.65s', size: 8  },
  { top: '82%', left: '62%',  delay: '0.3s',  size: 6  },
  { top: '70%', right: '9%',  delay: '0.85s', size: 10 },
];

const CONFIG: Record<Status, {
  bg: string;
  label: string;
  labelColor: string;
  scoreRange: string;
  message: string;
  sparkleColor: string;
  Coin: () => JSX.Element;
}> = {
  excellent: {
    bg: 'linear-gradient(170deg, #052e16 0%, #14532d 30%, #16a34a 65%, #4ade80 100%)',
    label: 'Excellent',
    labelColor: '#fbbf24',
    scoreRange: '90+',
    message: "Your finances are in great shape!\nYou're spending well under your income.",
    sparkleColor: '#fbbf24',
    Coin: BigGoldCoin,
  },
  sustained: {
    bg: 'linear-gradient(170deg, #431407 0%, #7c2d12 30%, #ea580c 65%, #fb923c 100%)',
    label: 'Sustained',
    labelColor: '#fed7aa',
    scoreRange: '60–79',
    message: "You're managing your finances well.\nA little more saving will get you to Excellent!",
    sparkleColor: '#fb923c',
    Coin: BigOrangeCoin,
  },
  critical: {
    bg: 'linear-gradient(170deg, #450a0a 0%, #7f1d1d 30%, #dc2626 65%, #f87171 100%)',
    label: 'Critical',
    labelColor: '#fca5a5',
    scoreRange: '<60',
    message: "Your expenses exceed your income.\nCheck the Knowledge Base for tips to improve.",
    sparkleColor: '#fca5a5',
    Coin: BigCopperCoin,
  },
};

export default function StatusCelebration({ status, onClose }: Props) {
  const cfg = CONFIG[status];
  const { Coin } = cfg;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[150] overflow-hidden animate-celebration-in"
      style={{ background: cfg.bg }}
      onClick={onClose}
    >
      {/* Sparkle dots */}
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-sparkle"
          style={{
            top: s.top, left: s.left, right: s.right,
            width: s.size, height: s.size,
            background: cfg.sparkleColor,
            animationDelay: s.delay,
            opacity: 0,
          }}
        />
      ))}

      {/* Centered content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8"
        onClick={e => e.stopPropagation()}
      >
        <Coin />

        <div
          className="px-4 py-1.5 rounded-full text-xs font-bold border"
          style={{
            borderColor: cfg.sparkleColor + '60',
            color: cfg.sparkleColor,
            background: cfg.sparkleColor + '22',
          }}
        >
          Score {cfg.scoreRange}
        </div>

        <div className="text-center">
          <p className="text-4xl font-black tracking-tight mb-3" style={{ color: cfg.labelColor }}>
            {cfg.label}
          </p>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
            {cfg.message}
          </p>
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-12 right-5 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.15)' }}
      >
        <X size={18} className="text-white" />
      </button>

      <p className="absolute bottom-12 left-0 right-0 text-center text-white/40 text-xs">
        Tap anywhere to dismiss
      </p>
    </div>
  );
}
