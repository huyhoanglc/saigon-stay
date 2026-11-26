import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import FloatingButtons from "./components/FloatingButtons";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import RoomDetailPage from "./pages/RoomDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import JobsPage from "./pages/JobsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RequireAdmin from "./components/admin/RequireAdmin";

// Trang admin chỉ tải khi có người vào /admin, khách xem phòng không phải tải phần code này
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminBuildingsPage = lazy(() => import("./pages/admin/AdminBuildingsPage"));
const AdminBuildingFormPage = lazy(() => import("./pages/admin/AdminBuildingFormPage"));
const AdminRoomsPage = lazy(() => import("./pages/admin/AdminRoomsPage"));
const AdminRoomFormPage = lazy(() => import("./pages/admin/AdminRoomFormPage"));
const AdminInquiriesPage = lazy(() => import("./pages/admin/AdminInquiriesPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));

function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="py-24 text-center">
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
        {t("notFound.back")}
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <ScrollToTop />
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Mọi trang /admin đều đi qua RequireAdmin */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Suspense fallback={null}>
                  <AdminLayout />
                </Suspense>
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
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <FloatingButtons />
    </div>
  );
}
