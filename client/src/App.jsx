import { Routes, Route, Link } from "react-router";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import FloatingButtons from "./components/FloatingButtons";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import RoomDetailPage from "./pages/RoomDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import JobsPage from "./pages/JobsPage";

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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <FloatingButtons />
    </div>
  );
}
