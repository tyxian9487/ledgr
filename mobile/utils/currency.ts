import { CURRENCIES } from '../types';
import { translations } from '../i18n/translations';

export function getCurrencyDisplayName(code: string, locale = 'en'): string {
  try {
    // Use Intl.DisplayNames when available for proper localization
    // Some JS environments (older JSC) may not support it — fall back gracefully.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof Intl !== 'undefined' && (Intl as any).DisplayNames) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const dn = new (Intl as any).DisplayNames([locale], { type: 'currency' });
      const name = dn.of(code);
      if (name) return name;
    }
  } catch (e) {
    // ignore and fallback
  }

  // Fallback: check our i18n translation table for `currency.<CODE>` keys
  try {
    const dict = translations[locale] ?? translations.en;
    const key = `currency.${code}` as any;
    const translated = dict[key];
    if (translated) return translated;
  } catch (e) {
    // ignore and fall back to English names from CURRENCIES
  }

  const found = CURRENCIES.find(c => c.code === code);
  return found?.name ?? code;
}

export default getCurrencyDisplayName;
