import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useFavorites } from "../context/FavoritesContext";
import Container from "../components/Container";
import RoomCard from "../components/RoomCard";

export default function FavoritesPage() {
  const { t } = useTranslation();
  const { favorites, clearFavorites } = useFavorites();

  function handleClear() {
    const confirmed = window.confirm(t("favorites.confirmClear"));
    if (confirmed) {
      clearFavorites();
    }
  }

  let content;
  if (favorites.length === 0) {
    content = (
      <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">
          {t("favorites.empty")}
        </p>
        <Link
          to="/"
          className="mt-2 inline-block text-emerald-700 underline dark:text-emerald-400"
        >
          {t("favorites.browse")}
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {favorites.map((room) => (
          <RoomCard key={room._id} room={room} />
        ))}
      </div>
    );
  }

  let clearButton = null;
  if (favorites.length > 0) {
    clearButton = (
      <button
        type="button"
        onClick={handleClear}
        className="text-sm text-slate-500 underline hover:text-rose-600 dark:text-slate-400"
      >
        {t("favorites.clear")}
      </button>
    );
  }

  return (
    <Container className="space-y-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {t("favorites.title")} ({favorites.length})
        </h1>
        {clearButton}
      </div>

      {content}
    </Container>
  );
}
