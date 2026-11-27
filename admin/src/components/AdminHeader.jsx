import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";
import { SunIcon, MoonIcon, ExternalLinkIcon } from "./Icons";
import { PUBLIC_SITE_URL } from "../utils/sites";
import ConfirmDialog from "./ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";

export default function AdminHeader() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { askConfirm, dialogProps } = useConfirm();

  function handleLogout() {
    askConfirm({
      title: t("auth.logoutTitle"),
      message: t("auth.logoutMessage"),
      confirmLabel: t("auth.logout"),
      tone: "neutral",
      action: async () => {
        await logout();
        navigate("/login");
      },
    });
  }

  let themeIcon;
  let themeLabel;
  if (theme === "dark") {
    themeIcon = <SunIcon className="h-5 w-5" />;
    themeLabel = t("theme.light");
  } else {
    themeIcon = <MoonIcon className="h-5 w-5" />;
    themeLabel = t("theme.dark");
  }

  const iconButtonClass =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

  let userMenu = null;
  if (user) {
    userMenu = <UserMenu onLogout={handleLogout} />;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-10">
        <Link to="/" className="shrink-0 leading-tight">
          <span className="block text-lg font-bold text-emerald-700 dark:text-emerald-400">
            SaiGon Stay
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t("admin.title")}
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
          {/* Mở web khách ở tab mới, trang quản trị vẫn giữ nguyên.
              Màn hình nhỏ chỉ hiện icon cho gọn. */}
          <a
            href={PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 lg:px-3"
            aria-label={t("admin.viewSite")}
            title={t("admin.viewSite")}
          >
            <ExternalLinkIcon className="h-5 w-5" />
            <span className="hidden lg:inline">{t("admin.viewSite")}</span>
          </a>

          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {themeIcon}
          </button>

          {userMenu}
        </div>
      </div>
      <ConfirmDialog {...dialogProps} />
    </header>
  );
}
