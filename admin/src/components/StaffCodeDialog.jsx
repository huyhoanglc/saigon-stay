import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import { TextField, ErrorMessage } from "./FormFields";
import { updateUser } from "../api/client";

// Popup sửa mã nhân viên. user: người đang sửa (null = đóng).
// Để trống rồi lưu = tự cấp mã mới theo thứ tự (NV001, NV002...).
// key={user.id} ở trang cha để mỗi lần mở cho người khác thì ô nhập lấy lại mã của người đó.
export default function StaffCodeDialog({ user, onClose, onSaved }) {
  const { t } = useTranslation();
  let initialCode = "";
  if (user) {
    initialCode = user.staffCode;
  }
  const [code, setCode] = useState(initialCode);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  let open = false;
  let title = "";
  if (user) {
    open = true;
    title = t("admin.users.editStaffCode", { name: user.name });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrorCode("");
    try {
      await updateUser(user.id, { staffCode: code.trim() });
      onSaved();
    } catch (err) {
      setErrorCode(err.code);
    }
    setSaving(false);
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }

  let submitText = t("admin.common.save");
  if (saving) {
    submitText = t("admin.common.saving");
  }

  return (
    <Modal open={open} title={title} onClose={onClose} busy={saving}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={errorMessage} />
        <TextField
          label={t("admin.users.staffCode")}
          name="staffCode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("admin.users.staffCodeAuto")}
          hint={t("admin.users.staffCodeHint")}
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t("admin.common.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
