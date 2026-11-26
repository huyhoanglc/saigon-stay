import { useTranslation } from "react-i18next";
import viFlag from "../assets/flags/vi.svg";
import enFlag from "../assets/flags/en.svg";

function RoundFlag({ src, className }) {
  return (
    <span
      className={
        "block shrink-0 overflow-hidden rounded-full ring-1 ring-black/10 " +
        className
      }
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  const isEnglish = i18n.language === "en";

  function handleToggle() {
    if (isEnglish) {
      i18n.changeLanguage("vi");
    } else {
      i18n.changeLanguage("en");
    }
  }

  // Nền trắng trượt sang bên đang chọn
  let pillClass =
    "absolute left-1 top-1 h-7 w-12 rounded-full bg-white shadow transition-transform duration-300 dark:bg-slate-900";
  if (isEnglish) {
    pillClass = pillClass + " translate-x-12";
  } else {
    pillClass = pillClass + " translate-x-0";
  }

  const activeTextClass = "text-slate-900 dark:text-white";
  const inactiveTextClass = "text-slate-500 dark:text-slate-400";

  let viTextClass;
  let viFlagClass;
  let enTextClass;
  let enFlagClass;
  if (isEnglish) {
    viTextClass = inactiveTextClass;
    viFlagClass = "h-4 w-4 opacity-50";
    enTextClass = activeTextClass;
    enFlagClass = "h-4 w-4";
  } else {
    viTextClass = activeTextClass;
    viFlagClass = "h-4 w-4";
    enTextClass = inactiveTextClass;
    enFlagClass = "h-4 w-4 opacity-50";
  }

  let currentLabel = "Tiếng Việt";
  if (isEnglish) {
    currentLabel = "English";
  }

  const halfClass =
    "relative z-10 flex h-7 w-12 items-center justify-center gap-1 text-xs font-semibold transition-colors";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEnglish}
      onClick={handleToggle}
      aria-label={t("language.label") + ": " + currentLabel}
      title={t("language.label") + ": " + currentLabel}
      className="relative flex h-9 w-[104px] shrink-0 items-center rounded-full bg-slate-200 p-1 transition hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
    >
      <span className={pillClass} />

      <span className={halfClass + " " + viTextClass}>
        <RoundFlag src={viFlag} className={viFlagClass} />
        VI
      </span>

      <span className={halfClass + " " + enTextClass}>
        <RoundFlag src={enFlag} className={enFlagClass} />
        EN
      </span>
    </button>
  );
}
