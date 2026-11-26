import { useState } from "react";
import { Link, NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useFavorites } from "../context/FavoritesContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { HeartIcon, SunIcon, MoonIcon, MenuIcon, CloseIcon } from "./Icons";

export default function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { count } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: t("nav.rooms"), end: true },
    { to: "/favorites", label: t("nav.favorites"), end: false },
    { to: "/jobs", label: t("nav.jobs"), end: false },
  ];

  function handleToggleMenu() {
    setMenuOpen(!menuOpen);
  }

  function handleCloseMenu() {
    setMenuOpen(false);
  }

  function getNavClass({ isActive }) {
    const baseClass = "rounded-lg px-4 py-2 text-sm font-medium transition";

    if (isActive) {
      return (
        baseClass +
        " bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      );
    }
    return (
      baseClass +
      " text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    );
  }

  function getMobileNavClass({ isActive }) {
    const baseClass = "block rounded-lg px-4 py-3 text-sm font-medium";

    if (isActive) {
      return (
        baseClass +
        " bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      );
    }
    return (
      baseClass +
      " text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
    );
  }

  const iconButtonClass =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";

  let themeIcon;
  let themeLabel;
  if (theme === "dark") {
    themeIcon = <SunIcon className="h-5 w-5" />;
    themeLabel = t("theme.light");
  } else {
    themeIcon = <MoonIcon className="h-5 w-5" />;
    themeLabel = t("theme.dark");
  }

  let countBadge = null;
  if (count > 0) {
    let countText = String(count);
    if (count > 99) {
      countText = "99+";
    }
    countBadge = (
      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
        {countText}
      </span>
    );
  }

  let menuIcon;
  if (menuOpen) {
    menuIcon = <CloseIcon className="h-5 w-5" />;
  } else {
    menuIcon = <MenuIcon className="h-5 w-5" />;
  }

  let mobileMenu = null;
  if (menuOpen) {
    mobileMenu = (
      <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={handleCloseMenu}
              className={getMobileNavClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 sm:hidden">
          <Link
            to="/login"
            onClick={handleCloseMenu}
            className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium dark:border-slate-700"
          >
            {t("nav.login")}
          </Link>
          <Link
            to="/register"
            onClick={handleCloseMenu}
            className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white dark:bg-emerald-600"
          >
            {t("nav.register")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Link
          to="/"
          onClick={handleCloseMenu}
          className="shrink-0 leading-tight lg:justify-self-start"
        >
          <span className="block text-lg font-bold text-emerald-700 dark:text-emerald-400">
            SaiGon Stay
          </span>
          <span className="block text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t("app.slogan")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={getNavClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0 lg:justify-self-end">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {themeIcon}
          </button>

          <Link
            to="/favorites"
            onClick={handleCloseMenu}
            className={iconButtonClass}
            aria-label={t("nav.favorites")}
            title={t("nav.favorites")}
          >
            <HeartIcon className="h-5 w-5" />
            {countBadge}
          </Link>

          <Link
            to="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 sm:inline-block"
          >
            {t("nav.login")}
          </Link>

          <Link
            to="/register"
            className="hidden rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 sm:inline-block"
          >
            {t("nav.register")}
          </Link>

          <button
            type="button"
            onClick={handleToggleMenu}
            className={iconButtonClass + " lg:hidden"}
            aria-label={t("nav.menu")}
          >
            {menuIcon}
          </button>
        </div>
      </div>

      {mobileMenu}
    </header>
  );
}
