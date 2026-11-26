import { useTranslation } from "react-i18next";

export default function App() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => i18n.changeLanguage("vi")}
          className={
            i18n.language === "vi"
              ? "font-bold text-emerald-700"
              : "text-slate-500"
          }
        >
          VI
        </button>
        <button
          onClick={() => i18n.changeLanguage("en")}
          className={
            i18n.language === "en"
              ? "font-bold text-emerald-700"
              : "text-slate-500"
          }
        >
          EN
        </button>
      </div>

      <h1 className="text-3xl font-bold text-emerald-700">{t("app.title")}</h1>
      <p className="text-slate-600">{t("app.subtitle")}</p>
      <p className="mt-4 text-red-600">{t("errors.ROOM_NOT_FOUND")}</p>
    </div>
  );
}
