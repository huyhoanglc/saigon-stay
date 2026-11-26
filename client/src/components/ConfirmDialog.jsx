import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AlertIcon, LogOutIcon } from "./Icons";

// Popup xác nhận trước khi làm việc quan trọng (xoá, khoá tài khoản...).
// Dùng thẻ <dialog> có sẵn của trình duyệt: tự giữ focus trong popup, Esc để đóng.
//
// Cách dùng ở trang:
//   const [confirmState, setConfirmState] = useState(null);
//   setConfirmState({ title, message, confirmLabel, tone, action: async () => {...} });
//   <ConfirmDialog state={confirmState} busy={busy} onConfirm={...} onCancel={...} />
export default function ConfirmDialog({ state, busy, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const open = state !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc: trình duyệt sẽ tự đóng dialog, ta chặn lại khi đang xử lý
  function handleCancelEvent(event) {
    event.preventDefault();
    if (!busy) {
      onCancel();
    }
  }

  // Bấm ra vùng tối bên ngoài thì huỷ (khi đó event.target chính là thẻ dialog)
  function handleClick(event) {
    if (event.target === dialogRef.current && !busy) {
      onCancel();
    }
  }

  let title = "";
  let message = "";
  let confirmLabel = t("confirm.ok");
  if (state) {
    title = state.title;
    message = state.message;
    if (state.confirmLabel) {
      confirmLabel = state.confirmLabel;
    }
  }

  let confirmText = confirmLabel;
  if (busy) {
    confirmText = t("confirm.processing");
  }

  // tone "danger" (mặc định): xoá, khoá... → màu đỏ, icon cảnh báo.
  // tone "neutral": việc không mất dữ liệu như đăng xuất → màu emerald, icon đăng xuất.
  let iconBoxClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300";
  let icon = <AlertIcon className="h-5 w-5" />;
  let confirmButtonClass =
    "rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60";
  if (state && state.tone === "neutral") {
    iconBoxClass =
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    icon = <LogOutIcon className="h-5 w-5" />;
    confirmButtonClass =
      "rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60";
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancelEvent}
      onClick={handleClick}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/60 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="p-6">
        <div className="flex gap-4">
          <span className={iconBoxClass}>{icon}</span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p
              id="confirm-message"
              className="mt-2 text-sm text-slate-600 dark:text-slate-300"
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {/* autoFocus vào nút Huỷ: lỡ bấm Enter thì không làm mất dữ liệu */}
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            autoFocus
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t("confirm.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={confirmButtonClass}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  );
}
