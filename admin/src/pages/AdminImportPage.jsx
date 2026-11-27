import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { importRoHang } from "../api/client";
import { PageHeader } from "../components/AdminUI";
import { ErrorMessage } from "../components/FormFields";
import ImportPreview from "../components/ImportPreview";
import { thClass, tdClass } from "../components/adminStyles";
import { UploadIcon, CheckIcon, AlertIcon } from "../components/Icons";

const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6";
const primaryButtonClass =
  "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

// Ô số liệu: "Tòa nhà: 3 mới · 37 cập nhật"
function SummaryCard({ title, created, updated }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
        <span className="text-emerald-700 dark:text-emerald-400">
          {t("admin.import.created", { count: created })}
        </span>
        <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
        <span>{t("admin.import.updated", { count: updated })}</span>
      </p>
    </div>
  );
}

function IssuesTable({ issues }) {
  const { t } = useTranslation();

  if (issues.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
        <CheckIcon className="h-4 w-4" />
        {t("admin.import.noIssues")}
      </p>
    );
  }

  // Lỗi lên trước, sau đó theo sheet và số dòng
  const sorted = issues.slice().sort((a, b) => {
    if (a.level !== b.level) {
      return a.level === "error" ? -1 : 1;
    }
    if (a.sheet !== b.sheet) {
      return a.sheet < b.sheet ? -1 : 1;
    }
    return (a.row || 0) - (b.row || 0);
  });

  return (
    <div className="max-h-[480px] overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="sticky top-0">
          <tr>
            <th className={thClass}>{t("admin.import.sheet")}</th>
            <th className={thClass}>{t("admin.import.row")}</th>
            <th className={thClass}>{t("admin.import.column")}</th>
            <th className={thClass}>{t("admin.import.message")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((issue, index) => {
            let levelBadge;
            if (issue.level === "error") {
              levelBadge = (
                <span className="mr-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                  {t("admin.import.levelError")}
                </span>
              );
            } else {
              levelBadge = (
                <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {t("admin.import.levelWarning")}
                </span>
              );
            }

            return (
              <tr key={index}>
                <td className={tdClass + " whitespace-nowrap"}>{issue.sheet}</td>
                <td className={tdClass}>{issue.row || "-"}</td>
                <td className={tdClass + " whitespace-nowrap"}>{issue.column || "-"}</td>
                <td className={tdClass}>
                  {levelBadge}
                  <span className="text-slate-700 dark:text-slate-200">{issue.message}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminImportPage() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState("");
  const [errorCode, setErrorCode] = useState("");

  // Chọn file xong là kiểm tra luôn (chưa ghi gì)
  async function handleSelectFile(event) {
    const selected = event.target.files[0];
    event.target.value = "";
    if (!selected) {
      return;
    }

    setFile(selected);
    setResult(null);
    setErrorCode("");
    setBusy("check");
    try {
      const data = await importRoHang(selected, false);
      setResult(data);
    } catch (err) {
      setErrorCode(err.code);
    }
    setBusy("");
  }

  async function handleCommit() {
    setErrorCode("");
    setBusy("commit");
    try {
      const data = await importRoHang(file, true);
      setResult(data);
    } catch (err) {
      setErrorCode(err.code);
    }
    setBusy("");
  }

  let errorMessage = "";
  if (errorCode) {
    errorMessage = t("errors." + errorCode);
  }

  let chooseLabel = t("admin.import.chooseFile");
  if (file) {
    chooseLabel = t("admin.import.chooseAnother");
  }

  let chooseClass = secondaryButtonClass;
  if (busy) {
    chooseClass = chooseClass + " pointer-events-none opacity-60";
  }

  let fileName = null;
  if (file) {
    fileName = <span className="truncate text-sm text-slate-600 dark:text-slate-300">{file.name}</span>;
  }

  let checking = null;
  if (busy === "check") {
    checking = <p className="text-sm text-slate-500 dark:text-slate-400">{t("admin.import.checking")}</p>;
  }

  let resultBlock = null;
  if (result) {
    const errorCount = result.issues.filter((issue) => issue.level === "error").length;
    const warningCount = result.issues.length - errorCount;

    let action;
    if (result.committed) {
      action = (
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckIcon className="h-4 w-4" />
            {t("admin.import.done")}
          </p>
          <Link to="/buildings" className={secondaryButtonClass}>
            {t("admin.import.viewBuildings")}
          </Link>
          <Link to="/rooms?status=hidden" className={secondaryButtonClass}>
            {t("admin.import.viewHiddenRooms")}
          </Link>
        </div>
      );
    } else {
      let commitText = t("admin.import.commit");
      if (busy === "commit") {
        commitText = t("admin.import.committing");
      }
      action = (
        <button
          type="button"
          onClick={handleCommit}
          disabled={busy !== "" || result.totals.projects === 0}
          className={primaryButtonClass}
        >
          <UploadIcon className="h-4 w-4" />
          {commitText}
        </button>
      );
    }

    // Phường lấy từ cây thư mục ảnh trên Drive
    let driveLine = t("admin.import.driveNotChecked");
    if (result.driveChecked) {
      driveLine = t("admin.import.wardsFromDrive", { count: result.summary.wardsFromDrive });
      if (result.committed && result.summary.wardsFilled !== undefined) {
        driveLine = driveLine + " " + t("admin.import.wardsFilled", { count: result.summary.wardsFilled });
      }
    }

    let errorCountText = null;
    if (errorCount > 0) {
      errorCountText = (
        <span className="text-rose-600 dark:text-rose-400">
          {t("admin.import.errorCount", { count: errorCount })}
        </span>
      );
    }
    let warningCountText = null;
    if (warningCount > 0) {
      warningCountText = (
        <span className="text-amber-700 dark:text-amber-400">
          {t("admin.import.warningCount", { count: warningCount })}
        </span>
      );
    }

    resultBlock = (
      <>
        <section className={cardClass + " space-y-4"}>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {t("admin.import.found", {
              projects: result.totals.projects,
              rooms: result.totals.rooms,
              groups: result.totals.roomGroups,
            })}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              title={t("admin.import.buildings")}
              created={result.summary.buildingsCreated}
              updated={result.summary.buildingsUpdated}
            />
            <SummaryCard
              title={t("admin.import.rooms")}
              created={result.summary.roomsCreated}
              updated={result.summary.roomsUpdated}
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {driveLine}
          </p>
          <p className="flex gap-2 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {t("admin.import.hiddenNote")}
          </p>
          {action}
        </section>

        {result.projects ? <ImportPreview projects={result.projects} /> : null}

        <section className={cardClass + " space-y-4"}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              {t("admin.import.issues")}
            </h2>
            <p className="flex gap-3 text-sm">
              {errorCountText}
              {warningCountText}
            </p>
          </div>
          <IssuesTable issues={result.issues} />
        </section>
      </>
    );
  }

  return (
    <div>
      <PageHeader title={t("admin.import.title")} subtitle={t("admin.import.subtitle")} />
      <div className="space-y-6">
        <ErrorMessage message={errorMessage} />

        <section className={cardClass + " flex flex-wrap items-center gap-3"}>
          <label className={chooseClass}>
            <UploadIcon className="h-4 w-4" />
            {chooseLabel}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleSelectFile}
              disabled={busy !== ""}
              className="sr-only"
            />
          </label>
          {fileName}
          {checking}
        </section>

        {resultBlock}
      </div>
    </div>
  );
}
