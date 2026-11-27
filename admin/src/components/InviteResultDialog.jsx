import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import { CheckIcon, CopyIcon, AlertIcon } from "./Icons";

// Kết quả sau khi tạo nhân viên / gửi lại email.
// result: { title, name, email, emailSent, link?, mailError? } hoặc null (đóng).
// Gửi mail lỗi thì hiện link để admin tự gửi cho nhân viên (qua Zalo, tin nhắn...).
export default function InviteResultDialog({ result, onClose }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
    } catch {
      // Trình duyệt chặn clipboard → admin tự bôi đen ô link để copy
      setCopied(false);
    }
  }

  function handleClose() {
    setCopied(false);
    onClose();
  }

  let open = false;
  let title = "";
  let content = null;

  if (result) {
    open = true;
    title = result.title;

    if (result.emailSent) {
      content = (
        <p className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("admin.users.emailSentTo", { name: result.name, email: result.email })}</span>
        </p>
      );
    } else {
      let reason = t("admin.users.mailFailed");
      if (result.mailError === "MAIL_NOT_CONFIGURED") {
        reason = t("admin.users.mailNotConfigured");
      }

      let copyText = t("admin.users.copyLink");
      let copyIcon = <CopyIcon className="h-4 w-4" />;
      if (copied) {
        copyText = t("admin.users.copied");
        copyIcon = <CheckIcon className="h-4 w-4" />;
      }

      content = (
        <div className="space-y-3">
          <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{reason}</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("admin.users.sendLinkManually", { name: result.name })}
          </p>
          {/* Ô chỉ đọc: bấm vào là chọn cả link, dễ copy tay nếu nút sao chép bị chặn */}
          <input
            type="text"
            readOnly
            value={result.link}
            onFocus={(e) => e.target.select()}
            aria-label={t("admin.users.inviteLink")}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copyIcon}
            {copyText}
          </button>
        </div>
      );
    }
  }

  return (
    <Modal open={open} title={title} onClose={handleClose} busy={false}>
      {content}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {t("admin.users.done")}
        </button>
      </div>
    </Modal>
  );
}
