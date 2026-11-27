import { Routes, Route, Link } from "react-router";
import { useTranslation } from "react-i18next";
import RequireAdmin from "./components/RequireAdmin";
import AdminLayout from "./pages/AdminLayout";
import LoginPage from "./pages/LoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminBuildingsPage from "./pages/AdminBuildingsPage";
import AdminBuildingFormPage from "./pages/AdminBuildingFormPage";
import AdminRoomsPage from "./pages/AdminRoomsPage";
import AdminRoomFormPage from "./pages/AdminRoomFormPage";
import AdminInquiriesPage from "./pages/AdminInquiriesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ProfilePage from "./pages/ProfilePage";

function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="py-16 text-center">
      <p className="text-6xl font-bold text-slate-300 dark:text-slate-700">
        404
      </p>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        {t("notFound.title")}
      </p>
      <Link
        to="/"
        className="mt-4 inline-block text-emerald-700 underline dark:text-emerald-400"
      >
        {t("admin.backToDashboard")}
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Mọi trang còn lại đều cần đăng nhập bằng tài khoản admin */}
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="buildings" element={<AdminBuildingsPage />} />
          <Route path="buildings/new" element={<AdminBuildingFormPage />} />
          <Route path="buildings/:id" element={<AdminBuildingFormPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route path="rooms/new" element={<AdminRoomFormPage />} />
          <Route path="rooms/:id" element={<AdminRoomFormPage />} />
          <Route path="inquiries" element={<AdminInquiriesPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}
