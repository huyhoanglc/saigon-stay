// Bật / tắt tính năng mà không cần sửa code.
//
// Đăng nhập Zalo đang tạm tắt: Zalo chặn lấy tên, ảnh khi server ở ngoài Việt Nam (Render ở Singapore).
// Khi có hosting ở Việt Nam, đặt VITE_ZALO_LOGIN=true trên Vercel rồi deploy lại là bật.
let zaloLoginEnabled = false;
if (import.meta.env.VITE_ZALO_LOGIN === "true") {
  zaloLoginEnabled = true;
}

export const ZALO_LOGIN_ENABLED = zaloLoginEnabled;
