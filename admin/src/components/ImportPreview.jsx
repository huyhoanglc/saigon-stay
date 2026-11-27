import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice, formatShort } from "../utils/format";
import { thClass, tdClass } from "./adminStyles";
import { SearchIcon } from "./Icons";

const badgeBase = "inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium";
const newBadgeClass = badgeBase + " bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
const updateBadgeClass = badgeBase + " bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
const chipClass =
  "inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200";

// Bỏ dấu + chữ thường để tìm kiếm không phân biệt "Cách Mạng" / "cach mang"
function searchKey(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function matches(project, keyword) {
  if (!keyword) {
    return true;
  }
  const parts = [project.projectCode, project.houseNumber, project.street, project.area, project.driveWard];
  for (const group of project.rooms) {
    parts.push(group.roomCodes.join(" "));
  }
  return searchKey(parts.join(" ")).includes(keyword);
}

function YesNo({ value }) {
  const { t } = useTranslation();
  if (value === true) {
    return <span className="text-emerald-700 dark:text-emerald-400">{t("admin.buildings.yes")}</span>;
  }
  if (value === false) {
    return <span className="text-slate-500 dark:text-slate-400">{t("admin.buildings.no")}</span>;
  }
  return <span className="text-amber-600 dark:text-amber-400">{t("admin.buildings.unknown")}</span>;
}

// Thông tin chung của 1 dự án (tòa nhà) dạng lưới nhãn - giá trị
function ProjectInfo({ project }) {
  const { t } = useTranslation();

  let elevator = <YesNo value={null} />;
  if (project.hasElevator === true) {
    elevator = t("admin.import.preview.elevator");
  } else if (project.hasElevator === false) {
    elevator = t("admin.import.preview.stairs");
  }

  let road = <YesNo value={null} />;
  if (project.roadType) {
    road = t("road." + project.roadType);
  }

  let zalo = "-";
  if (project.zaloGroupUrl) {
    zalo = (
      <a
        href={project.zaloGroupUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-emerald-700 hover:underline dark:text-emerald-400"
      >
        {project.zaloGroupUrl}
      </a>
    );
  }

  const items = [
    { label: t("admin.buildings.houseNumber"), value: project.houseNumber },
    { label: t("admin.buildings.street"), value: project.street },
    { label: t("admin.buildings.area"), value: project.area },
    { label: t("admin.buildings.ward"), value: project.driveWard || "-" },
    { label: t("admin.import.preview.stairsOrElevator"), value: elevator },
    { label: t("admin.buildings.roadType"), value: road },
    { label: t("admin.buildings.shortTermRental"), value: <YesNo value={project.shortTermRental} /> },
    { label: t("room.pet"), value: <YesNo value={project.petAllowed} /> },
    { label: t("admin.buildings.foreignersAllowed"), value: <YesNo value={project.foreignersAllowed} /> },
    { label: t("admin.buildings.ownerPhone"), value: project.ownerPhone || "-" },
    { label: t("admin.buildings.system"), value: project.system || "-" },
    { label: t("admin.buildings.ownerReview"), value: project.ownerReview || "-" },
    { label: t("admin.buildings.zaloGroup"), value: zalo },
  ];

  let policy = null;
  if (project.policy) {
    policy = (
      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {t("admin.import.preview.showPolicy")}
        </summary>
        <p className="mt-2 max-h-72 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
          {project.policy}
        </p>
      </details>
    );
  }

  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
            <dd className="text-sm text-slate-800 dark:text-slate-100">{item.value}</dd>
          </div>
        ))}
      </dl>
      {policy}
    </div>
  );
}

