// Địa chỉ web khách (trang profile nằm bên đó).
// Production đặt VITE_PUBLIC_SITE_URL trên Vercel, lúc dev mặc định là localhost:5173.
let publicSiteUrl = "http://localhost:5173";
if (import.meta.env.VITE_PUBLIC_SITE_URL) {
  publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL;
}

export const PUBLIC_SITE_URL = publicSiteUrl;
