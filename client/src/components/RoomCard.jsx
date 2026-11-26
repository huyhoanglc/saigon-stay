import { useTranslation } from "react-i18next";
import { useFavorites } from "../context/FavoritesContext";
import { HeartIcon, FireIcon, ZapIcon, DropletIcon } from "./Icons";
import { formatPrice, formatDate, formatShort } from "../utils/format";

export default function RoomCard({ room }) {
  const { t, i18n } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();

  const building = room.building;
  const language = i18n.language;

  // ===== Chi phí điện, nước =====
  function getFeeValue(feeKey) {
    if (!building.fees) {
      return null;
    }

    const fee = building.fees[feeKey];
    if (!fee) {
      return null;
    }

    if (fee.pricing === "state") {
      return t("room.statePrice");
    }

    return formatShort(fee.amount) + "/" + t("unit." + fee.unit);
  }

  const electricityValue = getFeeValue("electricity");
  const waterValue = getFeeValue("water");

  let electricityItem = null;
  if (electricityValue) {
    electricityItem = (
      <span className="flex items-center gap-1" title={t("room.electricity")}>
        <ZapIcon className="h-4 w-4 text-amber-500" />
        <span className="sr-only">{t("room.electricity")}: </span>
        {electricityValue}
      </span>
    );
  }

  let waterItem = null;
  if (waterValue) {
    waterItem = (
      <span className="flex items-center gap-1" title={t("room.water")}>
        <DropletIcon className="h-4 w-4 text-sky-500" />
        <span className="sr-only">{t("room.water")}: </span>
        {waterValue}
      </span>
    );
  }

  let feeRow = null;
  if (electricityItem || waterItem) {
    feeRow = (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
        {electricityItem}
        {waterItem}
      </div>
    );
  }

  // ===== Tag =====
  const tags = [];
  if (building.hasFireSafety) {
    tags.push(t("room.fireSafety"));
  }
  tags.push(t("road." + building.roadType));
  if (room.minLeaseMonths >= 6) {
    tags.push(t("room.longTerm"));
  } else {
    tags.push(t("room.shortTerm"));
  }

  // ===== Trạng thái =====
  const isUpcoming = room.status === "upcoming";

  let statusText;
  let statusClass =
    "rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold shadow";
  let moveInText;
  if (isUpcoming) {
    statusText = t("room.upcoming");
    statusClass = statusClass + " text-amber-600";
    moveInText = t("room.availableFrom", {
      date: formatDate(room.availableFrom, language),
    });
  } else {
    statusText = t("room.available");
    statusClass = statusClass + " text-emerald-700";
    moveInText = t("room.moveInNow");
  }

  // ===== Ảnh, tiêu đề, giá =====
  let imageUrl = null;
  if (room.images && room.images.length > 0) {
    imageUrl = room.images[0];
  }

  let title = room.title;
  if (!title) {
    title = building.name + " · " + room.code;
  }

  let hasDiscount = false;
  if (room.originalPrice && room.originalPrice > room.price) {
    hasDiscount = true;
  }

  // ===== Nút quan tâm =====
  const saved = isFavorite(room._id);

  function handleToggleFavorite() {
    toggleFavorite(room);
  }

  let favoriteButtonClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition";
  let favoriteLabel;
  if (saved) {
    favoriteButtonClass =
      favoriteButtonClass + " border-rose-500 bg-rose-500 text-white";
    favoriteLabel = t("favorites.remove");
  } else {
    favoriteButtonClass =
      favoriteButtonClass +
      " border-slate-300 text-slate-600 hover:border-rose-400 hover:text-rose-500 dark:border-slate-600 dark:text-slate-300";
    favoriteLabel = t("favorites.add");
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      {/* Ảnh */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-200 dark:bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            draggable={false}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : null}

        {/* Góc trên bên trái: NEW 100% + trạng thái */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {building.isNewOpening ? (
            <span className="rounded-md bg-sky-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
              {t("room.newOpening")}
            </span>
          ) : null}
          <span className={statusClass}>
            {statusText} · {room.code}
          </span>
        </div>

        {/* Góc trên bên phải: HOT */}
        {room.isHot ? (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-orange-500 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
            <FireIcon className="h-3.5 w-3.5" />
            {t("room.hot")}
          </span>
        ) : null}

        {/* Dưới ảnh: ngày vào ở */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-3 pb-2 pt-8">
          <span className="text-xs font-medium text-white">{moveInText}</span>
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold uppercase">
            {t("layout." + room.layout)}
          </span>
          {" · "}
          {building.address.area}
          {" · "}
          {t("furniture." + room.furniture)}
        </p>

        <h3 className="line-clamp-2 font-bold uppercase leading-snug">
          {title}
        </h3>

        {feeRow}

        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              {tag}
            </li>
          ))}
        </ul>

        {/* Giá + nút quan tâm */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            {hasDiscount ? (
              <p className="text-sm text-slate-400 line-through">
                {formatPrice(room.originalPrice, language)}
              </p>
            ) : null}
            <p className="whitespace-nowrap">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatPrice(room.price, language)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {" "}
                {t("room.perMonth")}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleFavorite}
            className={favoriteButtonClass}
            aria-label={favoriteLabel}
            title={favoriteLabel}
          >
            <HeartIcon filled={saved} className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
