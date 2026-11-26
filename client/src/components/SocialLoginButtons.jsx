import { useTranslation } from "react-i18next";
import { getOAuthStartUrl } from "../api/client";
import { GoogleLogo, ZaloLogo } from "./BrandIcons";

// 2 nút "Tiếp tục với Google / Zalo".
// Dùng thẻ <a> (chuyển hẳn trang) vì phải sang trang đăng nhập của Google/Zalo rồi mới quay về.
// redirect: đường dẫn trong web để quay về sau khi đăng nhập xong.
export default function SocialLoginButtons({ redirect }) {
  const { t } = useTranslation();

  let target = "/";
  if (redirect) {
    target = redirect;
  }

  const buttonClass =
    "flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700";

  return (
    <div className="space-y-3">
      <a href={getOAuthStartUrl("google", "login", target)} className={buttonClass}>
        <GoogleLogo className="h-5 w-5" />
        {t("auth.continueWithGoogle")}
      </a>
      <a href={getOAuthStartUrl("zalo", "login", target)} className={buttonClass}>
        <ZaloLogo className="h-5 w-5" />
        {t("auth.continueWithZalo")}
      </a>

      <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        {t("auth.or")}
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
