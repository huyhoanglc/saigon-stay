import { useEffect } from "react";
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
import ProfilePage from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { ADMIN_SITE_URL } from "./utils/sites";

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

// Trang quản trị đã chuyển sang domain riêng, ai vào /admin thì chuyển sang đó
function AdminRedirect() {
  const { t } = useTranslation();

  useEffect(() => {
    window.location.replace(ADMIN_SITE_URL);
  }, []);

  return (
    <p className="py-24 text-center text-slate-500 dark:text-slate-400">
      {t("common.loading")}
    </p>
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/*" element={<AdminRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <FloatingButtons />
    </div>
  );
}
