import { useTranslation } from "react-i18next";

export default function Pagination({ page, totalPages, onChange }) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  function handlePrev() {
    if (page > 1) {
      onChange(page - 1);
    }
  }

  function handleNext() {
    if (page < totalPages) {
      onChange(page + 1);
    }
  }

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  const buttonClass =
    "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700";

  return (
    <nav className="flex items-center justify-center gap-4 pt-4">
      <button
        type="button"
        className={buttonClass}
        disabled={isFirstPage}
        onClick={handlePrev}
      >
        ‹ {t("pagination.prev")}
      </button>

      <span className="text-sm text-slate-600 dark:text-slate-300">
        {t("pagination.page", { page: page, total: totalPages })}
      </span>

      <button
        type="button"
        className={buttonClass}
        disabled={isLastPage}
        onClick={handleNext}
      >
        {t("pagination.next")} ›
      </button>
    </nav>
  );
}
