import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Sparkles, Shield, RefreshCw, Zap, BarChart2, Calendar, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTour } from '../context/TourContext';
import { useTranslation } from '../context/LanguageContext';

// ── RevenueCat Web SDK ─────────────────────────────────────────────────────────
// To enable real purchases, uncomment and fill in your credentials:
//
// import Purchases, { PurchasesOffering } from '@revenuecat/purchases-js';
//
// const RC_API_KEY   = 'rcb_your_web_billing_api_key';
// const ENTITLEMENT  = 'premium';
//
// async function rcConfigure(userId: string) {
//   Purchases.configure(RC_API_KEY, userId);
// }
//
// async function rcGetOffering(): Promise<PurchasesOffering | null> {
//   const { currentOffering } = await Purchases.getOfferings();
//   return currentOffering;
// }
//
// async function rcPurchase(pkg: import('@revenuecat/purchases-js').Package) {
//   const { customerInfo } = await Purchases.purchasePackage(pkg);
//   return customerInfo.entitlements.active[ENTITLEMENT] !== undefined;
// }
//
// async function rcRestore() {
//   const { customerInfo } = await Purchases.restorePurchases();
//   return customerInfo.entitlements.active[ENTITLEMENT] !== undefined;
// }
// ─────────────────────────────────────────────────────────────────────────────

const MONTHLY_PRICE  = 4.99;
const YEARLY_PRICE   = 29.99;
const YEARLY_MONTHLY = (YEARLY_PRICE / 12).toFixed(2);
const YEARLY_SAVE    = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100);
const TRIAL_DAYS     = 7;

