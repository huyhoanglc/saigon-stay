import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import { CopyIcon, CheckIcon, AlertIcon } from "./Icons";

// Hiện thông tin đăng nhập vừa tạo (tạo nhân viên / đặt lại mật khẩu).
// result: { name, email, password, staffCode } hoặc null (đóng).
// Mật khẩu chỉ hiện ở đây đúng 1 lần: server lưu bản đã băm, không lấy lại được.
export default function PasswordResultDialog({ result, title, onClose }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState("");

  async function handleCopy(key, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      // Trình duyệt chặn quyền clipboard → admin tự bôi đen copy, không cần báo lỗi
      setCopied("");
    }
  }

  function handleClose() {
    setCopied("");
    onClose();
  }

  let open = false;
  let rows = [];
  let allText = "";
  if (result) {
    open = true;
    rows = [
      { key: "email", label: t("auth.email"), value: result.email },
      { key: "password", label: t("auth.password"), value: result.password },
    ];
    if (result.staffCode) {
      rows.push({ key: "staffCode", label: t("admin.users.staffCode"), value: result.staffCode });
    }
    // Nội dung gửi nhanh cho nhân viên qua Zalo / tin nhắn
    allText = t("admin.users.loginInfoText", {
      name: result.name,
      email: result.email,
      password: result.password,
    });
  }

  function getCopyButton(key, text) {
    let icon = <CopyIcon className="h-4 w-4" />;
    let label = t("admin.users.copy");
    if (copied === key) {
      icon = <CheckIcon className="h-4 w-4 text-emerald-600" />;
      label = t("admin.users.copied");
    }
    return (
      <button
        type="button"
        onClick={() => handleCopy(key, text)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label={label + " " + key}
        title={label}
      >
        {icon}
      </button>
    );
  }

  let copyAllText = t("admin.users.copyAll");
  if (copied === "all") {
    copyAllText = t("admin.users.copied");
  }

  return (
    <Modal open={open} title={title} onClose={handleClose} busy={false}>
      <p className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        {t("admin.users.passwordOnce")}
      </p>

      <dl className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
          >
            <dt className="w-24 shrink-0 text-sm text-slate-500 dark:text-slate-400">{row.label}</dt>
            <dd className="min-w-0 flex-1 break-all font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
              {row.value}
            </dd>
            {getCopyButton(row.key, row.value)}
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => handleCopy("all", allText)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <CopyIcon className="h-4 w-4" />
          {copyAllText}
        </button>
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
