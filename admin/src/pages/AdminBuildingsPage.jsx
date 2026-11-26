import { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminBuildings } from "../hooks/useAdminBuildings";
import { deleteBuilding } from "../api/client";
import {
  PageHeader,
  StateMessage,
  TableWrapper,
} from "../components/AdminUI";
import { ErrorMessage } from "../components/FormFields";
import { thClass, tdClass, iconButtonClass } from "../components/adminStyles";
import { PencilIcon, TrashIcon, SparklesIcon } from "../components/Icons";

export default function AdminBuildingsPage() {
  const { t } = useTranslation();
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState("");
  const { buildings, loading, error } = useAdminBuildings(reloadKey);

  async function handleDelete(building) {
    const ok = window.confirm(
      t("admin.buildings.confirmDelete", { name: building.name }),
    );
    if (!ok) {
      return;
    }

    setActionError("");
    try {
      await deleteBuilding(building._id);
      setReloadKey(reloadKey + 1);
    } catch (err) {
      setActionError(t("errors." + err.code));
    }
  }

  let content;
  if (loading) {
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
            const fullAddress =
              address.houseNumber + " " + address.street + ", " + address.ward;

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
              <tr key={building._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className={tdClass}>
                  <Link
                    to={"/buildings/" + building._id}
                    className="font-medium text-slate-800 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-400"
                  >
                    {building.name}
                  </Link>
                  {newBadge}
                </td>
                <td className={tdClass}>
                  <p className="text-slate-700 dark:text-slate-200">{fullAddress}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {address.area}
                  </p>
                </td>
                <td className={tdClass + " text-slate-600 dark:text-slate-300"}>
                  {t("road." + building.roadType)}
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
    );
  }

  return (
    <div>
      <PageHeader
        title={t("admin.nav.buildings")}
        addTo="/buildings/new"
        addLabel={t("admin.buildings.add")}
      />
      <div className="space-y-4">
        <ErrorMessage message={actionError} />
        {content}
      </div>
    </div>
  );
}
