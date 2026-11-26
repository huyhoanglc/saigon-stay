import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminStats } from "../../hooks/admin/useAdminStats";
import { PageHeader, StatusBadge, StateMessage } from "../../components/admin/AdminUI";
import { ROOM_STATUSES, INQUIRY_STATUSES } from "../../utils/constants";
import { formatDate } from "../../utils/format";

function StatCard({ label, value, highlight }) {
  let valueClass = "mt-1 text-3xl font-bold text-slate-900 dark:text-slate-50";
  if (highlight) {
    valueClass = "mt-1 text-3xl font-bold text-rose-500";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

// Một khối liệt kê số lượng theo trạng thái, kèm thanh tỉ lệ
function StatusBreakdown({ title, counts, statuses, labelPrefix, linkTo }) {
  const { t } = useTranslation();

  let total = 0;
  for (const status of statuses) {
    total = total + counts[status];
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
        <Link
          to={linkTo}
          className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {t("admin.dashboard.viewAll")}
        </Link>
      </div>
      <ul className="space-y-3">
        {statuses.map((status) => {
          let percent = 0;
          if (total > 0) {
            percent = Math.round((counts[status] / total) * 100);
          }
          return (
            <li key={status}>
              <div className="flex items-center justify-between text-sm">
                <StatusBadge status={status} label={t(labelPrefix + status)} />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {counts[status]}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: percent + "%" }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { stats, loading, error } = useAdminStats();

  let content;
  if (loading) {
    content = <StateMessage>{t("common.loading")}</StateMessage>;
  } else if (error) {
    content = <StateMessage isError>{t("errors." + error.code)}</StateMessage>;
  } else {
    let totalRooms = 0;
    for (const status of ROOM_STATUSES) {
      totalRooms = totalRooms + stats.roomsByStatus[status];
    }

    let latestList;
    if (stats.latestInquiries.length === 0) {
      latestList = (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("admin.dashboard.noNewInquiries")}
        </p>
      );
    } else {
      latestList = (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {stats.latestInquiries.map((inquiry) => {
            let roomText = t("admin.inquiries.deletedRoom");
            if (inquiry.room) {
              roomText = inquiry.room.code;
              if (inquiry.room.building) {
                roomText = inquiry.room.building.name + " · " + inquiry.room.code;
              }
            }
            let name = inquiry.name;
            if (!name) {
              name = t("admin.inquiries.noName");
            }
            return (
              <li
                key={inquiry._id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {name} ·{" "}
                    <a
                      href={"tel:" + inquiry.phone}
                      className="text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      {inquiry.phone}
                    </a>
                  </p>
                  <p className="truncate text-slate-500 dark:text-slate-400">
                    {roomText}
                  </p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(inquiry.createdAt, i18n.language)}
                </span>
              </li>
            );
          })}
        </ul>
      );
    }

    content = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t("admin.dashboard.buildings")} value={stats.buildingCount} />
          <StatCard label={t("admin.dashboard.rooms")} value={totalRooms} />
          <StatCard label={t("admin.dashboard.hotRooms")} value={stats.hotRoomCount} />
          <StatCard
            label={t("admin.dashboard.newInquiries")}
            value={stats.inquiriesByStatus.new}
            highlight={stats.inquiriesByStatus.new > 0}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <StatusBreakdown
            title={t("admin.dashboard.roomsByStatus")}
            counts={stats.roomsByStatus}
            statuses={ROOM_STATUSES}
            labelPrefix="roomStatus."
            linkTo="/admin/rooms"
          />
          <StatusBreakdown
            title={t("admin.dashboard.inquiriesByStatus")}
            counts={stats.inquiriesByStatus}
            statuses={INQUIRY_STATUSES}
            labelPrefix="inquiryStatus."
            linkTo="/admin/inquiries"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              {t("admin.dashboard.latestInquiries")}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t("admin.dashboard.last7Days", { count: stats.inquiriesLast7Days })}
            </span>
          </div>
          {latestList}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t("admin.nav.dashboard")} />
      {content}
    </div>
  );
}
