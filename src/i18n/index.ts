import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { isRtl } from "./languages";
import ar from "./locales/ar.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // First visit with no stored choice uses Arabic
    fallbackLng: "ar",
    supportedLngs: ["en", "ar"],
    resources: {
      en: { common: en },
      ar: { common: ar },
    },
    ns: ["common"],
    defaultNS: "common",
    detection: {
      // Keep an explicit URL or a saved switcher choice; otherwise use Arabic
      order: ["querystring", "localStorage"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

// Sync <html dir/lang> with chosen language
const applyDir = (lng: string) => {
  const dir = isRtl(lng) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
};
// Ensure Arabic and RTL by default on first load (until detection resolves)
applyDir(i18n.resolvedLanguage || "ar");
i18n.on("languageChanged", applyDir);

// Ensure i18n is fully initialized before export
export default i18n;

// Export a function to check if i18n is ready
export const isI18nReady = (): boolean => {
  return i18n.isInitialized;
};
