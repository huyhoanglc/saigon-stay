import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Container from "../components/Container";
import ErrorMessage from "../components/ErrorMessage";
import { CheckIcon } from "../components/Icons";
import { useAuth } from "../hooks/useAuth";
import { verifyResetToken, resetPassword } from "../api/client";
import { ADMIN_SITE_URL } from "../utils/sites";

const PASSWORD_MIN = 8;

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

const primaryLinkClass =
  "block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-500";

// Trang đặt mật khẩu từ link trong email: mời nhân viên mới hoặc quên mật khẩu.
// Đường dẫn: /reset-password?token=...
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  // checking → invalid | form → done
  const [step, setStep] = useState("checking");
  const [account, setAccount] = useState(null);
  const [doneUser, setDoneUser] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  // Mở trang là kiểm tra link ngay, để báo sớm nếu link đã hết hạn hoặc đã dùng
  useEffect(() => {
    let ignore = false;

    async function checkToken() {
      if (!token) {
        setStep("invalid");
        return;
      }
      try {
        const data = await verifyResetToken(token);
        if (!ignore) {
          setAccount(data);
          setStep("form");
        }
      } catch {
        if (!ignore) {
          setStep("invalid");
        }
      }
    }

    checkToken();

    return () => {
      ignore = true;
    };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorCode("");

    if (password.length < PASSWORD_MIN) {
      setErrorCode("PASSWORD_TOO_SHORT");
      return;
    }
    if (password !== confirmPassword) {
      setErrorCode("PASSWORD_MISMATCH");
      return;
    }

    setSaving(true);
    try {
      const user = await resetPassword(token, password);
      // Server đã đăng nhập luôn → cập nhật header ngay
      setUser(user);
      setDoneUser(user);
      setStep("done");
    } catch (err) {
      if (err.code === "RESET_TOKEN_INVALID") {
        setStep("invalid");
      } else {
        setErrorCode(err.code);
      }
    }
    setSaving(false);
  }

  let title = t("reset.title");
  let subtitle = "";
  let content = null;

  if (step === "checking") {
    content = (
      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
    );
  } else if (step === "invalid") {
    title = t("reset.invalidTitle");
    subtitle = t("reset.invalidMessage");
    content = (
      <div className="mt-6">
        <Link to="/forgot-password" className={primaryLinkClass}>
          {t("reset.requestNew")}
        </Link>
      </div>
    );
  } else if (step === "form") {
    // Lời mời nhân viên mới thì chào kiểu "kích hoạt tài khoản"
    if (account.purpose === "invite") {
      title = t("reset.inviteTitle", { name: account.name });
      subtitle = t("reset.inviteSubtitle");
    } else {
      subtitle = t("reset.subtitle");
    }

    let errorMessage = "";
    if (errorCode) {
      errorMessage = t("errors." + errorCode);
    }

    let buttonText = t("reset.submit");
    if (saving) {
      buttonText = t("auth.submitting");
    }

    content = (
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorMessage message={errorMessage} />

        {/* Ô email ẩn để trình quản lý mật khẩu của trình duyệt biết lưu cho tài khoản nào */}
        <input type="email" value={account.email} autoComplete="username" readOnly hidden />
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {t("auth.email")}: <strong>{account.email}</strong>
        </p>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("profile.newPassword")}
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {buttonText}
        </button>
      </form>
    );
  } else if (step === "done") {
    title = t("reset.doneTitle");

    // Admin thì gợi ý vào thẳng trang quản trị
    let adminLink = null;
    if (doneUser && doneUser.role === "admin") {
      adminLink = (
        <a href={ADMIN_SITE_URL} className={primaryLinkClass}>
          {t("reset.goAdmin")}
        </a>
      );
    }

    content = (
      <div className="mt-6 space-y-3">
        <p className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {t("reset.doneMessage")}
        </p>
        {adminLink}
        <Link
          to="/"
          className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t("reset.goHome")}
        </Link>
      </div>
    );
  }

  let subtitleText = null;
  if (subtitle) {
    subtitleText = (
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    );
  }

  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{title}</h1>
        {subtitleText}
        {content}
      </div>
    </Container>
  );
}
