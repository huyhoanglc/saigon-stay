import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import vi from "./locales/vi.json";
import en from "./locales/en.json";

i18n
  .use(LanguageDetector) // tự phát hiện ngôn ngữ
  .use(initReactI18next) // nối với React
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: "en", // không xác định được ngôn ngữ → dùng tiếng Việt
    supportedLngs: ["vi", "en"],
    interpolation: { escapeValue: false }, // React tự chống XSS rồi
    detection: {
      order: ["localStorage", "navigator"], // ưu tiên lựa chọn đã lưu, sau đó tới ngôn ngữ trình duyệt
      caches: ["localStorage"], // lưu lựa chọn để F5 không bị mất
    },
  });

export default i18n;
