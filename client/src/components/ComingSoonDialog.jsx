import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ClockIcon } from "./Icons";

// Popup "Tính năng đang được cập nhật".
// Dùng thẻ <dialog> có sẵn của trình duyệt: tự đóng khi bấm Esc, tự giữ focus trong popup.
export default function ComingSoonDialog({ open, onClose }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);

  // Mở / đóng popup theo prop open
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Bấm ra vùng tối bên ngoài thì đóng (khi đó event.target chính là thẻ dialog)
  function handleClick(event) {
    if (event.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleClick}
      aria-labelledby="coming-soon-title"
      className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/60 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <ClockIcon className="h-6 w-6" />
        </span>
        <h2 id="coming-soon-title" className="mt-4 text-lg font-semibold">
          {t("comingSoon.title")}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t("comingSoon.zalo")}
        </p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {t("comingSoon.ok")}
        </button>
      </div>
    </dialog>
  );
}
