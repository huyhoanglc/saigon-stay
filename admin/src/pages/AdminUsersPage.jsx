import { useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAdminUsers } from "../hooks/useAdminUsers";
import { useAuth } from "../hooks/useAuth";
import { updateUser, resetUserPassword } from "../api/client";
import {
  PageHeader,
  StateMessage,
  TableWrapper,
  StatusBadge,
} from "../components/AdminUI";
import { ErrorMessage } from "../components/FormFields";
import {
  thClass,
  tdClass,
  smallSelectClass,
  iconButtonClass,
  rowClass,
} from "../components/adminStyles";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { useConfirm } from "../hooks/useConfirm";
import { SearchIcon, PencilIcon, KeyIcon } from "../components/Icons";
import StaffFormDialog from "../components/StaffFormDialog";
import StaffCodeDialog from "../components/StaffCodeDialog";
import PasswordResultDialog from "../components/PasswordResultDialog";
import { USER_ROLES } from "../utils/constants";
import { formatDate } from "../utils/format";

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadKey, setReloadKey] = useState(0);
  const { askConfirm, dialogProps } = useConfirm();
  const [actionError, setActionError] = useState("");
  // Popup: thêm nhân viên, sửa mã nhân viên, hiện mật khẩu vừa tạo
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingCodeUser, setEditingCodeUser] = useState(null);
  const [passwordResult, setPasswordResult] = useState(null);
  const [passwordTitle, setPasswordTitle] = useState("");

  const role = searchParams.get("role") || "";
  const q = searchParams.get("q") || "";
  let page = Number(searchParams.get("page"));
  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  const [keyword, setKeyword] = useState(q);

  const { users, total, totalPages, loading, error } = useAdminUsers({
    role: role,
    q: q,
    page: page,
    reloadKey: reloadKey,
  });

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

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateParam("q", keyword.trim());
  }

  function handlePageChange(newPage) {
    updateParam("page", String(newPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveChanges(user, changes) {
    setActionError("");
    try {
      await updateUser(user.id, changes);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setActionError(t("errors." + err.code));
    }
  }

  // Đổi vai trò nào cũng hỏi lại, vì người đó sẽ bị đăng xuất.
  // Ô chọn vẫn giữ vai trò cũ cho tới khi bấm xác nhận (giá trị lấy từ dữ liệu server).
  function handleRoleChange(user, newRole) {
    let message = t("admin.users.confirmRole", {
      name: user.name,
      role: t("userRole." + newRole),
    });
    // Cấp quyền admin là việc lớn nên nói rõ hơn
    if (newRole === "admin") {
      message = t("admin.users.confirmMakeAdmin", { name: user.name });
    }

    askConfirm({
      title: t("admin.users.roleTitle"),
      message: message,
      confirmLabel: t("admin.users.changeRole"),
      action: () => saveChanges(user, { role: newRole }),
    });
  }

  function handleToggleActive(user) {
    // Mở khoá thì làm luôn, không cần hỏi
    if (!user.isActive) {
      saveChanges(user, { isActive: true });
      return;
    }

    askConfirm({
      title: t("admin.users.lockTitle"),
      message: t("admin.users.confirmLock", { name: user.name }),
      confirmLabel: t("admin.users.lock"),
      action: () => saveChanges(user, { isActive: false }),
    });
  }

  function handleOpenStaffForm() {
    setShowStaffForm(true);
  }

  function handleCloseStaffForm() {
    setShowStaffForm(false);
  }

  // Tạo xong: đóng form, hiện mật khẩu để admin gửi cho nhân viên, tải lại danh sách
  function handleStaffCreated(result) {
    setShowStaffForm(false);
    setPasswordTitle(t("admin.users.staffCreatedTitle"));
    setPasswordResult({
      name: result.user.name,
      email: result.user.email,
      password: result.password,
      staffCode: result.user.staffCode,
    });
    setReloadKey((key) => key + 1);
  }

  function handleClosePassword() {
    setPasswordResult(null);
  }

  function handleEditCode(user) {
    setEditingCodeUser(user);
  }

  function handleCloseEditCode() {
    setEditingCodeUser(null);
  }

  function handleCodeSaved() {
    setEditingCodeUser(null);
    setReloadKey((key) => key + 1);
  }

  function handleResetPassword(user) {
    askConfirm({
      title: t("admin.users.resetTitle"),
      message: t("admin.users.confirmReset", { name: user.name }),
      confirmLabel: t("admin.users.resetPassword"),
      action: async () => {
        setActionError("");
        try {
          const result = await resetUserPassword(user.id);
          setPasswordTitle(t("admin.users.resetDoneTitle"));
          setPasswordResult({
            name: result.user.name,
            email: result.user.email,
            password: result.password,
            staffCode: result.user.staffCode,
          });
        } catch (err) {
          setActionError(t("errors." + err.code));
        }
      },
    });
  }

  const roleOptions = [];
  for (const item of USER_ROLES) {
    roleOptions.push({ value: item, label: t("userRole." + item) });
  }

  let content;
  if (loading) {
    content = <StateMessage>{t("common.loading")}</StateMessage>;
  } else if (error) {
    content = <StateMessage isError>{t("errors." + error.code)}</StateMessage>;
  } else if (users.length === 0) {
    content = <StateMessage>{t("admin.users.empty")}</StateMessage>;
  } else {
    content = (
      <>
        <TableWrapper>
          <thead>
            <tr>
              <th className={thClass}>{t("admin.users.user")}</th>
              <th className={thClass}>{t("admin.users.staffCode")}</th>
              <th className={thClass}>{t("admin.users.role")}</th>
              <th className={thClass}>{t("admin.users.createdAt")}</th>
              <th className={thClass}>{t("admin.users.status")}</th>
              <th className={thClass + " text-right"}>{t("admin.common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              // Không cho tự đổi quyền / tự khoá mình (server cũng chặn)
              let isSelf = false;
              if (currentUser && currentUser.id === user.id) {
                isSelf = true;
              }

              let selfTag = null;
              if (isSelf) {
                selfTag = (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {t("admin.users.you")}
                  </span>
                );
              }

              let statusBadge;
              let toggleLabel;
              let toggleClass =
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";
              if (user.isActive) {
                statusBadge = (
                  <StatusBadge status="available" label={t("admin.users.active")} />
                );
                toggleLabel = t("admin.users.lock");
                toggleClass =
                  toggleClass +
                  " border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40";
              } else {
                statusBadge = (
                  <StatusBadge status="closed" label={t("admin.users.locked")} />
                );
                toggleLabel = t("admin.users.unlock");
                toggleClass =
                  toggleClass +
                  " border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40";
              }

              // Mã nhân viên: chỉ sale / admin mới có. Bấm bút chì để sửa.
              let staffCodeCell = (
                <span className="text-slate-400 dark:text-slate-500">—</span>
              );
              if (user.role === "sale" || user.role === "admin") {
                let codeText = (
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    {t("admin.users.noStaffCode")}
                  </span>
                );
                if (user.staffCode) {
                  codeText = (
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {user.staffCode}
                    </span>
                  );
                }
                staffCodeCell = (
                  <div className="flex items-center gap-1">
                    {codeText}
                    <button
                      type="button"
                      onClick={() => handleEditCode(user)}
                      className={iconButtonClass}
                      aria-label={t("admin.users.editStaffCode", { name: user.name })}
                      title={t("admin.users.editStaffCode", { name: user.name })}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              }

              // Đặt lại mật khẩu: không áp dụng cho chính mình, hay tài khoản không có email (Zalo)
              let resetButton = null;
              if (!isSelf && user.email) {
                resetButton = (
                  <button
                    type="button"
                    onClick={() => handleResetPassword(user)}
                    className={iconButtonClass}
                    aria-label={t("admin.users.resetPassword") + " " + user.name}
                    title={t("admin.users.resetPassword")}
                  >
                    <KeyIcon className="h-4 w-4" />
                  </button>
                );
              }

              return (
                <tr key={user.id} className={rowClass}>
                  <td className={tdClass}>
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {user.name}
                      {selfTag}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </td>
                  <td className={tdClass}>{staffCodeCell}</td>
                  <td className={tdClass}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      disabled={isSelf}
                      aria-label={t("admin.users.role") + " " + user.name}
                      className={smallSelectClass + " disabled:opacity-60"}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={tdClass + " whitespace-nowrap text-slate-600 dark:text-slate-300"}>
                    {formatDate(user.createdAt, i18n.language)}
                  </td>
                  <td className={tdClass}>{statusBadge}</td>
                  <td className={tdClass + " text-right"}>
                    <div className="inline-flex items-center gap-1">
                      {resetButton}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user)}
                        disabled={isSelf}
                        className={toggleClass}
                      >
                        {toggleLabel}
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

  return (
    <div>
      <PageHeader
        title={t("admin.nav.users")}
        subtitle={t("admin.users.count", { count: total })}
        onAdd={handleOpenStaffForm}
        addLabel={t("admin.users.addStaff")}
      />

      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {t("admin.users.note")}
      </p>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="flex min-w-0 flex-1 gap-2 sm:max-w-xs">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t("admin.users.searchPlaceholder")}
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
          value={role}
          onChange={(e) => updateParam("role", e.target.value)}
          aria-label={t("admin.users.role")}
          className={smallSelectClass + " py-2"}
        >
          <option value="">{t("admin.users.allRoles")}</option>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <ErrorMessage message={actionError} />
        {content}
      </div>
      <ConfirmDialog {...dialogProps} />
      <StaffFormDialog
        open={showStaffForm}
        onClose={handleCloseStaffForm}
        onCreated={handleStaffCreated}
      />
      {/* key: mở cho người khác thì tạo lại popup để ô nhập lấy đúng mã của người đó */}
      <StaffCodeDialog
        key={editingCodeUser ? editingCodeUser.id : "closed"}
        user={editingCodeUser}
        onClose={handleCloseEditCode}
        onSaved={handleCodeSaved}
      />
      <PasswordResultDialog
        result={passwordResult}
        title={passwordTitle}
        onClose={handleClosePassword}
      />
    </div>
  );
}
