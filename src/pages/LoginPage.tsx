import { useState } from 'react';
import { TrendingUp, Target, PiggyBank } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import LegalSheet from '../components/LegalSheet';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="21" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

const FEATURES = [
  { icon: TrendingUp, label: 'Track every expense' },
  { icon: Target,     label: 'Budget with smart goals' },
  { icon: PiggyBank,  label: 'Watch your savings grow' },
];

export default function LoginPage() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);

  async function handleSignIn(provider: 'google' | 'apple') {
    setLoading(provider);
    await new Promise(r => setTimeout(r, 1100));
    signIn(provider);
    navigate('/onboarding');
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: '100dvh',
        background: 'linear-gradient(170deg, #052e16 0%, #14532d 30%, #16a34a 65%, #4ade80 100%)',
      }}
    >
      {/* ── Hero ── fills remaining space, never overflows */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 overflow-hidden py-6 gap-5">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-16 h-16 rounded-[22px] bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-2xl">
            <span className="text-white font-black text-3xl tracking-tighter">l</span>
          </div>
          <h1 className="text-white font-black text-4xl tracking-tight mt-0.5">ledgr</h1>
          <p className="text-green-100/75 text-sm font-medium">Your money, simplified.</p>
        </div>

        {/* Feature chips */}
        <div className="w-full max-w-xs space-y-2">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="glass rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-white" />
              </div>
              <span className="text-white text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom sheet ── fixed height, never pushed off-screen */}
      <div
        className="flex-shrink-0 bg-white dark:bg-gray-900 rounded-t-[28px] px-6 pt-6 shadow-2xl"
        style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom, 28px))' }}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Get started</h2>
        <p className="text-sm text-gray-400 mt-0.5 mb-5">Sign in or create your free account</p>

        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={() => handleSignIn('google')}
            disabled={!!loading}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-200 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {loading === 'google'
                ? <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-green-600 animate-spin" />
                : <GoogleIcon />}
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200 text-center pr-5">
              {loading === 'google' ? 'Signing in…' : 'Continue with Google'}
            </span>
          </button>

          {/* Apple */}
          <button
            onClick={() => handleSignIn('apple')}
            disabled={!!loading}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gray-900 dark:bg-black hover:bg-black active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {loading === 'apple'
                ? <div className="w-5 h-5 rounded-full border-2 border-gray-600 border-t-white animate-spin" />
                : <AppleIcon />}
            </div>
            <span className="flex-1 text-sm font-semibold text-white text-center pr-5">
              {loading === 'apple' ? 'Signing in…' : 'Continue with Apple'}
            </span>
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-5 leading-relaxed">
          By continuing you agree to our{' '}
          <button
            type="button"
            onClick={() => setLegal('terms')}
            className="text-green-600 font-medium underline underline-offset-2"
          >
            Terms of Service
          </button>
          {' '}and{' '}
          <button
            type="button"
            onClick={() => setLegal('privacy')}
            className="text-green-600 font-medium underline underline-offset-2"
          >
            Privacy Policy
          </button>
        </p>
      </div>

      {legal && <LegalSheet type={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}
