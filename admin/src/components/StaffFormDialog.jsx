import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import { TextField, SelectField, ErrorMessage } from "./FormFields";
import { createStaff } from "../api/client";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "sale",
  staffCode: "",
};

// Popup "Thêm nhân viên". Tạo xong gọi onCreated({ user, password }) để trang hiện mật khẩu.
export default function StaffFormDialog({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  function handleChange(event) {
    const target = event.target;
    setForm((prev) => ({ ...prev, [target.name]: target.value }));
  }

  // Đóng thì xoá form, lần sau mở lại là form trống
  function handleClose() {
    setForm(EMPTY_FORM);
    setErrorCode("");
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrorCode("");

    try {
      const result = await createStaff(form);
      setForm(EMPTY_FORM);
      onCreated(result);
    } catch (err) {
      setErrorCode(err.code);
    }
    setSaving(false);
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }

  let submitText = t("admin.users.createStaff");
  if (saving) {
    submitText = t("admin.common.saving");
  }

  const roleOptions = [
    { value: "sale", label: t("userRole.sale") },
    { value: "admin", label: t("userRole.admin") },
  ];

  return (
    <Modal open={open} title={t("admin.users.addStaff")} onClose={handleClose} busy={saving}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={errorMessage} />

        <TextField
          label={t("auth.name")}
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <TextField
          label={t("auth.email")}
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          hint={t("admin.users.emailHint")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("admin.users.phone")}
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="09xxxxxxxx"
          />
          <SelectField
            label={t("admin.users.role")}
            name="role"
            value={form.role}
            onChange={handleChange}
            options={roleOptions}
            required
          />
        </div>
        <TextField
          label={t("admin.users.staffCode")}
          name="staffCode"
          value={form.staffCode}
          onChange={handleChange}
          placeholder={t("admin.users.staffCodeAuto")}
          hint={t("admin.users.staffCodeHint")}
        />

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("admin.users.inviteHint")}
        </p>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
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
