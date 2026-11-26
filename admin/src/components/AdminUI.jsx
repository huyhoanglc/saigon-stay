import { Link } from "react-router";
import { PlusIcon } from "./Icons";

// Tiêu đề trang admin, bên phải có thể có nút "Thêm mới"
export function PageHeader({ title, subtitle, addTo, addLabel }) {
  let addButton = null;
  if (addTo) {
    addButton = (
      <Link
        to={addTo}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
      >
        <PlusIcon className="h-4 w-4" />
        {addLabel}
      </Link>
    );
  }

  let subtitleText = null;
  if (subtitle) {
    subtitleText = (
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {subtitleText}
      </div>
      {addButton}
    </div>
  );
}

// Màu cho từng trạng thái phòng và yêu cầu tư vấn
const STATUS_COLORS = {
  available: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  upcoming: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  rented: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  hidden: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  new: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  contacted: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  viewed: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  closed: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

export function StatusBadge({ status, label }) {
  let cls = "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (STATUS_COLORS[status]) {
    cls = cls + " " + STATUS_COLORS[status];
  }
  return <span className={cls}>{label}</span>;
}

// Dòng chữ trạng thái chung: đang tải, lỗi, danh sách trống
export function StateMessage({ children, isError }) {
  let cls =
    "rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm dark:border-slate-700";
  if (isError) {
    cls = cls + " text-rose-600 dark:text-rose-400";
  } else {
    cls = cls + " text-slate-500 dark:text-slate-400";
  }
  return <p className={cls}>{children}</p>;
}

// Khung bảng: tự cuộn ngang bên trong khi màn hình hẹp, không làm tràn trang
export function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
    </div>
  );
}
