import { useState, useRef } from 'react';
import { Camera, ChevronRight, Search, X, Check, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CURRENCIES } from '../types';
import { useTranslation } from '../context/LanguageContext';

const SPEND_ON_OPTIONS = [
  { id: 'self',     labelKey: 'onboard.myself'   as const, emoji: '🙋' },
  { id: 'family',   labelKey: 'onboard.family'   as const, emoji: '👨‍👩‍👧' },
  { id: 'partner',  labelKey: 'onboard.partner'  as const, emoji: '💑' },
  { id: 'children', labelKey: 'onboard.children' as const, emoji: '🧒' },
  { id: 'friends',  labelKey: 'onboard.friends'  as const, emoji: '👫' },
  { id: 'others',   labelKey: 'onboard.others'   as const, emoji: '🌍' },
];

const SPEND_WHAT_OPTIONS = [
  { id: 'food',          emoji: '🍽️' },
  { id: 'housing',       emoji: '🏠' },
  { id: 'transport',     emoji: '🚗' },
  { id: 'shopping',      emoji: '🛍️' },
  { id: 'entertainment', emoji: '🎬' },
  { id: 'health',        emoji: '💪' },
  { id: 'education',     emoji: '📚' },
  { id: 'subscriptions', emoji: '📱' },
  { id: 'travel',        emoji: '✈️' },
  { id: 'investments',   emoji: '💰' },
  { id: 'personal',      emoji: '💆' },
];

export interface OnboardingReco {
  enableSavings: boolean;
  savingsPct: number;
  enableInvestment: boolean;
  investPct: number;
  isHighGoal: boolean;
}

