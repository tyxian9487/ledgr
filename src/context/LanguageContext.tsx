import { createContext, useContext, useMemo } from 'react';
import { useApp } from './AppContext';
import { translations, TKey } from '../i18n/translations';

interface LanguageContextType {
  language: string;
  t: (key: TKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: (k) => k as string,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { userProfile } = useApp();
  const language = userProfile.language || 'en';

  const t = useMemo(() => {
    const dict = translations[language] ?? translations.en;
    return (key: TKey, params?: Record<string, string | number>): string => {
      let text = (dict[key] ?? (translations.en as Record<TKey, string>)[key] ?? key) as string;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
