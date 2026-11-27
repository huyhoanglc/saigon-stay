import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useRoom } from "../hooks/useRoom";
import { useFavorites } from "../context/FavoritesContext";
import Container from "../components/Container";
import RoomSection from "../components/RoomSection";
import RoomGallery from "../components/detail/RoomGallery";
import CostEstimator from "../components/detail/CostEstimator";
import InquiryForm from "../components/detail/InquiryForm";
import ShareBox from "../components/detail/ShareBox";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  FireIcon,
  HeartIcon,
  MapPinIcon,
} from "../components/Icons";
import { formatPrice, formatDate } from "../utils/format";

const FEE_KEYS = [
  "electricity",
  "water",
  "wifi",
  "trash",
  "parking",
  "management",
];

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0 dark:border-slate-800">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function AmenityItem({ label, available }) {
  if (available) {
    return (
      <li className="flex items-center gap-2 text-sm">
        <CheckIcon className="h-4 w-4 text-emerald-600" />
        {label}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 text-sm text-slate-400 line-through">
      <CloseIcon className="h-4 w-4" />
      {label}
    </li>
  );
}

export default function RoomDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { room, loading, error } = useRoom(id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const language = i18n.language;

  // Đổi tiêu đề tab trình duyệt
  useEffect(() => {
    if (room) {
      // Chưa có tiêu đề thì dùng "Tên tòa · Mã phòng", giống phần tiêu đề trên trang
      let tabTitle = room.title;
      if (!tabTitle && room.building) {
        tabTitle = room.building.name + " · " + room.code;
      }
      if (tabTitle) {
        document.title = tabTitle + " | SaiGon Stay";
      }
    }

    return () => {
      document.title = "SaiGon Stay";
    };
  }, [room]);

  // ===== Đang tải =====
  if (loading) {
    return (
      <Container className="py-8">
        <div className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="aspect-4/3 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-4">
            <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </Container>
    );
  }

  // ===== Lỗi =====
  if (error) {
    let message = t("errors." + error.code);
    if (error.code === "ROOM_NOT_FOUND" || error.code === "INVALID_ID") {
      message = t("detail.notFound");
    }

    return (
      <Container className="py-24 text-center">
        <p className="text-slate-600 dark:text-slate-300">{message}</p>
        <Link
          to="/"
          className="mt-4 inline-block text-emerald-700 underline dark:text-emerald-400"
        >
          {t("detail.back")}
        </Link>
      </Container>
    );
  }

  if (!room) {
    return null;
  }

  const building = room.building;

  // ===== Tiêu đề, địa chỉ =====
  let title = room.title;
  if (!title) {
    title = building.name + " · " + room.code;
  }

  // Ghép địa chỉ, bỏ qua phần còn trống (tòa nhập từ Excel có thể chưa có phường)
  const addressParts = [];
  if (building.address.street) {
    addressParts.push(building.address.street);
  }
  if (building.address.ward) {
    addressParts.push(building.address.ward);
  }
  if (building.address.area) {
    addressParts.push(building.address.area);
  }
  const addressText = addressParts.join(", ");

  // ===== Trạng thái =====
  const isUpcoming = room.status === "upcoming";

  let statusText;
  let statusClass = "rounded-full px-3 py-1 text-xs font-semibold";
  let availableText;
  if (isUpcoming) {
    statusText = t("room.upcoming");
    statusClass =
      statusClass +
      " bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    availableText = t("room.availableFrom", {
      date: formatDate(room.availableFrom, language),
    });
  } else {
    statusText = t("room.available");
    statusClass =
      statusClass +
      " bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    availableText = t("room.moveInNow");
  }

  // ===== Giá =====
  let hasDiscount = false;
  if (room.originalPrice && room.originalPrice > room.price) {
    hasDiscount = true;
  }

  // ===== Quan tâm =====
  const saved = isFavorite(room._id);

  function handleToggleFavorite() {
    toggleFavorite(room);
  }

  function handleScrollToInquiry() {
    const form = document.getElementById("inquiry");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  let favoriteClass =
    "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 font-semibold transition";
  let favoriteText;
  if (saved) {
    favoriteClass =
      favoriteClass +
      " border-rose-500 bg-rose-500 text-white hover:bg-rose-600";
    favoriteText = t("detail.favoriteRemove");
  } else {
    favoriteClass =
      favoriteClass +
      " border-rose-500 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40";
    favoriteText = t("detail.favoriteAdd");
  }

  // ===== Thông tin phòng =====
  let floorText = "—";
  if (room.floor === 0) {
    floorText = t("detail.groundFloor");
  } else if (room.floor) {
    floorText = String(room.floor);
  }

  let separateKitchenText = t("detail.no");
  if (room.separateKitchen) {
    separateKitchenText = t("detail.yes");
  }

  // Phòng nhập từ Excel chưa có diện tích → hiện "Đang cập nhật" thay vì "undefined m²"
  let sizeText = t("detail.updating");
  if (room.size) {
    sizeText = room.size + " m²";
  }

  let privateWasherText = t("detail.no");
  if (room.privateWasher) {
    privateWasherText = t("detail.yes");
  }

  // ===== Tiện ích tòa nhà =====
  // Tòa nhập từ Excel có thể chưa có thông tin đường vào
  let roadText = t("detail.updating");
  if (building.roadType) {
    roadText = t("road." + building.roadType);
  }
  if (building.isDeadEnd) {
    roadText = roadText + " · " + t("amenity.deadEnd");
  }

  let cleaningLabel = t("amenity.noCleaning");
  if (building.cleaningPerWeek > 0) {
    cleaningLabel = t("amenity.cleaning", { count: building.cleaningPerWeek });
  }

  const amenities = [
    {
      key: "elevator",
      label: t("amenity.elevator"),
      available: building.hasElevator,
    },
    {
      key: "security",
      label: t("amenity.security"),
      available: building.hasSecurity,
    },
    {
      key: "fireSafety",
      label: t("amenity.fireSafety"),
      available: building.hasFireSafety,
    },
    { key: "pet", label: t("amenity.pet"), available: building.petAllowed },
    {
      key: "freeHours",
      label: t("amenity.freeHours"),
      available: building.freeHours,
    },
    {
      key: "cleaning",
      label: cleaningLabel,
      available: building.cleaningPerWeek > 0,
    },
  ];

  // ===== Chi phí dịch vụ =====
  const feeRows = [];
  if (building.fees) {
    for (const key of FEE_KEYS) {
      const fee = building.fees[key];
      if (!fee) {
        continue;
      }

      let value;
      if (fee.pricing === "state") {
        value = t("room.statePrice");
      } else {
        value = formatPrice(fee.amount, language) + "/" + t("unit." + fee.unit);
      }

      feeRows.push(<InfoRow key={key} label={t("fee." + key)} value={value} />);
    }
  }

  let feeContent;
  if (feeRows.length === 0) {
    feeContent = <p className="text-sm text-slate-500">{t("detail.noFees")}</p>;
  } else {
    feeContent = <dl>{feeRows}</dl>;
  }

  // ===== Mô tả =====
  let descriptionContent;
  if (room.description) {
    descriptionContent = (
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {room.description}
      </p>
    );
  } else {
    descriptionContent = (
      <p className="text-sm text-slate-500">{t("detail.noDescription")}</p>
    );
  }

  return (
    <Container className="space-y-12 py-6 lg:py-8">
      <div className="space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t("detail.back")}
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          {/* Cột trái - ảnh */}
          <div className="lg:col-start-1 lg:row-start-1">
            <RoomGallery images={room.images} title={title} />
          </div>

          {/* Cột phải - giá, nút, form */}
          <aside className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                {t("layout." + room.layout)} · {building.address.area} ·{" "}
                {t("furniture." + room.furniture)}
              </p>

              <h1 className="text-2xl font-bold uppercase leading-tight sm:text-3xl">
                {title}
              </h1>

              <p className="flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                {addressText}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className={statusClass}>{statusText}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium dark:bg-slate-800">
                  {t("detail.roomCode")}: <strong>{room.code}</strong>
                </span>
                {building.isNewOpening ? (
                  <span className="rounded-full bg-sky-600 px-3 py-1 text-xs font-bold uppercase text-white">
                    {t("room.newOpening")}
                  </span>
                ) : null}
                {room.isHot ? (
                  <span className="flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase text-white">
                    <FireIcon className="h-3.5 w-3.5" />
                    {t("room.hot")}
                  </span>
                ) : null}
              </div>

              <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                {availableText}
              </p>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                {hasDiscount ? (
                  <p className="text-sm text-slate-400 line-through">
                    {formatPrice(room.originalPrice, language)}
                  </p>
                ) : null}
                <p>
                  <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatPrice(room.price, language)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {" "}
                    {t("room.perMonth")}
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={favoriteClass}
                >
                  <HeartIcon filled={saved} className="h-5 w-5" />
                  {favoriteText}
                </button>
                <button
                  type="button"
                  onClick={handleScrollToInquiry}
                  className="flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {t("detail.contactNow")}
                </button>
              </div>
            </div>

            <InquiryForm roomId={room._id} />
            <ShareBox room={room} />
          </aside>

          {/* Cột trái - chi tiết */}
          <div className="space-y-6 lg:col-start-1 lg:row-start-2">
            <SectionCard title={t("detail.description")}>
              {descriptionContent}
            </SectionCard>

            <div className="grid gap-6 md:grid-cols-2">
              <SectionCard title={t("detail.roomInfo")}>
                <dl>
                  <InfoRow
                    label={t("filters.layout")}
                    value={t("layout." + room.layout)}
                  />
                  <InfoRow label={t("detail.size")} value={sizeText} />
                  <InfoRow label={t("detail.floor")} value={floorText} />
                  <InfoRow
                    label={t("detail.maxOccupants")}
                    value={t("detail.people", { count: room.maxOccupants })}
                  />
                  <InfoRow
                    label={t("detail.window")}
                    value={t("window." + room.window)}
                  />
                  <InfoRow
                    label={t("detail.furniture")}
                    value={t("furniture." + room.furniture)}
                  />
                  <InfoRow
                    label={t("detail.separateKitchen")}
                    value={separateKitchenText}
                  />
                  <InfoRow
                    label={t("detail.privateWasher")}
                    value={privateWasherText}
                  />
                  <InfoRow
                    label={t("detail.deposit")}
                    value={t("detail.months", { count: room.depositMonths })}
                  />
                  <InfoRow
                    label={t("detail.minLease")}
                    value={t("detail.months", { count: room.minLeaseMonths })}
                  />
                </dl>
              </SectionCard>

              <SectionCard title={t("detail.buildingInfo")}>
                <dl className="mb-4">
                  <InfoRow label={t("detail.road")} value={roadText} />
                  <InfoRow
                    label={t("detail.parking")}
                    value={t("parking." + building.parking)}
                  />
                </dl>
                <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                  {amenities.map((item) => (
                    <AmenityItem
                      key={item.key}
                      label={item.label}
                      available={item.available}
                    />
                  ))}
                </ul>
              </SectionCard>
            </div>

            <SectionCard title={t("detail.fees")}>{feeContent}</SectionCard>

            <CostEstimator room={room} />
          </div>
        </div>
      </div>

      <RoomSection
        title={t("detail.otherRooms")}
        params={{ building: building._id, exclude: room._id, limit: 10 }}
      />
    </Container>
  );
}
