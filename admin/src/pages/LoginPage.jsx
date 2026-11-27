import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { ErrorMessage } from "../components/FormFields";
import SocialLoginButtons from "../components/SocialLoginButtons";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getSafeRedirect } from "../utils/redirect";
import { PUBLIC_SITE_URL } from "../utils/sites";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export default function LoginPage() {
  const { t } = useTranslation();
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  let redirect = getSafeRedirect(searchParams.get("redirect"));
  if (!redirect) {
    redirect = "/";
  }

  // Lỗi trả về từ đăng nhập Google/Zalo (?error=MA_LOI)
  let initialError = "";
  if (searchParams.get("error")) {
    initialError = searchParams.get("error");
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState(initialError);

  // Đã đăng nhập rồi thì vào thẳng trang quản trị
  // (nếu không phải admin, RequireAdmin sẽ báo không có quyền)
  if (!loading && user && !submitting) {
    return <Navigate to={redirect} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorCode("");

    try {
      await login(email, password);
      navigate(redirect, { replace: true });
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
          SaiGon Stay
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("admin.loginTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("admin.loginSubtitle")}
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

          {/* Trang quên mật khẩu nằm ở web khách (dùng chung cho mọi tài khoản) */}
          <div className="-mt-2 text-right">
            <a
              href={PUBLIC_SITE_URL + "/forgot-password"}
              className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
            >
              {t("auth.forgotPassword")}
            </a>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {buttonText}
          </button>
        </form>
      </div>

      <div className="mt-6">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
