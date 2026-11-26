import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi.json";
import en from "./locales/en.json";

const LANGUAGE_KEY = "language";
const SUPPORTED = ["vi", "en"];

// Ưu tiên ngôn ngữ đã chọn trước đó, chưa chọn thì mặc định tiếng Việt
function getInitialLanguage() {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (SUPPORTED.includes(saved)) {
    return saved;
  }
  return "vi";
}

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: "vi",
  supportedLngs: SUPPORTED,
  interpolation: { escapeValue: false }, // React tự chống XSS rồi
});

// Lưu lại mỗi khi đổi ngôn ngữ để F5 không bị mất
i18n.on("languageChanged", (language) => {
  localStorage.setItem(LANGUAGE_KEY, language);
  document.documentElement.lang = language;
});

export default i18n;
