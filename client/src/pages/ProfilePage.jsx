import { useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import Container from "../components/Container";
import Avatar from "../components/Avatar";
import ErrorMessage from "../components/ErrorMessage";
import ComingSoonDialog from "../components/ComingSoonDialog";
import { ZALO_LOGIN_ENABLED } from "../utils/features";
import { GoogleLogo, ZaloLogo } from "../components/BrandIcons";
import { UploadIcon, TrashIcon, CheckIcon } from "../components/Icons";
import {
  updateProfile,
  changePassword,
  unlinkProvider,
  uploadAvatar,
  getOAuthStartUrl,
} from "../api/client";

const PASSWORD_MIN = 8;

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-400";
const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300";
const primaryButtonClass =
  "rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

function SuccessMessage({ message }) {
  if (!message) {
    return null;
  }
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
    >
      <CheckIcon className="h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

function Card({ title, description, children }) {
  let descriptionText = null;
  if (description) {
    descriptionText = (
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
      {descriptionText}
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ===== Ảnh đại diện + tên + vai trò =====
function AvatarCard({ user, onUserChange }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState("");

  async function handleSelectFile(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setBusy(true);
    setErrorCode("");
    try {
      const url = await uploadAvatar(file);
      const updated = await updateProfile({ avatar: url });
      onUserChange(updated);
    } catch (err) {
      setErrorCode(err.code);
    }
    setBusy(false);
  }

  async function handleRemove() {
    setBusy(true);
    setErrorCode("");
    try {
      const updated = await updateProfile({ avatar: "" });
      onUserChange(updated);
    } catch (err) {
      setErrorCode(err.code);
    }
    setBusy(false);
  }

  let uploadText = t("profile.changeAvatar");
  if (busy) {
    uploadText = t("profile.uploading");
  }

  let uploadLabelClass = secondaryButtonClass + " cursor-pointer";
  if (busy) {
    uploadLabelClass = uploadLabelClass + " pointer-events-none opacity-60";
  }

  let removeButton = null;
  if (user.avatar) {
    removeButton = (
      <button
        type="button"
        onClick={handleRemove}
        disabled={busy}
        className={secondaryButtonClass}
      >
        <TrashIcon className="h-4 w-4" />
        {t("profile.removeAvatar")}
      </button>
    );
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }

  let emailText = t("profile.noEmail");
  if (user.email) {
    emailText = user.email;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar src={user.avatar} name={user.name} className="h-24 w-24 text-3xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-slate-900 dark:text-slate-50">
            {user.name}
          </h1>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{emailText}</p>
          <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {t("userRole." + user.role)}
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <label className={uploadLabelClass}>
            <UploadIcon className="h-4 w-4" />
            {uploadText}
            <input
              type="file"
              accept="image/*"
              onChange={handleSelectFile}
              disabled={busy}
              className="sr-only"
            />
          </label>
          {removeButton}
        </div>
      </div>
      <div className="mt-4">
        <ErrorMessage message={errorMessage} />
      </div>
    </section>
  );
}

// ===== Họ tên, số điện thoại =====
function InfoCard({ user, onUserChange }) {
  const { t } = useTranslation();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrorCode("");
    setSaved(false);

    try {
      const updated = await updateProfile({ name: name, phone: phone });
      onUserChange(updated);
      setPhone(updated.phone);
      setSaved(true);
    } catch (err) {
      setErrorCode(err.code);
    }
    setSaving(false);
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }
  let successMessage = "";
  if (saved) {
    successMessage = t("profile.saved");
  }

  let saveText = t("profile.save");
  if (saving) {
    saveText = t("profile.saving");
  }

  let emailValue = user.email;
  if (!emailValue) {
    emailValue = t("profile.noEmail");
  }

  return (
    <Card title={t("profile.infoTitle")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={errorMessage} />
        <SuccessMessage message={successMessage} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {t("auth.name")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              autoComplete="name"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {t("profile.phone")}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
              autoComplete="tel"
              className={inputClass}
            />
          </label>
          <label className={labelClass + " sm:col-span-2"}>
            {t("auth.email")}
            <input value={emailValue} disabled className={inputClass} />
            <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
              {t("profile.emailHint")}
            </span>
          </label>
        </div>

        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saveText}
        </button>
      </form>
    </Card>
  );
}

// ===== Đổi / đặt mật khẩu =====
function PasswordCard({ user, onUserChange }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [saved, setSaved] = useState(false);

  // Tài khoản Zalo không có email thì không đăng nhập bằng mật khẩu được
  if (!user.email) {
    return (
      <Card title={t("profile.passwordTitle")}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("profile.passwordNeedsEmail")}
        </p>
      </Card>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorCode("");
    setSaved(false);

    if (newPassword.length < PASSWORD_MIN) {
      setErrorCode("PASSWORD_TOO_SHORT");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorCode("PASSWORD_MISMATCH");
      return;
    }

    setSaving(true);
    try {
      const updated = await changePassword(currentPassword, newPassword);
      onUserChange(updated);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    } catch (err) {
      setErrorCode(err.code);
    }
    setSaving(false);
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }
  let successMessage = "";
  if (saved) {
    successMessage = t("profile.passwordSaved");
  }

  let savePasswordText = t("profile.savePassword");
  if (saving) {
    savePasswordText = t("profile.saving");
  }

  // Đã có mật khẩu → phải nhập mật khẩu hiện tại. Chưa có → đặt lần đầu.
  let title = t("profile.setPasswordTitle");
  let description = t("profile.setPasswordHint");
  let currentPasswordField = null;
  if (user.hasPassword) {
    title = t("profile.passwordTitle");
    description = t("profile.passwordHint");
    currentPasswordField = (
      <label className={labelClass + " sm:col-span-2"}>
        {t("profile.currentPassword")}
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
    );
  }

  return (
    <Card title={title} description={description}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={errorMessage} />
        <SuccessMessage message={successMessage} />

        <div className="grid gap-4 sm:grid-cols-2">
          {currentPasswordField}
          <label className={labelClass}>
            {t("profile.newPassword")}
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={PASSWORD_MIN}
              maxLength={72}
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {t("auth.confirmPassword")}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
            />
          </label>
        </div>

        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {savePasswordText}
        </button>
      </form>
    </Card>
  );
}

// ===== Liên kết Google / Zalo =====
function ConnectionsCard({ user, onUserChange, initialErrorCode, linkedProvider }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState("");
  const [errorCode, setErrorCode] = useState(initialErrorCode);
  const [showComingSoon, setShowComingSoon] = useState(false);

  let successMessage = "";
  if (linkedProvider === "google" || linkedProvider === "zalo") {
    successMessage = t("profile.linkedSuccess", {
      provider: t("profile.provider." + linkedProvider),
    });
  }

  function handleOpenComingSoon() {
    setShowComingSoon(true);
  }

  function handleCloseComingSoon() {
    setShowComingSoon(false);
  }

  async function handleUnlink(provider) {
    const ok = window.confirm(
      t("profile.confirmUnlink", { provider: t("profile.provider." + provider) }),
    );
    if (!ok) {
      return;
    }

    setBusy(provider);
    setErrorCode("");
    try {
      const updated = await unlinkProvider(provider);
      onUserChange(updated);
    } catch (err) {
      setErrorCode(err.code);
    }
    setBusy("");
  }

  const providers = [
    { key: "google", linked: user.google, logo: GoogleLogo },
    { key: "zalo", linked: user.zalo, logo: ZaloLogo },
  ];

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }

  return (
    <Card title={t("profile.connectionsTitle")} description={t("profile.connectionsHint")}>
      <div className="space-y-4">
        <ErrorMessage message={errorMessage} />
        <SuccessMessage message={successMessage} />

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {providers.map((provider) => {
            const Logo = provider.logo;
            const providerName = t("profile.provider." + provider.key);

            let statusText = t("profile.notLinked");
            let statusClass = "text-sm text-slate-500 dark:text-slate-400";
            let action;
            if (provider.linked) {
              statusText = t("profile.linked");
              statusClass = "text-sm text-emerald-700 dark:text-emerald-400";
              action = (
                <button
                  type="button"
                  onClick={() => handleUnlink(provider.key)}
                  disabled={busy !== ""}
                  className={secondaryButtonClass}
                >
                  {t("profile.unlink")}
                </button>
              );
            } else if (provider.key === "zalo" && !ZALO_LOGIN_ENABLED) {
              // Zalo đang tạm tắt → chỉ mở popup "đang cập nhật"
              action = (
                <button
                  type="button"
                  onClick={handleOpenComingSoon}
                  className={secondaryButtonClass}
                >
                  {t("profile.link")}
                </button>
              );
            } else {
              // Chuyển sang trang Google/Zalo, xong quay về /profile
              action = (
                <a
                  href={getOAuthStartUrl(provider.key, "link", "/profile")}
                  className={secondaryButtonClass}
                >
                  {t("profile.link")}
                </a>
              );
            }

            return (
              <li key={provider.key} className="flex items-center gap-3 py-3">
                <Logo className="h-6 w-6 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{providerName}</p>
                  <p className={statusClass}>{statusText}</p>
                </div>
                {action}
              </li>
            );
          })}
        </ul>
      </div>
      <ComingSoonDialog open={showComingSoon} onClose={handleCloseComingSoon} />
    </Card>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading, setUser } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <Container className="py-16 text-center text-slate-500 dark:text-slate-400">
        {t("common.loading")}
      </Container>
    );
  }

  if (!user) {
    return <Navigate to="/login?redirect=%2Fprofile" replace />;
  }

  // Kết quả trả về sau khi liên kết Google/Zalo: ?linked=google hoặc ?error=MA_LOI
  const linkedProvider = searchParams.get("linked") || "";
  const errorFromUrl = searchParams.get("error") || "";

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <AvatarCard user={user} onUserChange={setUser} />
        <InfoCard user={user} onUserChange={setUser} />
        <PasswordCard user={user} onUserChange={setUser} />
        <ConnectionsCard
          user={user}
          onUserChange={setUser}
          initialErrorCode={errorFromUrl}
        linkedProvider={linkedProvider}
        />
      </div>
    </Container>
  );
}
