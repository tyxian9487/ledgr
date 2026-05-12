import { useState } from 'react';
import { ArrowLeft, Check, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const MONTHLY_PRICE = 19.99;
const YEARLY_PRICE = 199.99;
const YEARLY_MONTHLY_AVG = (YEARLY_PRICE / 12).toFixed(2);
const YEARLY_SAVINGS = ((MONTHLY_PRICE * 12) - YEARLY_PRICE).toFixed(2);

const FEATURES = [
  'Unlimited transaction history',
  'AI receipt capture',
  'Advanced analytics & reports',
  'Auto-debit scheduling',
  'Export to CSV & PDF',
  'Priority support',
];

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useApp();
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');
  const [showPayment, setShowPayment] = useState(false);

  function handleSubscribe() {
    setShowPayment(true);
  }

  function handleConfirmPayment() {
    updateUserProfile({ plan: 'premium' });
    setShowPayment(false);
    navigate('/profile');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 px-5 pt-12 pb-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-bold dark:text-white">Subscription Plan</h1>
      </div>

      {/* Hero */}
      <div className="px-5 pt-6 pb-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-600/30">
          <Star size={28} className="text-white" fill="white" />
        </div>
        <h2 className="text-xl font-black dark:text-white">Go Premium</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Unlock the full power of ledgr</p>
      </div>

      {/* Plans */}
      <div className="px-5 space-y-4">

        {/* Monthly */}
        <button
          type="button"
          onClick={() => setSelected('monthly')}
          className={`w-full rounded-3xl p-5 text-left border-2 transition-all duration-200 bg-white dark:bg-gray-900 ${
            selected === 'monthly'
              ? 'border-green-500 shadow-md'
              : 'border-gray-100 dark:border-gray-800'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-base dark:text-white">Monthly</p>
              <p className="text-xs text-gray-400 mt-0.5">Billed every month</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900 dark:text-white">${MONTHLY_PRICE}</p>
              <p className="text-xs text-gray-400">/month</p>
            </div>
          </div>
          <div className={`mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${selected === 'monthly' ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
            {selected === 'monthly' && <Check size={12} className="text-white" strokeWidth={3} />}
          </div>
        </button>

        {/* Yearly — Suggested */}
        <button
          type="button"
          onClick={() => setSelected('yearly')}
          className={`w-full rounded-3xl p-5 text-left border-2 transition-all duration-200 relative overflow-hidden ${
            selected === 'yearly'
              ? 'border-green-500 bg-white dark:bg-gray-900 shadow-[0_0_24px_4px_rgba(34,197,94,0.25)]'
              : 'border-green-200 dark:border-green-900/40 bg-white dark:bg-gray-900'
          }`}
        >
          {/* Suggested badge */}
          <div className="absolute top-0 right-0 bg-green-600 px-3 py-1 rounded-bl-2xl rounded-tr-3xl">
            <div className="flex items-center gap-1">
              <Zap size={11} className="text-white" fill="white" />
              <span className="text-white text-[11px] font-bold">Suggested</span>
            </div>
          </div>

          <div className="flex items-start justify-between pr-20">
            <div>
              <p className="font-bold text-base dark:text-white">Yearly</p>
              <p className="text-xs text-gray-400 mt-0.5">Billed once a year</p>
              <span className="inline-block mt-2 text-[11px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold px-2 py-0.5 rounded-full">
                Save ${YEARLY_SAVINGS}/year
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900 dark:text-white">${YEARLY_PRICE}</p>
              <p className="text-xs text-gray-400">/year</p>
            </div>
          </div>

          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
            That's only <strong>${YEARLY_MONTHLY_AVG}/mo</strong> on average
          </p>

          <div className={`mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${selected === 'yearly' ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
            {selected === 'yearly' && <Check size={12} className="text-white" strokeWidth={3} />}
          </div>
        </button>
      </div>

      {/* Features */}
      <div className="px-5 mt-6">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">What's included</p>
        <div className="bg-white dark:bg-gray-900 rounded-3xl divide-y divide-gray-50 dark:divide-gray-800 border border-gray-100 dark:border-gray-800">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-3 px-4 py-3">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check size={11} className="text-green-600" strokeWidth={3} />
              </div>
              <span className="text-sm dark:text-white">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribe button */}
      <div className="px-5 mt-6">
        {userProfile.plan === 'premium' ? (
          <div className="w-full py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-center">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">You're already on Premium</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base shadow-lg shadow-green-600/30 active:scale-[0.98] transition-transform"
          >
            Subscribe {selected === 'monthly' ? `· $${MONTHLY_PRICE}/mo` : `· $${YEARLY_PRICE}/yr`}
          </button>
        )}
        <p className="text-center text-[11px] text-gray-400 mt-3">
          Cancel anytime · Secure payment · {selected === 'yearly' ? 'Annual' : 'Monthly'} billing
        </p>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowPayment(false)}
        >
          <div
            className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <h3 className="text-lg font-bold dark:text-white text-center mb-1">Confirm Payment</h3>
            <p className="text-center text-sm text-gray-400 mb-6">
              {selected === 'monthly' ? `$${MONTHLY_PRICE}/month` : `$${YEARLY_PRICE}/year`} · ledgr Premium
            </p>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Plan</span>
                <span className="font-semibold dark:text-white capitalize">{selected}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Amount</span>
                <span className="font-semibold dark:text-white">
                  {selected === 'monthly' ? `$${MONTHLY_PRICE}` : `$${YEARLY_PRICE}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Billing</span>
                <span className="font-semibold dark:text-white">
                  {selected === 'monthly' ? 'Every month' : 'Once a year'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base shadow-lg shadow-green-600/30 active:scale-[0.98] transition-transform mb-3"
            >
              Pay with Apple Pay / Google Pay
            </button>
            <button
              type="button"
              onClick={() => setShowPayment(false)}
              className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
