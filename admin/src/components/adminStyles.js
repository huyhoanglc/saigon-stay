// Các chuỗi class Tailwind dùng chung cho bảng và nút trong trang admin

export const thClass =
  "border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400";
export const tdClass =
  "border-b border-slate-100 px-4 py-3 align-middle dark:border-slate-800";

export const smallSelectClass =
  "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";

// Dòng của bảng: dòng chẵn nền xám (sọc kiểu Excel cho dễ dò từng dòng),
// rê chuột vào dòng nào thì dòng đó sáng màu emerald nhạt
export const rowClass =
  "even:bg-slate-100/70 hover:bg-emerald-50 dark:even:bg-slate-800/50 dark:hover:bg-emerald-900/20";

// Nút icon cho hành động nguy hiểm (xoá): luôn màu đỏ để không bấm nhầm
export const dangerIconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300";
