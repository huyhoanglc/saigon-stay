import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminRooms } from "../hooks/useAdminRooms";
import { useAdminBuildings } from "../hooks/useAdminBuildings";
import { patchRoom, deleteRoom } from "../api/client";
import {
  PageHeader,
  StateMessage,
  TableWrapper,
} from "../components/AdminUI";
import { ErrorMessage } from "../components/FormFields";
import {
  thClass,
  tdClass,
  smallSelectClass,
  iconButtonClass,
} from "../components/adminStyles";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { PencilIcon, TrashIcon, SearchIcon } from "../components/Icons";
import { ROOM_STATUSES } from "../utils/constants";
import { formatPrice } from "../utils/format";

// Công tắc bật/tắt Hot
function HotSwitch({ checked, onToggle, label }) {
  let trackClass =
    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition";
  let thumbClass =
    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition";
  if (checked) {
    trackClass = trackClass + " bg-orange-500";
    thumbClass = thumbClass + " translate-x-5";
  } else {
    trackClass = trackClass + " bg-slate-300 dark:bg-slate-600";
    thumbClass = thumbClass + " translate-x-0.5";
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={trackClass}
    >
      <span className={thumbClass} />
    </button>
  );
}

export default function AdminRoomsPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadKey, setReloadKey] = useState(0);
  const { askConfirm, dialogProps } = useConfirm();
  const [actionError, setActionError] = useState("");

  // Bộ lọc đọc từ URL
  const building = searchParams.get("building") || "";
  const status = searchParams.get("status") || "";
  const q = searchParams.get("q") || "";
  const hot = searchParams.get("hot") === "true";
  let page = Number(searchParams.get("page"));
  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  // Ô tìm kiếm chỉ áp dụng khi bấm Enter / nút tìm, không gọi API mỗi lần gõ phím
  const [keyword, setKeyword] = useState(q);

  const { rooms, total, totalPages, loading, error } = useAdminRooms({
    building: building,
    status: status,
    q: q,
    hot: hot,
    page: page,
    reloadKey: reloadKey,
  });
  const buildingsResult = useAdminBuildings(0);

  // Cập nhật 1 tham số trên URL, đổi bộ lọc thì quay về trang 1
  function updateParam(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    if (name !== "page") {
      next.delete("page");
    }
    setSearchParams(next);
  }

  function handleFilterChange(event) {
    updateParam(event.target.name, event.target.value);
  }

  function handleHotFilterChange(event) {
    let value = "";
    if (event.target.checked) {
      value = "true";
    }
    updateParam("hot", value);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateParam("q", keyword.trim());
  }

  function handlePageChange(newPage) {
    updateParam("page", String(newPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleQuickChange(room, changes) {
    setActionError("");
    try {
      await patchRoom(room._id, changes);
      setReloadKey(reloadKey + 1);
    } catch (err) {
      setActionError(t("errors." + err.code));
    }
  }

  function handleDelete(room) {
    askConfirm({
      title: t("admin.rooms.deleteTitle"),
      message: t("admin.rooms.confirmDelete", { code: room.code }),
      confirmLabel: t("admin.common.delete"),
      action: async () => {
        setActionError("");
        try {
          await deleteRoom(room._id);
          setReloadKey((key) => key + 1);
        } catch (err) {
          setActionError(t("errors." + err.code));
        }
      },
    });
  }

  const statusOptions = [];
  for (const item of ROOM_STATUSES) {
    statusOptions.push({ value: item, label: t("roomStatus." + item) });
  }

  let content;
  if (loading) {
    content = <StateMessage>{t("common.loading")}</StateMessage>;
  } else if (error) {
    content = <StateMessage isError>{t("errors." + error.code)}</StateMessage>;
  } else if (rooms.length === 0) {
    content = <StateMessage>{t("rooms.empty")}</StateMessage>;
  } else {
    content = (
      <>
        <TableWrapper>
          <thead>
            <tr>
              <th className={thClass}>{t("admin.rooms.code")}</th>
              <th className={thClass}>{t("admin.rooms.building")}</th>
              <th className={thClass}>{t("admin.rooms.layout")}</th>
              <th className={thClass}>{t("admin.rooms.price")}</th>
              <th className={thClass}>{t("admin.rooms.status")}</th>
              <th className={thClass}>{t("room.hot")}</th>
              <th className={thClass + " text-right"}>{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => {
              let buildingName = "-";
              if (room.building) {
                buildingName = room.building.name;
              }

              let titleLine = null;
              if (room.title) {
                titleLine = (
                  <p className="max-w-[220px] truncate text-xs text-slate-500 dark:text-slate-400">
                    {room.title}
                  </p>
                );
              }

              return (
                <tr key={room._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className={tdClass}>
                    <Link
                      to={"/rooms/" + room._id}
                      className="font-semibold text-slate-800 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-400"
                    >
                      {room.code}
                    </Link>
                    {titleLine}
                  </td>
                  <td className={tdClass + " text-slate-700 dark:text-slate-200"}>
                    {buildingName}
                  </td>
                  <td className={tdClass + " whitespace-nowrap text-slate-600 dark:text-slate-300"}>
                    {t("layout." + room.layout)} · {room.size ? room.size + " m²" : "— m²"}
                  </td>
                  <td className={tdClass + " whitespace-nowrap font-medium text-slate-800 dark:text-slate-100"}>
                    {formatPrice(room.price, i18n.language)}
                  </td>
                  <td className={tdClass}>
                    <select
                      value={room.status}
                      onChange={(e) => handleQuickChange(room, { status: e.target.value })}
                      aria-label={t("admin.rooms.status")}
                      className={smallSelectClass}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={tdClass}>
                    <HotSwitch
                      checked={room.isHot}
                      onToggle={() => handleQuickChange(room, { isHot: !room.isHot })}
                      label={t("admin.rooms.isHot") + " " + room.code}
                    />
                  </td>
                  <td className={tdClass + " text-right"}>
                    <div className="inline-flex gap-1">
                      <Link
                        to={"/rooms/" + room._id}
                        className={iconButtonClass}
                        aria-label={t("admin.common.edit")}
                        title={t("admin.common.edit")}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(room)}
                        className={iconButtonClass + " hover:text-rose-600 dark:hover:text-rose-400"}
                        aria-label={t("admin.common.delete")}
                        title={t("admin.common.delete")}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
      </>
    );
  }

  // Link "Thêm phòng" mang theo tòa đang lọc để chọn sẵn trong form
  let addTo = "/rooms/new";
  if (building) {
    addTo = addTo + "?building=" + building;
  }

  return (
    <div>
      <PageHeader
        title={t("admin.nav.rooms")}
        subtitle={t("rooms.count", { count: total })}
        addTo={addTo}
        addLabel={t("admin.rooms.add")}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1 gap-2 sm:max-w-xs">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("admin.rooms.searchPlaceholder")}
            aria-label={t("admin.common.search")}
            className={smallSelectClass + " min-w-0 flex-1 py-2"}
          />
          <button
            type="submit"
            className={iconButtonClass + " h-10 w-10 border border-slate-300 dark:border-slate-700"}
            aria-label={t("admin.common.search")}
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </form>

        <select
          name="building"
          value={building}
          onChange={handleFilterChange}
          aria-label={t("admin.rooms.building")}
          className={smallSelectClass + " py-2"}
        >
          <option value="">{t("admin.rooms.allBuildings")}</option>
          {buildingsResult.buildings.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          name="status"
          value={status}
          onChange={handleFilterChange}
          aria-label={t("admin.rooms.status")}
          className={smallSelectClass + " py-2"}
        >
          <option value="">{t("admin.rooms.allStatuses")}</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={hot}
            onChange={handleHotFilterChange}
            className="h-4 w-4 accent-orange-500"
          />
          {t("admin.rooms.hotOnly")}
        </label>
      </div>

      <div className="space-y-4">
        <ErrorMessage message={actionError} />
        {content}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
