import { useState, useRef } from 'react';
import { Camera, ChevronRight, Search, X, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CURRENCIES } from '../types';

export default function OnboardingPage() {
  const { updateUserProfile, completeOnboarding, userProfile } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(userProfile.currency || 'USD');
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [touched, setTouched] = useState(false);
  const hasName = name.trim().length > 0;

  function handleGetStarted() {
    setTouched(true);
    if (!hasName) return;
    updateUserProfile({ name: name.trim(), currency });
    completeOnboarding();
    navigate('/');
  }

  const initial = name.trim() ? name.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className="flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="px-6 pt-14 pb-5 flex-shrink-0">
        <div className="flex gap-1.5 mb-5">
          <div className="h-1 w-8 rounded-full bg-green-600" />
          <div className="h-1 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="h-1 w-8 rounded-full bg-gray-200 dark:bg-gray-800" />
        </div>
        <h1 className="text-2xl font-bold dark:text-white">Set up your profile</h1>
        <p className="text-sm text-gray-400 mt-1">Personalise your ledgr experience</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-6 pb-4">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center overflow-hidden shadow-lg">
              {userProfile.avatar
                ? <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-white font-black text-3xl">{initial}</span>}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-lg"
            >
              <Camera size={14} className="text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="text-xs text-gray-400">Tap to upload a photo</p>
        </div>

        {/* Name */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">
            Your Name
          </label>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setTouched(false); }}
            onBlur={() => setTouched(true)}
            placeholder="Enter your name"
            className={`w-full bg-white dark:bg-gray-900 border-2 rounded-2xl px-4 py-4 text-sm font-medium dark:text-white outline-none transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-600 ${touched && !hasName ? 'border-red-400 focus:border-red-400' : 'border-gray-100 dark:border-gray-800 focus:border-green-500'}`}
          />
          {touched && !hasName && (
            <p className="text-xs text-red-500 mt-1.5 ml-1">Please enter your name to continue</p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">
            Preferred Currency
          </label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-4 flex items-center justify-between hover:border-green-300 dark:hover:border-green-800 active:scale-[0.98] transition-all"
          >
            <div className="text-left">
              <p className="text-sm font-semibold dark:text-white">{selectedCurrency?.code ?? 'USD'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selectedCurrency?.name ?? 'US Dollar'}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
          </button>
        </div>

        {/* What to expect */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-900/30">
          <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">What to expect</p>
          {[
            'Sample data helps you explore the app',
            'Replace with your real transactions anytime',
            'All data stays on your device',
          ].map(t => (
            <div key={t} className="flex items-start gap-2 mt-1.5">
              <Check size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700/80 dark:text-green-400/80">{t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 px-6 pt-4" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}>
        <button
          type="button"
          onClick={handleGetStarted}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${hasName ? 'bg-green-600 text-white active:scale-[0.98] shadow-lg shadow-green-600/30' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'}`}
        >
          Get Started
        </button>
        <p className="text-center text-[11px] text-gray-400 mt-3">You can update these settings anytime in Profile</p>
      </div>

      {/* Currency picker sheet */}
      {showPicker && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowPicker(false)}>
          <div
            className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold dark:text-white">Select Currency</h2>
              <button type="button" onClick={() => setShowPicker(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  placeholder="Search currency…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none dark:text-white placeholder:text-gray-400"
                  autoFocus
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')}>
                    <X size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {filtered.map(c => {
                const isSel = currency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { setCurrency(c.code); setShowPicker(false); setSearch(''); }}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors ${isSel ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
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