function computeReco(satisfaction: number, disciplined: boolean): OnboardingReco {
  if (disciplined) {
    return {
      enableSavings: true,
      savingsPct: satisfaction >= 4 ? 25 : 20,
      enableInvestment: true,
      investPct: satisfaction >= 4 ? 15 : 10,
      isHighGoal: true,
    };
  }
  return {
    enableSavings: true,
    savingsPct: satisfaction >= 4 ? 15 : 10,
    enableInvestment: false,
    investPct: 0,
    isHighGoal: false,
  };
}

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const { updateUserProfile, completeOnboarding, userProfile } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const STEP_TITLES = [
    t('onboard.setup'),
    t('onboard.financial_state'),
    t('onboard.discipline'),
    t('onboard.spend_on'),
    t('onboard.spend_what'),
  ];
  const STEP_SUBS = [
    t('onboard.personalise'),
    t('onboard.how_satisfied'),
    t('onboard.describe'),
    '',
    '',
  ];

  const [step, setStep] = useState(1);
  const [showWelcome, setShowWelcome] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(userProfile.currency || 'USD');
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const hasName = name.trim().length > 0;

  // Survey
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [disciplined, setDisciplined] = useState<boolean | null>(null);
  const [spendOn, setSpendOn] = useState<string[]>([]);
  const [spendWhat, setSpendWhat] = useState<string[]>([]);

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);
  const filtered = CURRENCIES.filter(
    c => !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateUserProfile({ avatar: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  const canProceed =
    step === 1 ? hasName :
    step === 2 ? satisfaction !== null :
    step === 3 ? disciplined !== null :
    step === 4 ? spendOn.length > 0 :
    step === 5 ? spendWhat.length > 0 :
    false;

  function handleNext() {
    if (!canProceed) { if (step === 1) setTouched(true); return; }
    if (step === 1) {
      updateUserProfile({ name: name.trim(), currency });
      setShowWelcome(true);
      return;
    }
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return; }
    // Final step
    const reco = computeReco(satisfaction!, disciplined!);
    localStorage.setItem('ledgr_onboarding_reco', JSON.stringify(reco));
    completeOnboarding();
    navigate('/subscription', { state: { fromOnboarding: true } });
  }

  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : '?';

  // Welcome screen (shown after step 1)
  if (showWelcome) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6" style={{ height: '100dvh' }}>
        <div className="flex flex-col items-center gap-4 w-full max-w-[360px]">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center overflow-hidden shadow-xl">
            {userProfile.avatar
              ? <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              : <span className="text-white font-black text-3xl">{initial}</span>}
          </div>
          <h1 className="text-2xl font-bold dark:text-white text-center">
            {t('onboard.welcome', { name: name.trim() })}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            To get to know you better, we'd like to ask a few quick questions about your finances.
          </p>
          <button
            type="button"
            onClick={() => { setShowWelcome(false); setStep(2); }}
            className="w-full mt-4 py-4 rounded-2xl bg-green-600 text-white font-bold text-base active:scale-[0.98] shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2"
          >
            {t('onboard.lets_go')} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-5 flex-shrink-0">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
          ))}
        </div>
        <div className="flex items-start gap-2">
          {step > 1 && (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-1">
              <ChevronLeft size={16} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold dark:text-white">{STEP_TITLES[step - 1]}</h1>
            <p className="text-sm text-gray-400 mt-1">{STEP_SUBS[step - 1]}</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">

        {/* ── Step 1: Profile setup ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center overflow-hidden shadow-lg">
                  {userProfile.avatar
                    ? <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="text-white font-black text-3xl">{initial}</span>}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
                  <Camera size={14} className="text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <p className="text-xs text-gray-400">{t('onboard.upload_photo')}</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">{t('onboard.your_name')}</label>
              <input value={name}
                onChange={e => { setName(e.target.value); setTouched(false); }}
                onBlur={() => setTouched(true)}
                placeholder="Enter your name"
                className={`w-full bg-white dark:bg-gray-900 border-2 rounded-2xl px-4 py-4 text-sm font-medium dark:text-white outline-none transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600 ${touched && !hasName ? 'border-red-400 focus:border-red-400' : 'border-gray-100 dark:border-gray-800 focus:border-green-500'}`}
              />
              {touched && !hasName && <p className="text-xs text-red-500 mt-1.5 ml-1">Please enter your name to continue</p>}
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">{t('onboard.currency')}</label>
              <button type="button" onClick={() => setShowPicker(true)}
                className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-4 flex items-center justify-between hover:border-green-300 dark:hover:border-green-800 active:scale-[0.98] transition-all">
                <div className="text-left">
                  <p className="text-sm font-semibold dark:text-white">{selectedCurrency?.code ?? 'USD'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedCurrency?.name ?? 'US Dollar'}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
              </button>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-900/30">
              <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">What to expect</p>
              {['Sample data helps you explore the app', 'Replace with your real transactions anytime', 'All data stays on your device'].map(t => (
                <div key={t} className="flex items-start gap-2 mt-1.5">
                  <Check size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700/80 dark:text-green-400/80">{t}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Financial satisfaction ── */}
        {step === 2 && (
          <div className="space-y-3 py-2">
            {[
              { val: 1, emoji: '😟', labelKey: 'onboard.sat.1' as const, subKey: 'onboard.sat.1.sub' as const },
              { val: 2, emoji: '😕', labelKey: 'onboard.sat.2' as const, subKey: 'onboard.sat.2.sub' as const },
              { val: 3, emoji: '😐', labelKey: 'onboard.sat.3' as const, subKey: 'onboard.sat.3.sub' as const },
              { val: 4, emoji: '😊', labelKey: 'onboard.sat.4' as const, subKey: 'onboard.sat.4.sub' as const },
              { val: 5, emoji: '😄', labelKey: 'onboard.sat.5' as const, subKey: 'onboard.sat.5.sub' as const },
            ].map(opt => (
              <button key={opt.val} type="button" onClick={() => setSatisfaction(opt.val)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${satisfaction === opt.val ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                <span className="text-3xl leading-none">{opt.emoji}</span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-bold ${satisfaction === opt.val ? 'text-green-700 dark:text-green-400' : 'dark:text-white'}`}>{t(opt.labelKey)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t(opt.subKey)}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${satisfaction === opt.val ? 'border-green-500 bg-green-500' : 'border-gray-200 dark:border-gray-700'}`}>
                  {satisfaction === opt.val && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 3: Discipline ── */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            {[
              { val: true,  emoji: '🎯', labelKey: 'onboard.disc.yes' as const, subKey: 'onboard.disc.yes.sub' as const },
              { val: false, emoji: '💪', labelKey: 'onboard.disc.no'  as const, subKey: 'onboard.disc.no.sub'  as const },
            ].map(opt => (
              <button key={String(opt.val)} type="button" onClick={() => setDisciplined(opt.val)}
                className={`w-full flex items-center gap-4 px-5 py-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${disciplined === opt.val ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                <span className="text-4xl leading-none">{opt.emoji}</span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-bold ${disciplined === opt.val ? 'text-green-700 dark:text-green-400' : 'dark:text-white'}`}>{t(opt.labelKey)}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{t(opt.subKey)}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${disciplined === opt.val ? 'border-green-500 bg-green-500' : 'border-gray-200 dark:border-gray-700'}`}>
                  {disciplined === opt.val && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 4: Who do you spend on ── */}
        {step === 4 && (
          <div className="py-2">
            <div className="grid grid-cols-2 gap-3">
              {SPEND_ON_OPTIONS.map(opt => {
                const sel = spendOn.includes(opt.id);
                return (
                  <button key={opt.id} type="button"
                    onClick={() => setSpendOn(prev => sel ? prev.filter(x => x !== opt.id) : [...prev, opt.id])}
                    className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all active:scale-[0.97] ${sel ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                    {sel && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <span className="text-3xl">{opt.emoji}</span>
                    <p className={`text-sm font-semibold ${sel ? 'text-green-700 dark:text-green-400' : 'dark:text-white'}`}>{t(opt.labelKey)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 5: What do you spend on ── */}
        {step === 5 && (
          <div className="py-2">
            <div className="grid grid-cols-2 gap-3">
              {SPEND_WHAT_OPTIONS.map(opt => {
                const sel = spendWhat.includes(opt.id);
                return (
                  <button key={opt.id} type="button"
                    onClick={() => setSpendWhat(prev => sel ? prev.filter(x => x !== opt.id) : [...prev, opt.id])}
                    className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.97] ${sel ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                    {sel && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={9} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <p className={`text-xs font-semibold flex-1 text-left pr-2 ${sel ? 'text-green-700 dark:text-green-400' : 'dark:text-white'}`}>{t(('cat.' + opt.id) as Parameters<typeof t>[0])}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 px-6 pt-4" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}>
        <button type="button" onClick={handleNext}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${canProceed ? 'bg-green-600 text-white active:scale-[0.98] shadow-lg shadow-green-600/30' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}>
          {step === TOTAL_STEPS ? 'Get Started' : 'Continue'}
        </button>
        {step === 1 && <p className="text-center text-[11px] text-gray-400 mt-3">You can update these settings anytime in Profile</p>}
        {(step === 4 || step === 5) && spendOn.length === 0 && step === 4 && (
          <p className="text-center text-[11px] text-gray-400 mt-2">Select at least one option</p>
        )}
      </div>

      {/* Currency picker sheet */}
      {showPicker && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowPicker(false)}>
          <div className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold dark:text-white">Select Currency</h2>
              <button type="button" onClick={() => setShowPicker(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input placeholder="Search currency…" value={search} onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none dark:text-white placeholder:text-gray-400" autoFocus />
                {search && <button type="button" onClick={() => setSearch('')}><X size={14} className="text-gray-400" /></button>}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {filtered.map(c => {
                const isSel = currency === c.code;
                return (
                  <button key={c.code} type="button"
                    onClick={() => { setCurrency(c.code); setShowPicker(false); setSearch(''); }}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors ${isSel ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <span className="w-12 text-xs font-bold text-gray-400 flex-shrink-0">{c.code}</span>
                    <span className={`flex-1 text-sm text-left ${isSel ? 'font-semibold text-green-700 dark:text-green-400' : 'dark:text-white'}`}>{c.name}</span>
                    {isSel && <Check size={15} className="text-green-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
