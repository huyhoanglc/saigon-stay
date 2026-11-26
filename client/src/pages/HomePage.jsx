import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRooms } from "../hooks/useRooms";
import Container from "../components/Container";
import RoomSection from "../components/RoomSection";
import RoomFilters from "../components/RoomFilters";
import RoomCard from "../components/RoomCard";
import RoomCardSkeleton from "../components/RoomCardSkeleton";
import Pagination from "../components/Pagination";
import { FireIcon, SparklesIcon, ClockIcon } from "../components/Icons";

const DEFAULT_FILTERS = {
  area: "",
  layout: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
};

const PAGE_SIZE = 8;

const GRID_CLASS =
  "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

export default function HomePage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const { rooms, total, totalPages, loading, error } = useRooms({
    area: filters.area,
    layout: filters.layout,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    page: page,
    limit: PAGE_SIZE,
  });

  function handleFiltersChange(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  function handlePageChange(newPage) {
    setPage(newPage);

    const section = document.getElementById("all-rooms");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }

  // ===== Phần "Tất cả căn hộ" =====
  let listContent;

  if (loading) {
    const skeletons = [];
    for (let i = 0; i < PAGE_SIZE; i++) {
      skeletons.push(<RoomCardSkeleton key={i} />);
    }
    listContent = <div className={GRID_CLASS}>{skeletons}</div>;
  } else if (error) {
    listContent = <p className="text-red-600">{t("errors." + error.code)}</p>;
  } else if (rooms.length === 0) {
    listContent = (
      <p className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500 dark:border-slate-700">
        {t("rooms.empty")}
      </p>
    );
  } else {
    listContent = (
      <div className={GRID_CLASS}>
        {rooms.map((room) => (
          <RoomCard key={room._id} room={room} />
        ))}
      </div>
    );
  }

  let countText = null;
  if (!loading && !error) {
    countText = (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t("rooms.count", { count: total })}
      </p>
    );
  }

  return (
    <Container className="space-y-14 py-8">
      {/* Banner */}
      <section className="rounded-3xl bg-linear-to-br from-emerald-700 to-emerald-500 px-6 py-12 text-white sm:px-10 sm:py-16">
        <p className="text-sm uppercase tracking-widest text-emerald-100">
          {t("home.tagline")}
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold sm:text-4xl lg:text-5xl">
          {t("home.heroTitle")}
        </h1>
      </section>

      {/* Slider */}
      <RoomSection
        title={t("home.hot")}
        icon={<FireIcon className="h-6 w-6 text-orange-500" />}
        params={{ hot: true, limit: 10 }}
      />
      <RoomSection
        title={t("home.newOpening")}
        icon={<SparklesIcon className="h-6 w-6 text-sky-500" />}
        params={{ newOpening: true, limit: 10 }}
      />
      <RoomSection
        title={t("home.latest")}
        icon={<ClockIcon className="h-6 w-6 text-emerald-600" />}
        params={{ sort: "newest", limit: 10 }}
      />

      {/* Tất cả căn hộ */}
      <section id="all-rooms" className="scroll-mt-20 space-y-5">
        <h2 className="text-xl font-bold sm:text-2xl">{t("home.all")}</h2>

        <RoomFilters
          filters={filters}
          onChange={handleFiltersChange}
          defaults={DEFAULT_FILTERS}
        />

        {countText}
        {listContent}

        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={handlePageChange}
        />
      </section>
    </Container>
  );
}
