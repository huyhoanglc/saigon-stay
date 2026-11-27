import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import Container from "../components/Container";
import ErrorMessage from "../components/ErrorMessage";
import SocialLoginButtons from "../components/SocialLoginButtons";
import { getSafeRedirect } from "../utils/redirect";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export default function LoginPage() {
  const { t } = useTranslation();
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Lỗi trả về từ đăng nhập Google/Zalo (?error=MA_LOI) thì hiện luôn
  const [errorCode, setErrorCode] = useState(searchParams.get("error") || "");

  // Ai đã đăng nhập thì không cần ở trang này
  if (!loading && user && !submitting) {
    let target = "/";
    if (redirect) {
      target = redirect;
    }
    return <Navigate to={target} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorCode("");

    try {
      await login(email, password);
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

  let buttonText = t("auth.submitLogin");
  if (submitting) {
    buttonText = t("auth.submitting");
  }

  let registerLink = "/register";
  if (redirect) {
    registerLink = registerLink + "?redirect=" + encodeURIComponent(redirect);
  }

  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("auth.loginTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("auth.loginSubtitle")}
        </p>

        <div className="mt-6 space-y-4">
          <ErrorMessage message={errorMessage} />
          <SocialLoginButtons redirect={redirect} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">

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

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("auth.password")}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </label>

          <div className="-mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonText}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          {t("auth.noAccount")}{" "}
          <Link
            to={registerLink}
            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {t("nav.register")}
          </Link>
        </p>
      </div>
    </Container>
  );
}
