import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import {
  getAnalyticsConsent,
  hasPrivacySignal,
  isAnalyticsConfigured,
  setAnalyticsConsent,
  trackPageView,
} from '@/lib/analytics';

type AnalyticsContextValue = { openSettings: () => void };
const AnalyticsContext = createContext<AnalyticsContextValue>({ openSettings: () => {} });

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const [path] = useLocation();
  const [consent, setConsent] = useState(getAnalyticsConsent);
  const [showSettings, setShowSettings] = useState(consent === null);
  const available = isAnalyticsConfigured && !hasPrivacySignal();

  useEffect(() => {
    if (consent === 'granted' && available) trackPageView();
  }, [path, consent, available]);

  const choose = (choice: 'granted' | 'denied') => {
    setAnalyticsConsent(choice);
    setConsent(choice);
    setShowSettings(false);
    if (choice === 'denied' && window.gtag) window.location.reload();
  };

  return (
    <AnalyticsContext.Provider value={{ openSettings: () => setShowSettings(true) }}>
      {children}
      {available && showSettings && (
        <section
          role="dialog"
          aria-label={t('analytics.title')}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border border-[#D4C5B0] bg-[#F5EFE7] p-4 shadow-xl"
        >
          <p className="font-serif font-semibold text-[#2C1810]">{t('analytics.title')}</p>
          <p className="mt-1 text-sm text-[#6F4E37]">{t('analytics.description')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => choose('granted')} className="rounded-lg bg-[#6F4E37] px-4 py-2 text-sm text-white">
              {t('analytics.allow')}
            </button>
            <button type="button" onClick={() => choose('denied')} className="rounded-lg border border-[#6F4E37] px-4 py-2 text-sm text-[#6F4E37]">
              {t('analytics.decline')}
            </button>
          </div>
        </section>
      )}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsSettings() {
  return {
    available: isAnalyticsConfigured && !hasPrivacySignal(),
    ...useContext(AnalyticsContext),
  };
}
