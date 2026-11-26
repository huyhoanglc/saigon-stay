import { Navigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import Container from "../Container";

// Bọc các trang admin. Đây chỉ là chặn ở giao diện cho tiện,
// bảo vệ thật sự là middleware requireRole("admin") ở server.
export default function RequireAdmin({ children }) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container className="py-16 text-center text-slate-500 dark:text-slate-400">
        {t("admin.checking")}
      </Container>
    );
  }

  if (!user) {
    // Đăng nhập xong sẽ quay lại đúng trang đang muốn vào
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={"/login?redirect=" + redirect} replace />;
  }

  if (user.role !== "admin") {
    return (
      <Container className="py-16 text-center">
        <p className="text-5xl font-bold text-slate-300 dark:text-slate-700">
          403
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {t("admin.forbidden")}
        </p>
      </Container>
    );
  }

  return children;
}
