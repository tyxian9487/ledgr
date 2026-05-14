import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// RevenueCat product identifiers — replace with your actual offering IDs
// import Purchases from '@revenuecat/purchases-js';
// const RC_API_KEY = 'your_revenuecat_web_billing_api_key';
// const MONTHLY_PRODUCT_ID = 'ledgr_premium_monthly';
// const YEARLY_PRODUCT_ID  = 'ledgr_premium_yearly';

const MONTHLY_PRICE = 4.99;
const YEARLY_PRICE = 29.99;
const YEARLY_MONTHLY_AVG = (YEARLY_PRICE / 12).toFixed(2);
const YEARLY_SAVINGS_PCT = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100);
const FREE_TRIAL_DAYS = 7;

const FEATURES = [
  'Unlimited transaction history',
  'AI receipt capture & scanning',
  'Advanced analytics & trends',
  'Auto-debit scheduling',
  'Smart budget goals',
  'Export to CSV & PDF',
  'Priority support',
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, updateUserProfile } = useApp();
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);

  const fromOnboarding = (location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding;

  function handleBack() {
    if (fromOnboarding) navigate('/', { replace: true });
    else navigate('/profile');
  }

  async function handleStartTrial() {
    setLoading(true);
    try {
      // RevenueCat integration:
      // await Purchases.configure({ apiKey: RC_API_KEY });
      // const offerings = await Purchases.getOfferings();
      // const pkg = selected === 'yearly'
      //   ? offerings.current?.annual
      //   : offerings.current?.monthly;
      // const { customerInfo } = await Purchases.purchasePackage(pkg!);
      // const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

      // Demo simulation:
      await new Promise(r => setTimeout(r, 1300));
      updateUserProfile({ plan: 'premium' });
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    // RevenueCat restore:
    // const { customerInfo } = await Purchases.restorePurchases();
    // handle entitlements...
    alert('Restore purchases coming soon.');
  }

  const isPremium = userProfile.plan === 'premium';

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: '100dvh', background: 'linear-gradient(170deg, #052e16 0%, #14532d 35%, #16a34a 70%, #4ade80 100%)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-14 pb-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        {fromOnboarding && (
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="text-white/60 text-sm font-medium px-2"
          >
            Skip
          </button>
        )}
      </div>

      {/* Hero */}
      <div className="flex-shrink-0 flex flex-col items-center pt-2 pb-5 px-8 text-center gap-3">
        <div className="w-16 h-16 rounded-[22px] bg-white/15 border border-white/25 flex items-center justify-center shadow-2xl">
          <span className="text-white font-black text-3xl tracking-tighter">l</span>
        </div>
        <div>
          <h1 className="text-white font-black text-2xl">Try ledgr Premium</h1>
          <p className="text-green-100/80 text-sm mt-1">
            {FREE_TRIAL_DAYS} days free, then cancel anytime
          </p>
        </div>

        {/* Trial badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 rounded-full px-4 py-1.5">
          <Sparkles size={12} className="text-yellow-300" />
          <span className="text-white text-xs font-bold">{FREE_TRIAL_DAYS}-Day Free Trial</span>
        </div>
      </div>

      {/* Bottom sheet */}
      <div
        className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-950 rounded-t-3xl flex flex-col"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="flex-1 px-5 pt-6 space-y-4 pb-2">
          {/* Plan toggle */}
          {!isPremium && (
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1">
              {(['monthly', 'yearly'] as const).map(plan => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setSelected(plan)}
                  className={`flex-1 rounded-xl py-3 px-2 text-sm font-bold transition-all flex flex-col items-center gap-0.5 ${
                    selected === plan
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-400'
                  }`}
                >
                  <span className="capitalize">{plan}</span>
                  <span className={`text-xs font-semibold ${selected === plan ? 'text-green-600' : 'text-gray-300 dark:text-gray-600'}`}>
                    {plan === 'monthly'
                      ? `$${MONTHLY_PRICE}/mo`
                      : `$${YEARLY_MONTHLY_AVG}/mo`}
                  </span>
                  {plan === 'yearly' && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      selected === 'yearly'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}>
                      Save {YEARLY_SAVINGS_PCT}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Price callout */}
          {!isPremium && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl px-4 py-3 border border-green-100 dark:border-green-800/40">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  ${selected === 'monthly' ? MONTHLY_PRICE : YEARLY_MONTHLY_AVG}
                </span>
                <span className="text-sm text-gray-400 font-medium">/month</span>
                {selected === 'yearly' && (
                  <span className="text-[11px] text-gray-400 ml-1">(${YEARLY_PRICE} billed yearly)</span>
                )}
              </div>
              <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-1">
                First {FREE_TRIAL_DAYS} days free — charged after trial ends
              </p>
            </div>
          )}

          {isPremium && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl px-4 py-4 border border-green-200 dark:border-green-800/40 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                <Check size={18} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <p className="text-sm font-bold text-green-800 dark:text-green-300">You're on Premium</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">All features unlocked</p>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800">
            {FEATURES.map(f => (
              <div key={f} className="flex items-center gap-3 px-4 py-3">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-green-600" strokeWidth={3} />
                </div>
                <span className="text-sm dark:text-white">{f}</span>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Shield, label: 'Secure payment', sub: 'Powered by RevenueCat' },
              { icon: RefreshCw, label: 'Cancel anytime', sub: 'No commitment' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
                <Icon size={14} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-bold dark:text-white leading-tight">{label}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA footer */}
        <div className="flex-shrink-0 px-5 pt-3 pb-8 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          {!isPremium ? (
            <>
              <button
                type="button"
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-base shadow-lg shadow-green-600/30 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  `Start ${FREE_TRIAL_DAYS}-Day Free Trial`
                )}
              </button>

              <p className="text-center text-[10px] text-gray-400 mt-2.5 leading-relaxed">
                No charge until trial ends. Subscription auto-renews at&nbsp;
                {selected === 'yearly' ? `$${YEARLY_PRICE}/year` : `$${MONTHLY_PRICE}/month`}.
                Cancel anytime in settings.
              </p>

              <button
                type="button"
                onClick={handleRestore}
                className="w-full mt-3 py-2 text-xs text-gray-400 font-medium"
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
              Go to App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
