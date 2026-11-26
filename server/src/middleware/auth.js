import User from "../models/User.js";
import { ACCESS_COOKIE, verifyAccessToken } from "../utils/tokens.js";

// Bắt buộc đăng nhập. Gắn user vào req.user để các hàm sau dùng.
export async function requireAuth(req, res, next) {
  let token = null;
  if (req.cookies) {
    token = req.cookies[ACCESS_COOKIE];
  }

  if (!token) {
    return res
      .status(401)
      .json({ code: "UNAUTHORIZED", message: "Bạn chưa đăng nhập" });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    // Client nhận mã này sẽ tự gọi /api/auth/refresh rồi thử lại
    return res
      .status(401)
      .json({ code: "TOKEN_EXPIRED", message: "Phiên đăng nhập đã hết hạn" });
  }

  // Lấy lại user từ DB để biết tài khoản còn hoạt động và quyền mới nhất
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.version) {
    return res
      .status(401)
      .json({ code: "UNAUTHORIZED", message: "Bạn chưa đăng nhập" });
  }

  req.user = user;
  next();
}

// Dùng sau requireAuth. Ví dụ: requireRole("admin") hoặc requireRole("sale", "admin")
export function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ code: "FORBIDDEN", message: "Bạn không có quyền truy cập" });
    }
    next();
  };
}
