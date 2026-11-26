import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createInquiry } from "../../api/client";
import { CheckIcon } from "../Icons";

const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export default function InquiryForm({ roomId }) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [website, setWebsite] = useState(""); // ô bẫy bot

  const [status, setStatus] = useState("idle"); // idle | sending | success
  const [errorCode, setErrorCode] = useState(null);

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handlePhoneChange(event) {
    setPhone(event.target.value);
    setErrorCode(null);
  }

  function handleNoteChange(event) {
    setNote(event.target.value);
  }

  function handleStaffCodeChange(event) {
    setStaffCode(event.target.value);
  }

  function handleWebsiteChange(event) {
    setWebsite(event.target.value);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Kiểm tra số điện thoại trước khi gửi
    const cleanPhone = phone.replace(/[\s.-]/g, "");

    if (cleanPhone === "") {
      setErrorCode("PHONE_REQUIRED");
      return;
    }

    if (!PHONE_REGEX.test(cleanPhone)) {
      setErrorCode("PHONE_INVALID");
      return;
    }

    setStatus("sending");
    setErrorCode(null);

    try {
      await createInquiry({
        room: roomId,
        name: name,
        phone: cleanPhone,
        note: note,
        staffCode: staffCode,
        website: website,
      });

      setStatus("success");
      setName("");
      setPhone("");
      setNote("");
      setStaffCode("");
    } catch (err) {
      setErrorCode(err.code);
      setStatus("idle");
    }
  }

  function handleSendAnother() {
    setStatus("idle");
  }

  const labelClass =
    "flex flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400";
  const inputClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  // Gửi thành công
  if (status === "success") {
    return (
      <section
        id="inquiry"
        className="scroll-mt-24 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
          <CheckIcon className="h-6 w-6" />
        </div>
        <p className="font-medium text-emerald-800 dark:text-emerald-200">
          {t("inquiry.success")}
        </p>
        <button
          type="button"
          onClick={handleSendAnother}
          className="mt-3 text-sm text-emerald-700 underline dark:text-emerald-400"
        >
          {t("inquiry.sendAnother")}
        </button>
      </section>
    );
  }

  let errorMessage = null;
  if (errorCode) {
    errorMessage = (
      <p role="alert" className="text-sm text-red-600">
        {t("errors." + errorCode)}
      </p>
    );
  }

  const isSending = status === "sending";

  let submitText = t("inquiry.submit");
  if (isSending) {
    submitText = t("inquiry.sending");
  }

  return (
    <section
      id="inquiry"
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-lg font-bold">{t("inquiry.title")}</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {t("inquiry.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {t("inquiry.name")}
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder={t("inquiry.namePlaceholder")}
              maxLength={100}
              autoComplete="name"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            <span>
              {t("inquiry.phone")} <span className="text-red-500">*</span>
            </span>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder={t("inquiry.phonePlaceholder")}
              autoComplete="tel"
              required
              className={inputClass}
            />
          </label>
        </div>

        <label className={labelClass}>
          {t("inquiry.note")}
          <textarea
            value={note}
            onChange={handleNoteChange}
            placeholder={t("inquiry.notePlaceholder")}
            maxLength={1000}
            rows={3}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          {t("inquiry.staffCode")}
          <input
            type="text"
            value={staffCode}
            onChange={handleStaffCodeChange}
            placeholder={t("inquiry.staffCodePlaceholder")}
            maxLength={20}
            className={inputClass}
          />
        </label>

        {/* Ô bẫy bot: người dùng không nhìn thấy */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={handleWebsiteChange}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[9999px] h-0 w-0 opacity-0"
        />

        {errorMessage}

        <button
          type="submit"
          disabled={isSending}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitText}
        </button>
      </form>
    </section>
  );
}
