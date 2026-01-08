import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import commonEN from './locales/en/common.json';
import dashboardEN from './locales/en/dashboard.json';
import formsEN from './locales/en/forms.json';
import modalsEN from './locales/en/modals.json';
import guideEN from './locales/en/guide.json';
import coffeeEN from './locales/en/coffee.json';

import commonZH from './locales/zh/common.json';
import dashboardZH from './locales/zh/dashboard.json';
import formsZH from './locales/zh/forms.json';
import modalsZH from './locales/zh/modals.json';
import guideZH from './locales/zh/guide.json';
import coffeeZH from './locales/zh/coffee.json';

const resources = {
  en: {
    common: commonEN,
    dashboard: dashboardEN,
    forms: formsEN,
    modals: modalsEN,
    guide: guideEN,
    coffee: coffeeEN,
  },
  zh: {
    common: commonZH,
    dashboard: dashboardZH,
    forms: formsZH,
    modals: modalsZH,
    guide: guideZH,
    coffee: coffeeZH,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'forms', 'modals', 'guide', 'coffee'],

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'beankeeper_language',
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Disable suspense (use loading fallback instead)
    },
  });

export default i18n;