const FEATURES = [
  { icon: BarChart2,  label: 'Advanced analytics & trends',    sub: 'Monthly breakdowns & category insights' },
  { icon: Sparkles,   label: 'AI receipt capture',              sub: 'Snap a receipt — AI fills the rest' },
  { icon: Calendar,   label: 'Auto-debit scheduling',           sub: 'Never miss a recurring bill' },
  { icon: Zap,        label: 'Smart budget goals',              sub: 'Savings & investment targets' },
  { icon: Download,   label: 'Export to CSV & PDF',             sub: 'Your data, your format' },
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, updateUserProfile } = useApp();
  const { startTour } = useTour();
  const { t } = useTranslation();

  const [plan, setPlan]           = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading]     = useState(false);
  const [showTourOffer, setShowTourOffer] = useState(false);

  const fromOnboarding = (location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding;
  const isPremium      = userProfile.plan === 'premium';

  // Already premium and coming from onboarding (repeat-tester): skip to tour offer
  useEffect(() => {
    if (fromOnboarding && isPremium && !localStorage.getItem('ledgr_tour_done')) {
      setShowTourOffer(true);
    }
  }, []);

  function handleBack() {
    navigate(fromOnboarding ? '/' : '/profile', { replace: !!fromOnboarding });
  }

  async function handleStartTrial() {
    setLoading(true);
    try {
      // ── RevenueCat: replace this block with real purchase ──────────────────
      // const offering = await rcGetOffering();
      // const pkg = offering?.availablePackages.find(p => p.packageType === (plan === 'yearly' ? 'ANNUAL' : 'MONTHLY'));
      // if (!pkg) throw new Error('Package not found');
      // const ok = await rcPurchase(pkg);
      // if (!ok) throw new Error('Purchase failed or not entitled');
      // ──────────────────────────────────────────────────────────────────────
      await new Promise(r => setTimeout(r, 1200)); // demo delay
      updateUserProfile({ plan: 'premium', trialStartDate: new Date().toISOString() });
      if (fromOnboarding) {
        setShowTourOffer(true);
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    // ── RevenueCat restore ────────────────────────────────────────────────────
    // const ok = await rcRestore();
    // if (ok) { updateUserProfile({ plan: 'premium' }); navigate('/'); }
    // else { alert('No active subscription found.'); }
    // ─────────────────────────────────────────────────────────────────────────
    alert('Restore purchases coming soon.');
  }

  // ── Tour offer screen ──────────────────────────────────────────────────────
  if (showTourOffer) {
    return (
      <div
        className="flex flex-col items-center justify-center px-6 bg-gray-50 dark:bg-gray-950"
        style={{ height: '100dvh' }}
      >
        <div className="flex flex-col items-center gap-5 w-full max-w-[340px]">
          <div className="w-20 h-20 rounded-3xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-sm">
            <span className="text-5xl">🗺️</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('tour.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('tour.desc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { startTour(); navigate('/', { replace: true }); }}
            className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base shadow-lg shadow-green-600/25 active:scale-[0.98] transition-all"
          >
            {t('tour.start')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm"
          >
            {t('tour.skip')}
          </button>
        </div>
      </div>
    );
  }

  // ── Main subscription screen ───────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-white dark:bg-gray-950" style={{ height: '100dvh' }}>

      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-4 flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-5 pb-4 space-y-5"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Hero */}
        <div className="text-center pt-2 pb-1">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[18px] bg-green-600 shadow-lg shadow-green-600/30 mb-4">
            <span className="text-white font-black text-2xl tracking-tighter">l</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
            {isPremium ? 'You\'re on Premium' : 'Try Kachingo Premium'}
          </h1>
          {!isPremium && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {TRIAL_DAYS} days free · cancel anytime
            </p>
          )}
        </div>

        {/* Plan toggle — only for non-premium */}
        {!isPremium && (
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1">
            {(['yearly', 'monthly'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPlan(p)}
                className={`flex-1 rounded-xl py-3 px-3 transition-all flex flex-col items-center gap-0.5 ${
                  plan === p
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : ''
                }`}
              >
                <span className={`text-sm font-bold capitalize ${plan === p ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {p}
                </span>
                <span className={`text-xs font-semibold ${plan === p ? 'text-green-600' : 'text-gray-300 dark:text-gray-600'}`}>
                  {p === 'monthly' ? `$${MONTHLY_PRICE}/mo` : `$${YEARLY_MONTHLY}/mo`}
                </span>
                {p === 'yearly' && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    plan === 'yearly'
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}>
                    Save {YEARLY_SAVE}%
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Price summary */}
        {!isPremium && (
          <div className="rounded-2xl border border-green-100 dark:border-green-800/40 bg-green-50 dark:bg-green-900/15 px-4 py-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-gray-900 dark:text-white">
                ${plan === 'monthly' ? MONTHLY_PRICE : YEARLY_MONTHLY}
              </span>
              <span className="text-sm text-gray-400 font-medium">/month</span>
              {plan === 'yearly' && (
                <span className="text-xs text-gray-400 ml-1 font-medium">
                  (${YEARLY_PRICE} billed yearly)
                </span>
              )}
            </div>
            <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-0.5">
              First {TRIAL_DAYS} days free — no charge until trial ends
            </p>
          </div>
        )}

        {/* Already premium badge */}
        {isPremium && (
          <div className="rounded-2xl border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/20 px-4 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
              <Check size={18} className="text-white" strokeWidth={3} />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300">All features unlocked</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Thank you for being a Premium member</p>
            </div>
          </div>
        )}

        {/* Feature list */}
        <div className="space-y-2">
          {FEATURES.map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-800"
            >
              <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white leading-snug">{label}</p>
                <p className="text-xs text-gray-400 leading-snug">{sub}</p>
              </div>
              <Check size={14} className="text-green-500 flex-shrink-0 ml-auto" strokeWidth={3} />
            </div>
          ))}
        </div>

        {/* Trust row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
            <Shield size={14} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-gray-700 dark:text-white leading-tight">Secure payment</p>
              <p className="text-[10px] text-gray-400 leading-tight">Powered by RevenueCat</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
            <RefreshCw size={14} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-gray-700 dark:text-white leading-tight">Cancel anytime</p>
              <p className="text-[10px] text-gray-400 leading-tight">No lock-in, no hassle</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA footer — always visible, never scrolled away */}
      <div className="flex-shrink-0 px-5 pt-3 pb-8 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        {!isPremium ? (
          <>
            <button
              type="button"
              onClick={handleStartTrial}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-base shadow-lg shadow-green-600/25 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                `Start ${TRIAL_DAYS}-Day Free Trial`
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2 leading-relaxed">
              No charge until trial ends. Auto-renews at{' '}
              {plan === 'yearly' ? `$${YEARLY_PRICE}/year` : `$${MONTHLY_PRICE}/month`}.
            </p>
            <button
              type="button"
              onClick={handleRestore}
              className="w-full mt-2 py-2 text-xs text-gray-400 font-medium"
            >
              Restore Purchases
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="w-full py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-base active:scale-[0.98] transition-transform"
          >
            Back to App
          </button>
        )}
      </div>
    </div>
  );
}
