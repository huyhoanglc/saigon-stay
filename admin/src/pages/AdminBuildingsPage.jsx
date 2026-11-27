import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminBuildingList } from "../hooks/useAdminBuildingList";
import { deleteBuilding } from "../api/client";
import {
  PageHeader,
  StateMessage,
  TableWrapper,
} from "../components/AdminUI";
import { ErrorMessage } from "../components/FormFields";
import {
  thClass,
  tdClass,
  iconButtonClass,
  smallSelectClass,
  rowClass,
  dangerIconButtonClass,
} from "../components/adminStyles";
import {
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  AlertIcon,
  SearchIcon,
} from "../components/Icons";
import Pagination from "../components/Pagination";
import { ROAD_TYPES } from "../utils/constants";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";

// Ngừng gõ bao lâu thì mới tìm (mili giây)
const SEARCH_DELAY_MS = 400;

export default function AdminBuildingsPage() {
  const { t } = useTranslation();
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  // Bộ lọc lưu trên URL: F5 không mất, gửi link cho người khác vẫn đúng bộ lọc
  const q = searchParams.get("q") || "";
  const area = searchParams.get("area") || "";
  const street = searchParams.get("street") || "";
  const roadType = searchParams.get("roadType") || "";
  const needsInfo = searchParams.get("needsInfo") === "true";
  let page = Number(searchParams.get("page"));
  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  let hasFilter = false;
  if (q !== "" || area !== "" || street !== "" || roadType !== "" || needsInfo) {
    hasFilter = true;
  }

  // Chữ đang gõ trong ô tìm kiếm. Khác với q (đang dùng để lọc) cho tới khi ngừng gõ.
  const [keyword, setKeyword] = useState(q);

  const { buildings, total, totalPages, areas, streets, loading, error } =
    useAdminBuildingList({
      q: q,
      area: area,
      street: street,
      roadType: roadType,
      needsInfo: needsInfo,
      page: page,
      reloadKey: reloadKey,
    });
  const { askConfirm, dialogProps } = useConfirm();

  // Tìm khi đang gõ: ngừng gõ 0.4 giây mới đưa từ khoá lên URL (để hook gọi API).
  // Gõ tiếp trước 0.4 giây thì huỷ hẹn giờ cũ → gõ cả chữ dài cũng chỉ gọi server 1-2 lần.
  useEffect(() => {
    const trimmed = keyword.trim();
    if (trimmed === q) {
      return;
    }

    const timer = setTimeout(() => {
      // Dạng hàm: lấy URL mới nhất, không ghi đè bộ lọc khác vừa đổi trong lúc chờ
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) {
          next.set("q", trimmed);
        } else {
          next.delete("q");
        }
        next.delete("page");
        return next;
      });
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [keyword, q, setSearchParams]);

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

  // Đổi khu vực thì bỏ chọn tên đường, vì đường cũ có thể không thuộc khu vực mới
  function handleAreaChange(event) {
    const next = new URLSearchParams(searchParams);
    if (event.target.value) {
      next.set("area", event.target.value);
    } else {
      next.delete("area");
    }
    next.delete("street");
    next.delete("page");
    setSearchParams(next);
  }

  function handleNeedsInfoChange(event) {
    let value = "";
    if (event.target.checked) {
      value = "true";
    }
    updateParam("needsInfo", value);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateParam("q", keyword.trim());
  }

  function handleResetFilters() {
    setKeyword("");
    setSearchParams(new URLSearchParams());
  }

  function handlePageChange(newPage) {
    updateParam("page", String(newPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(building) {
    // Tòa còn phòng: báo rõ sẽ xoá luôn bao nhiêu phòng, admin đồng ý mới xoá
    const roomCount = building.roomCount || 0;
    let message = t("admin.buildings.confirmDelete", { name: building.name });
    let confirmLabel = t("admin.common.delete");
    if (roomCount > 0) {
      message = t("admin.buildings.confirmDeleteWithRooms", { name: building.name, count: roomCount });
      confirmLabel = t("admin.buildings.deleteWithRooms", { count: roomCount });
    }

    askConfirm({
      title: t("admin.buildings.deleteTitle"),
      message: message,
      confirmLabel: confirmLabel,
      action: async () => {
        setActionError("");
        try {
          await deleteBuilding(building._id, roomCount > 0);
          // Xoá tòa cuối cùng của trang (không phải trang 1) thì lùi về trang trước, tránh trang trống
          if (buildings.length === 1 && page > 1) {
            updateParam("page", String(page - 1));
          } else {
            setReloadKey((key) => key + 1);
          }
        } catch (err) {
          setActionError(t("errors." + err.code));
        }
      },
    });
  }

  // Chỉ hiện "Đang tải" ở lần đầu. Những lần sau (đang gõ tìm, đổi bộ lọc) vẫn giữ bảng cũ
  // và làm mờ đi, để danh sách không bị nháy sau mỗi phím gõ.
  let isFirstLoad = false;
  if (loading && buildings.length === 0) {
    isFirstLoad = true;
  }

  let content;
  if (isFirstLoad) {
    content = <StateMessage>{t("common.loading")}</StateMessage>;
  } else if (error) {
    content = <StateMessage isError>{t("errors." + error.code)}</StateMessage>;
  } else if (buildings.length === 0) {
    content = <StateMessage>{t("admin.buildings.empty")}</StateMessage>;
  } else {
    content = (
      <TableWrapper>
        <thead>
          <tr>
            <th className={thClass}>{t("admin.buildings.name")}</th>
            <th className={thClass}>{t("admin.buildings.address")}</th>
            <th className={thClass}>{t("admin.buildings.roadType")}</th>
            <th className={thClass}>{t("admin.buildings.roomCount")}</th>
            <th className={thClass + " text-right"}>{t("admin.common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {buildings.map((building) => {
            // Admin thấy đủ địa chỉ, kể cả số nhà
            const address = building.address;
            let fullAddress = address.houseNumber + " " + address.street;
            if (address.ward) {
              fullAddress = fullAddress + ", " + address.ward;
            }

            // Tòa nhập từ Excel chưa có phường / tọa độ → nhắc admin bổ sung
            let needsInfoBadge = null;
            const hasLocation = building.location && building.location.coordinates && building.location.coordinates.length === 2;
            if (!address.ward || !hasLocation) {
              needsInfoBadge = (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <AlertIcon className="h-3 w-3" />
                  {t("admin.buildings.needsInfo")}
                </span>
              );
            }

            let projectCodeLine = null;
            if (building.projectCode) {
              projectCodeLine = (
                <p className="text-xs text-slate-500 dark:text-slate-400">{building.projectCode}</p>
              );
            }

            let newBadge = null;
            if (building.isNewOpening) {
              newBadge = (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  <SparklesIcon className="h-3 w-3" />
                  {t("room.newOpening")}
                </span>
              );
            }

            return (
              <tr key={building._id} className={rowClass}>
                <td className={tdClass}>
                  <Link
                    to={"/buildings/" + building._id}
                    className="font-medium text-slate-800 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-400"
                  >
                    {building.name}
                  </Link>
                  {newBadge}
                  {needsInfoBadge}
                  {projectCodeLine}
                </td>
                <td className={tdClass}>
                  <p className="text-slate-700 dark:text-slate-200">{fullAddress}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {address.area}
                  </p>
                </td>
                <td className={tdClass + " text-slate-600 dark:text-slate-300"}>
                  {building.roadType ? t("road." + building.roadType) : "-"}
                </td>
                <td className={tdClass}>
                  <Link
                    to={"/rooms?building=" + building._id}
                    className="text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    {t("rooms.count", { count: building.roomCount })}
                  </Link>
                </td>
                <td className={tdClass + " text-right"}>
                  <div className="inline-flex gap-1">
                    <Link
                      to={"/buildings/" + building._id}
                      className={iconButtonClass}
                      aria-label={t("admin.common.edit")}
                      title={t("admin.common.edit")}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(building)}
                      className={dangerIconButtonClass}
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
    );
  }

  // Có lọc mà không ra kết quả thì nói rõ là "không có tòa phù hợp", khác với "chưa có tòa nào"
  if (!loading && !error && buildings.length === 0 && hasFilter) {
    content = <StateMessage>{t("admin.buildings.noMatch")}</StateMessage>;
  }

  // Đang tải kết quả mới (không phải lần đầu) → làm mờ bảng cũ
  let contentClass = "transition-opacity";
  if (loading && !isFirstLoad) {
    contentClass = contentClass + " pointer-events-none opacity-60";
  }

  let pagination = null;
  if (!isFirstLoad && !error && buildings.length > 0) {
    pagination = (
      <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
    );
  }

  let resetButton = null;
  if (hasFilter) {
    resetButton = (
      <button
        type="button"
        onClick={handleResetFilters}
        className="text-sm text-slate-500 underline hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
      >
        {t("admin.buildings.resetFilters")}
      </button>
    );
  }

  const roadOptions = [
    { value: "", label: t("admin.buildings.allRoadTypes") },
  ];
  for (const road of ROAD_TYPES) {
    roadOptions.push({ value: road, label: t("road." + road) });
  }
  roadOptions.push({ value: "none", label: t("admin.buildings.roadTypeMissing") });

  return (
    <div>
      <PageHeader
        title={t("admin.nav.buildings")}
        subtitle={t("admin.buildings.count", { count: total })}
        addTo="/buildings/new"
        addLabel={t("admin.buildings.add")}
      />

      {/* Thanh lọc: điện thoại xếp dọc, màn rộng xếp ngang */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          onSubmit={handleSearchSubmit}
          className="flex min-w-0 flex-1 gap-2 sm:max-w-sm"
        >
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("admin.buildings.searchPlaceholder")}
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
          name="area"
          value={area}
          onChange={handleAreaChange}
          aria-label={t("admin.buildings.area")}
          className={smallSelectClass + " py-2"}
        >
          <option value="">{t("admin.buildings.allAreas")}</option>
          {areas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {/* Tên đường: đã chọn khu vực thì server chỉ trả các đường trong khu vực đó */}
        <select
          name="street"
          value={street}
          onChange={handleFilterChange}
          aria-label={t("admin.buildings.street")}
          className={smallSelectClass + " max-w-full py-2 sm:max-w-56"}
        >
          <option value="">{t("admin.buildings.allStreets")}</option>
          {streets.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          name="roadType"
          value={roadType}
          onChange={handleFilterChange}
          aria-label={t("admin.buildings.roadType")}
          className={smallSelectClass + " py-2"}
        >
          {roadOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={needsInfo}
            onChange={handleNeedsInfoChange}
            className="h-4 w-4 accent-amber-500"
          />
          {t("admin.buildings.needsInfoOnly")}
        </label>

        {resetButton}
      </div>

      <div className="space-y-4">
        <ErrorMessage message={actionError} />
        <div className={contentClass} aria-busy={loading}>
          {content}
        </div>
        {pagination}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
