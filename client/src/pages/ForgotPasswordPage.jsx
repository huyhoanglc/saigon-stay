import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Container from "../components/Container";
import ErrorMessage from "../components/ErrorMessage";
import { CheckIcon } from "../components/Icons";
import { forgotPassword } from "../api/client";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorCode("");
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setErrorCode(err.code);
    }
    setSubmitting(false);
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }

  let buttonText = t("forgot.submit");
  if (submitting) {
    buttonText = t("auth.submitting");
  }

  // Đã gửi: luôn báo cùng 1 câu (server không cho biết email có tài khoản hay không)
  let content;
  if (sent) {
    content = (
      <div className="mt-6 space-y-4">
        <p className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {t("forgot.sent", { email: email.trim() })}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("forgot.checkSpam")}</p>
      </div>
    );
  } else {
    content = (
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorMessage message={errorMessage} />
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("auth.email")}
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buttonText}
        </button>
      </form>
    );
  }

  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("forgot.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("forgot.subtitle")}
        </p>

        {content}

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          <Link
            to="/login"
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {t("forgot.backToLogin")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
