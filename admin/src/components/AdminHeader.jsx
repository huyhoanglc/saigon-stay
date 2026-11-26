import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import LanguageSwitcher from "./LanguageSwitcher";
import Avatar from "./Avatar";
import { SunIcon, MoonIcon, LogOutIcon, UserIcon } from "./Icons";
import { PUBLIC_SITE_URL } from "../utils/sites";

export default function AdminHeader() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
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

  let userBlock = null;
  if (user) {
    userBlock = (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar src={user.avatar} name={user.name} />
        <span className="hidden max-w-[160px] truncate text-sm font-medium text-slate-700 dark:text-slate-200 md:block">
          {user.name}
        </span>
      </div>
    );
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

          {userBlock}

          {/* Trang cá nhân nằm ở web khách */}
          <a
            href={PUBLIC_SITE_URL + "/profile"}
            className={iconButtonClass}
            aria-label={t("admin.account")}
            title={t("admin.account")}
          >
            <UserIcon className="h-5 w-5" />
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className={iconButtonClass}
            aria-label={t("auth.logout")}
            title={t("auth.logout")}
          >
            <LogOutIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
