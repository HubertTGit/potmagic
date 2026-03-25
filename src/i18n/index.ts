import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/en.json";
import de from "@/i18n/de.json";

function detectBrowserLocale(): 'en' | 'de' {
  if (typeof navigator === 'undefined') return 'en'; // SSR
  const lang = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase();
  return lang.startsWith('de') ? 'de' : 'en';
}

i18n.use(initReactI18next).init({
  lng: detectBrowserLocale(),
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
