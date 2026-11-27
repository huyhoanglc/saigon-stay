import { NavLink, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import Container from "../components/Container";
import AdminHeader from "../components/AdminHeader";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  DashboardIcon,
  BuildingIcon,
  DoorIcon,
  MessageIcon,
  UsersIcon,
  UploadIcon,
} from "../components/Icons";

export default function AdminLayout() {
  const { t } = useTranslation();

  const navItems = [
    { to: "/", label: t("admin.nav.dashboard"), icon: DashboardIcon, end: true },
    { to: "/buildings", label: t("admin.nav.buildings"), icon: BuildingIcon, end: false },
    { to: "/rooms", label: t("admin.nav.rooms"), icon: DoorIcon, end: false },
    { to: "/inquiries", label: t("admin.nav.inquiries"), icon: MessageIcon, end: false },
    { to: "/users", label: t("admin.nav.users"), icon: UsersIcon, end: false },
    { to: "/import", label: t("admin.nav.import"), icon: UploadIcon, end: false },
  ];

  function getNavClass({ isActive }) {
    let cls =
      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition";
    if (isActive) {
      cls = cls + " bg-emerald-600 text-white";
    } else {
      cls =
        cls +
        " text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";
    }
    return cls;
  }

  return (
    <>
      <AdminHeader />

      <Container className="py-4 lg:py-8">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          <aside className="mb-4 lg:mb-0">
            {/* Điện thoại: thanh ngang cuộn được. Máy tính: cột dọc bên trái */}
            <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-24 lg:flex-col">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={getNavClass}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Màn hình nhỏ: nút đổi ngôn ngữ không vừa header nên để ở đây */}
            <div className="mt-3 sm:hidden">
              <LanguageSwitcher />
            </div>
          </aside>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </Container>
    </>
  );
}
