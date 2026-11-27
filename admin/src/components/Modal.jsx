import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "./Icons";

// Khung popup dùng chung (form thêm nhân viên, hiện mật khẩu...).
// Dùng thẻ <dialog> có sẵn: tự giữ focus trong popup, Esc để đóng.
// busy = true (đang lưu) thì không cho đóng, tránh mất dữ liệu đang gửi.
export default function Modal({ open, title, onClose, busy, children }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc: trình duyệt tự đóng dialog, ta chặn lại để tự quyết định (vd đang lưu thì không đóng)
  function handleCancelEvent(event) {
    event.preventDefault();
    if (!busy) {
      onClose();
    }
  }

  // Bấm ra vùng tối bên ngoài thì đóng (khi đó event.target chính là thẻ dialog)
  function handleClick(event) {
    if (event.target === dialogRef.current && !busy) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancelEvent}
      onClick={handleClick}
      aria-labelledby="modal-title"
      className="fixed inset-0 m-auto h-fit max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/60 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label={t("common.close")}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
