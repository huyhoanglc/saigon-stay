import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import Container from "../components/Container";
import { ErrorMessage } from "../components/admin/FormFields";
import { getSafeRedirect } from "../utils/redirect";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const PASSWORD_MIN = 8;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  if (!loading && user && !submitting) {
    let target = "/";
    if (redirect) {
      target = redirect;
    }
    return <Navigate to={target} replace />;
  }

  function handleChange(event) {
    const target = event.target;
    setForm((prev) => ({ ...prev, [target.name]: target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorCode("");

    // Kiểm tra trước ở trình duyệt cho nhanh, server vẫn kiểm tra lại
    if (form.password.length < PASSWORD_MIN) {
      setErrorCode("PASSWORD_TOO_SHORT");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrorCode("PASSWORD_MISMATCH");
      return;
    }

    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      let target = "/";
      if (redirect) {
        target = redirect;
      }
      navigate(target, { replace: true });
    } catch (err) {
      setErrorCode(err.code);
      setSubmitting(false);
    }
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }

  let buttonText = t("auth.submitRegister");
  if (submitting) {
    buttonText = t("auth.submitting");
  }

  let loginLink = "/login";
  if (redirect) {
    loginLink = loginLink + "?redirect=" + encodeURIComponent(redirect);
  }

  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("auth.registerTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("auth.registerSubtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <ErrorMessage message={errorMessage} />

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("auth.name")}
            <input
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={100}
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("auth.email")}
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("auth.password")}
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={PASSWORD_MIN}
              maxLength={72}
              className={inputClass}
            />
            <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
              {t("auth.passwordHint", { count: PASSWORD_MIN })}
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("auth.confirmPassword")}
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
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

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          {t("auth.haveAccount")}{" "}
          <Link
            to={loginLink}
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {t("nav.login")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
