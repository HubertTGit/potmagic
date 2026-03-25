import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/en.json";
import de from "@/i18n/de.json";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
