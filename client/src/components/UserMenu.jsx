import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import Avatar from "./Avatar";
import {
  ChevronDownIcon,
  UserIcon,
  DashboardIcon,
  ExternalLinkIcon,
  LogOutIcon,
} from "./Icons";
import { ADMIN_SITE_URL } from "../utils/sites";

// Menu tài khoản trên header (màn hình từ sm trở lên).
// Bấm avatar để mở: Trang cá nhân, Quản trị (chỉ admin), Đăng xuất.
// onLogout: Header truyền xuống, Header sẽ hỏi xác nhận rồi mới đăng xuất.
export default function UserMenu({ onLogout }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Đang mở thì: bấm ra ngoài menu hoặc nhấn Esc sẽ đóng
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleToggle() {
    setOpen(!open);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleLogout() {
    setOpen(false);
    onLogout();
  }

  const itemClass =
    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";

  let adminItem = null;
  if (user.role === "admin") {
    adminItem = (
      <a
        href={ADMIN_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        onClick={handleClose}
        className={itemClass}
      >
        <DashboardIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span className="flex-1">{t("auth.admin")}</span>
        <ExternalLinkIcon className="h-3.5 w-3.5 text-slate-400" />
      </a>
    );
  }

  let emailLine = null;
  if (user.email) {
    emailLine = (
      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
    );
  }

  let chevronClass = "h-4 w-4 text-slate-500 transition-transform dark:text-slate-400";
  if (open) {
    chevronClass = chevronClass + " rotate-180";
  }

  let menu = null;
  if (open) {
    menu = (
      <div
        role="menu"
        aria-label={t("userMenu.label")}
        className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Avatar src={user.avatar} name={user.name} className="h-10 w-10 text-base" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
              {user.name}
            </p>
            {emailLine}
            <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {t("userRole." + user.role)}
            </span>
          </div>
        </div>

        <div className="py-1">
          <Link to="/profile" role="menuitem" onClick={handleClose} className={itemClass}>
            <UserIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {t("profile.title")}
          </Link>
          {adminItem}
        </div>

        <div className="border-t border-slate-100 py-1 dark:border-slate-800">
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className={itemClass + " text-rose-600 dark:text-rose-400"}
          >
            <LogOutIcon className="h-4 w-4" />
            {t("auth.logout")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("userMenu.label")}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Avatar src={user.avatar} name={user.name} className="h-8 w-8 text-sm" />
        <span className="hidden max-w-30 truncate text-sm font-medium text-slate-700 dark:text-slate-200 xl:block">
          {user.name}
        </span>
        <ChevronDownIcon className={chevronClass} />
      </button>
      {menu}
    </div>
  );
}
