// Địa chỉ web quản trị (domain riêng).
// Production đặt VITE_ADMIN_SITE_URL trên Vercel, lúc dev mặc định là localhost:5174.
let adminSiteUrl = "http://localhost:5174";
if (import.meta.env.VITE_ADMIN_SITE_URL) {
  adminSiteUrl = import.meta.env.VITE_ADMIN_SITE_URL;
}

export const ADMIN_SITE_URL = adminSiteUrl;