function RoomsTable({ project }) {
  const { t, i18n } = useTranslation();

  if (project.rooms.length === 0) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-400">{t("admin.import.preview.noRooms")}</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr>
            <th className={thClass}>{t("admin.rooms.code")}</th>
            <th className={thClass}>{t("admin.rooms.layout")}</th>
            <th className={thClass}>{t("admin.import.preview.price")}</th>
            <th className={thClass}>{t("room.balcony")}</th>
            <th className={thClass}>{t("admin.import.preview.window")}</th>
            <th className={thClass}>{t("room.washer")}</th>
            <th className={thClass}>{t("admin.import.preview.imageFolder")}</th>
            <th className={thClass}>{t("admin.import.row")}</th>
          </tr>
        </thead>
        <tbody>
          {project.rooms.map((group) => {
            const existing = group.existingCodes || [];
            return (
              <tr key={group.sourceRow}>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    {group.roomCodes.map((code) => {
                      // Mã phòng đã có trong hệ thống → viền xám (sẽ cập nhật), còn lại là phòng mới
                      let cls = chipClass;
                      if (!existing.includes(code)) {
                        cls = cls + " ring-1 ring-emerald-500";
                      }
                      return (
                        <span key={code} className={cls}>
                          {code}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className={tdClass + " whitespace-nowrap"}>{t("layout." + group.layout)}</td>
                <td className={tdClass + " whitespace-nowrap font-medium"}>
                  {formatPrice(group.price, i18n.language)}
                </td>
                <td className={tdClass}>
                  <YesNo value={group.balcony} />
                </td>
                <td className={tdClass}>
                  <YesNo value={group.window} />
                </td>
                <td className={tdClass}>
                  <YesNo value={group.privateWasher} />
                </td>
                <td className={tdClass + " max-w-[200px] truncate text-slate-600 dark:text-slate-300"} title={group.imageRef || ""}>
                  {group.imageRef || "-"}
                </td>
                <td className={tdClass + " text-slate-500 dark:text-slate-400"}>{group.sourceRow}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProjectCard({ project }) {
  const { t } = useTranslation();

  let roomCount = 0;
  let minPrice = null;
  let maxPrice = null;
  for (const group of project.rooms) {
    roomCount = roomCount + group.roomCodes.length;
    if (minPrice === null || group.price < minPrice) {
      minPrice = group.price;
    }
    if (maxPrice === null || group.price > maxPrice) {
      maxPrice = group.price;
    }
  }

  let priceText = "";
  if (minPrice !== null) {
    priceText = formatShort(minPrice);
    if (maxPrice !== minPrice) {
      priceText = priceText + " – " + formatShort(maxPrice);
    }
  }

  let badge = <span className={newBadgeClass}>{t("admin.import.preview.new")}</span>;
  if (project.exists) {
    badge = <span className={updateBadgeClass}>{t("admin.import.preview.update")}</span>;
  }

  return (
    <details className="group rounded-lg border border-slate-200 dark:border-slate-800">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <span className="text-slate-400 transition group-open:rotate-90">›</span>
        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
          {project.projectCode}
        </span>
        {badge}
        <span className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-300">
          {project.houseNumber} {project.street}, {project.area}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {t("rooms.count", { count: roomCount })}
          {priceText ? " · " + priceText : ""}
        </span>
        <span className="text-xs text-slate-400">
          {t("admin.import.row")} {project.sourceRow}
        </span>
      </summary>
      <div className="space-y-4 border-t border-slate-100 px-4 py-4 dark:border-slate-800">
        <ProjectInfo project={project} />
        <RoomsTable project={project} />
      </div>
    </details>
  );
}

// Danh sách dự án + phòng đọc được từ file Excel, để kiểm tra trước khi bấm nhập
export default function ImportPreview({ projects }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const keyword = searchKey(query.trim());
  const visible = projects.filter((project) => matches(project, keyword));

  let list;
  if (visible.length === 0) {
    list = (
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {t("admin.import.preview.noMatch")}
      </p>
    );
  } else {
    list = (
      <div className="space-y-2">
        {visible.map((project) => (
          <ProjectCard key={project.projectCode} project={project} />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {t("admin.import.preview.title", { count: projects.length })}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("admin.import.preview.hint")}</p>
        </div>
        <label className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.import.preview.search")}
            aria-label={t("admin.import.preview.search")}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </label>
      </div>
      {list}
    </section>
  );
}
