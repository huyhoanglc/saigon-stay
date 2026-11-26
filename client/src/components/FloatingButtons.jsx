import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { ArrowUpIcon, SunIcon, MoonIcon } from "./Icons";

export default function FloatingButtons() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Cuộn xuống quá 400px thì hiện nút "lên đầu trang"
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function handleBackToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const buttonClass =
    "flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  let themeIcon;
  let themeLabel;
  if (theme === "dark") {
    themeIcon = <SunIcon className="h-5 w-5" />;
    themeLabel = t("theme.light");
  } else {
    themeIcon = <MoonIcon className="h-5 w-5" />;
    themeLabel = t("theme.dark");
  }

  let backToTopButton = null;
  if (showBackToTop) {
    backToTopButton = (
      <button
        type="button"
        onClick={handleBackToTop}
        className={buttonClass}
        aria-label={t("common.backToTop")}
        title={t("common.backToTop")}
      >
        <ArrowUpIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      {backToTopButton}
      <button
        type="button"
        onClick={toggleTheme}
        className={buttonClass}
        aria-label={themeLabel}
        title={themeLabel}
      >
        {themeIcon}
      </button>
    </div>
  );
}
