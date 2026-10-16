const CONSENT_KEY = 'beankeeper_analytics_consent';
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || '';

export const isAnalyticsConfigured = /^G-[A-Z0-9]+$/i.test(measurementId);

type AnalyticsEvent = 'notion_login_start' | 'add_coffee_click' | 'coffee_added' | 'support_click';
type Consent = 'granted' | 'denied';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasPrivacySignal(): boolean {
  const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
  const privacyWindow = window as Window & { doNotTrack?: string };
  return privacyNavigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' ||
    privacyWindow.doNotTrack === '1';
}

export function getAnalyticsConsent(): Consent | null {
  if (!isAnalyticsConfigured || hasPrivacySignal()) return 'denied';
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(consent: Consent): void {
  try {
    localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // A browser with blocked storage stays untracked after a reload.
  }

  if (consent === 'denied' && window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'denied' });
  }
}

function ensureAnalyticsLoaded(): boolean {
  if (getAnalyticsConsent() !== 'granted') return false;
  if (window.gtag) return true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  return true;
}

export function trackPageView(): void {
  if (!ensureAnalyticsLoaded()) return;
  // Never send the OAuth callback query string, hash, or user content.
  window.gtag?.('event', 'page_view', {
    page_path: window.location.pathname,
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_title: document.title,
  });
}

export function trackEvent(event: AnalyticsEvent): void {
  if (!ensureAnalyticsLoaded()) return;
  window.gtag?.('event', event);
}
