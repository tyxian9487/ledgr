import { X } from 'lucide-react';

interface Props {
  type: 'terms' | 'privacy';
  onClose: () => void;
}

const TERMS = [
  { title: '1. Acceptance of Terms', body: 'By using ledgr you agree to these terms and conditions. If you do not agree, please do not use the app.' },
  { title: '2. Data Storage', body: 'All financial data is stored locally on your device using browser localStorage. We do not transmit or upload your personal financial information to any server.' },
  { title: '3. Privacy', body: 'Your privacy is important to us. We collect only the minimal data necessary for app functionality. See our Privacy Policy for full details.' },
  { title: '4. AI Receipt Capture', body: 'The AI receipt scanning feature is provided as-is. Always verify captured data before confirming a transaction.' },
  { title: '5. Financial Advice Disclaimer', body: 'ledgr is a tracking and budgeting tool only. It does not provide financial advice, investment recommendations, or tax guidance. Consult a qualified financial advisor for personal finance decisions.' },
  { title: '6. Account Security', body: 'You are responsible for maintaining the confidentiality of your account. We are not liable for any unauthorised access resulting from your failure to keep credentials secure.' },
  { title: '7. Limitation of Liability', body: 'We are not liable for any financial decisions made based on information displayed in the app, or for any data loss resulting from clearing browser storage.' },
  { title: '8. Updates', body: 'We reserve the right to update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.' },
];

const PRIVACY = [
  { title: '1. Information We Collect', body: 'ledgr collects only the information you enter directly: transaction details, budget settings, profile name, and currency preference. We do not collect device identifiers, location data, or any analytics.' },
  { title: '2. How We Store Your Data', body: 'All data is stored locally in your browser\'s localStorage on your device. It never leaves your device and is not transmitted to any server or third party.' },
  { title: '3. Third-Party Sign-In', body: 'Sign-in with Google or Apple is presented as an option for user convenience. In the current version, authentication is handled locally. If cloud authentication is added in future, this policy will be updated.' },
  { title: '4. Data Sharing', body: 'We do not sell, trade, or rent your personal information to third parties. We do not use your data for advertising or profiling.' },
  { title: '5. Data Deletion', body: 'You can delete all your data at any time by going to Profile → Clear All Data. This permanently removes all locally stored information.' },
  { title: '6. Cookies & Tracking', body: 'ledgr does not use cookies, trackers, analytics SDKs, or any form of behavioural tracking.' },
  { title: '7. Children\'s Privacy', body: 'ledgr is not directed at children under the age of 13. We do not knowingly collect information from children.' },
  { title: '8. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. We will notify users of significant changes through the app.' },
  { title: '9. Contact', body: 'If you have questions about this Privacy Policy, please open a support request via the Help & FAQ section in the app.' },
];

export default function LegalSheet({ type, onClose }: Props) {
  const isTerms = type === 'terms';
  const items = isTerms ? TERMS : PRIVACY;
  const title = isTerms ? 'Terms & Conditions' : 'Privacy Policy';

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white dark:bg-gray-900 rounded-t-3xl animate-slide-up flex flex-col overflow-hidden"
        style={{ maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold dark:text-white">{title}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Last updated May 2026</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
          >
            <X size={16} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
          {items.map(item => (
            <div key={item.title}>
              <p className="text-sm font-bold dark:text-white mb-1">{item.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 pt-3 pb-8 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-green-600 text-white font-bold text-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
