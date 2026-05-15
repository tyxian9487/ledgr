import { X } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import type { TKey } from '../i18n/translations';

interface Props {
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export default function LegalSheet({ type, onClose }: Props) {
  const { t } = useTranslation();
  const isTerms = type === 'terms';

  const TERMS: { title: string; body: string }[] = [
    { title: t('terms.t1'), body: t('terms.b1') },
    { title: t('terms.t2'), body: t('terms.b2') },
    { title: t('terms.t3'), body: t('terms.b3') },
    { title: t('terms.t4'), body: t('terms.b4') },
    { title: t('terms.t5'), body: t('terms.b5') },
    { title: t('terms.t6'), body: t('terms.b6') },
    { title: t('terms.t7'), body: t('terms.b7') },
    { title: t('terms.t8'), body: t('terms.b8') },
  ];

  const PRIVACY: { title: string; body: string }[] = [
    { title: t('privacy.t1'), body: t('privacy.b1') },
    { title: t('privacy.t2'), body: t('privacy.b2') },
    { title: t('privacy.t3'), body: t('privacy.b3') },
    { title: t('privacy.t4'), body: t('privacy.b4') },
    { title: t('privacy.t5'), body: t('privacy.b5') },
    { title: t('privacy.t6'), body: t('privacy.b6') },
    { title: t('privacy.t7'), body: t('privacy.b7') },
    { title: t('privacy.t8'), body: t('privacy.b8') },
    { title: t('privacy.t9'), body: t('privacy.b9') },
  ];

  const items = isTerms ? TERMS : PRIVACY;
  const title = isTerms ? t('profile.terms') : t('profile.privacy');

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
            <p className="text-[11px] text-gray-400 mt-0.5">{t('legal.last_updated')}</p>
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
            {t('legal.i_understand')}
          </button>
        </div>
      </div>
    </div>
  );
}
