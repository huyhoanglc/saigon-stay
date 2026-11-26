import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminInquiries } from "../hooks/useAdminInquiries";
import { updateInquiryStatus } from "../api/client";
import {
  PageHeader,
  StateMessage,
  TableWrapper,
  StatusBadge,
} from "../components/AdminUI";
import { ErrorMessage } from "../components/FormFields";
import { thClass, tdClass, smallSelectClass } from "../components/adminStyles";
import Pagination from "../components/Pagination";
import { INQUIRY_STATUSES } from "../utils/constants";

export default function AdminInquiriesPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState("");

  const status = searchParams.get("status") || "";
  let page = Number(searchParams.get("page"));
  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  const { inquiries, total, totalPages, loading, error } = useAdminInquiries({
    status: status,
    page: page,
    reloadKey: reloadKey,
  });

  function handleStatusFilter(newStatus) {
    const next = new URLSearchParams();
    if (newStatus) {
      next.set("status", newStatus);
    }
    setSearchParams(next);
  }

  function handlePageChange(newPage) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleChangeStatus(inquiry, newStatus) {
    setActionError("");
    try {
      await updateInquiryStatus(inquiry._id, newStatus);
      setReloadKey(reloadKey + 1);
    } catch (err) {
      setActionError(t("errors." + err.code));
    }
  }

  // Ngày giờ đầy đủ để sale biết khách gửi lúc nào
  function formatDateTime(value) {
    let locale = "vi-VN";
    if (i18n.language === "en") {
      locale = "en-US";
    }
    return new Date(value).toLocaleString(locale, {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  // Các nút lọc trạng thái dạng tab
  const filterTabs = [{ value: "", label: t("admin.inquiries.allStatuses") }];
  for (const item of INQUIRY_STATUSES) {
    filterTabs.push({ value: item, label: t("inquiryStatus." + item) });
  }

  function getTabClass(value) {
    let cls = "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition";
    if (value === status) {
      cls = cls + " bg-emerald-600 text-white";
    } else {
      cls =
        cls +
        " bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800";
    }
    return cls;
  }

  let content;
  if (loading) {
    content = <StateMessage>{t("common.loading")}</StateMessage>;
  } else if (error) {
    content = <StateMessage isError>{t("errors." + error.code)}</StateMessage>;
  } else if (inquiries.length === 0) {
    content = <StateMessage>{t("admin.inquiries.empty")}</StateMessage>;
  } else {
    content = (
      <>
        <TableWrapper>
          <thead>
            <tr>
              <th className={thClass}>{t("admin.inquiries.customer")}</th>
              <th className={thClass}>{t("admin.inquiries.room")}</th>
              <th className={thClass}>{t("admin.inquiries.note")}</th>
              <th className={thClass}>{t("admin.inquiries.createdAt")}</th>
              <th className={thClass}>{t("admin.inquiries.status")}</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => {
              let name = inquiry.name;
              if (!name) {
                name = t("admin.inquiries.noName");
              }

              // Phòng có thể đã bị xoá sau khi khách gửi yêu cầu
              let roomCell = (
                <span className="text-slate-400 dark:text-slate-500">
                  {t("admin.inquiries.deletedRoom")}
                </span>
              );
              if (inquiry.room) {
                let buildingName = "";
                if (inquiry.room.building) {
                  buildingName = inquiry.room.building.name;
                }
                roomCell = (
                  <Link
                    to={"/rooms/" + inquiry.room._id}
                    className="hover:text-emerald-700 dark:hover:text-emerald-400"
                  >
                    <span className="font-semibold">{inquiry.room.code}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {buildingName}
                    </span>
                  </Link>
                );
              }

              let staffLine = null;
              if (inquiry.staffCode) {
                staffLine = (
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    {t("admin.inquiries.staffCode")}: {inquiry.staffCode}
                  </span>
                );
              }

              return (
                <tr key={inquiry._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className={tdClass}>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{name}</p>
                    <a
                      href={"tel:" + inquiry.phone}
                      className="text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      {inquiry.phone}
                    </a>
                  </td>
                  <td className={tdClass + " text-slate-700 dark:text-slate-200"}>
                    {roomCell}
                  </td>
                  <td className={tdClass + " max-w-xs text-slate-600 dark:text-slate-300"}>
                    <span className="line-clamp-3 whitespace-pre-line break-words">
                      {inquiry.note || "-"}
                    </span>
                    {staffLine}
                  </td>
                  <td className={tdClass + " whitespace-nowrap text-slate-600 dark:text-slate-300"}>
                    {formatDateTime(inquiry.createdAt)}
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge
                        status={inquiry.status}
                        label={t("inquiryStatus." + inquiry.status)}
                      />
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleChangeStatus(inquiry, e.target.value)}
                        aria-label={t("admin.inquiries.status")}
                        className={smallSelectClass}
                      >
                        {INQUIRY_STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {t("inquiryStatus." + item)}
                          </option>
                        ))}
                      </select>
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

  return (
    <div>
      <PageHeader
        title={t("admin.nav.inquiries")}
        subtitle={t("admin.inquiries.count", { count: total })}
      />

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusFilter(tab.value)}
            className={getTabClass(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <ErrorMessage message={actionError} />
        {content}
      </div>
    </div>
  );
}
