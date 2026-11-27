import jwt from "jsonwebtoken";

const ACCESS_TOKEN_MINUTES = 15;
const REFRESH_TOKEN_DAYS = 7;

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

// Refresh token chỉ cần gửi tới /api/auth, không cần đi kèm mọi request
const REFRESH_COOKIE_PATH = "/api/auth";

export function getCookieOptions() {
  let secure = false;
  if (process.env.NODE_ENV === "production") {
    secure = true;
  }

  return {
    httpOnly: true, // JavaScript trên trình duyệt không đọc được → khó bị lấy cắp qua XSS
    secure: secure, // production chạy HTTPS thì chỉ gửi cookie qua HTTPS
    sameSite: "lax",
  };
}

export function createAccessToken(user) {
  const payload = {
    sub: String(user._id),
    role: user.role,
    version: user.tokenVersion,
  };
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_MINUTES * 60,
  });
}

export function createRefreshToken(user) {
  const payload = {
    sub: String(user._id),
    version: user.tokenVersion,
  };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_DAYS * 24 * 60 * 60,
  });
}

// Domain chung cho cookie đăng nhập, vd ".saigonstay.huyhoanggia.id.vn".
// Có giá trị này thì web khách (saigonstay.huyhoanggia.id.vn) và web admin (admin.saigonstay.huyhoanggia.id.vn)
// dùng chung 1 phiên: đăng nhập bên này, sang bên kia không phải đăng nhập lại.
// Để trống (lúc dev) thì cookie chỉ thuộc về host hiện tại, localhost khác cổng vẫn dùng chung.
function getAuthCookieOptions() {
  const options = getCookieOptions();
  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }
  return options;
}

// Xoá cookie cũ kiểu chỉ thuộc 1 host (đặt trước khi có COOKIE_DOMAIN),
// nếu không trình duyệt sẽ gửi kèm cả 2 bản và server có thể đọc nhầm bản cũ.
function clearHostOnlyCookies(res) {
  if (!process.env.COOKIE_DOMAIN) {
    return;
  }
  const options = getCookieOptions();
  res.clearCookie(ACCESS_COOKIE, { ...options, path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...options, path: REFRESH_COOKIE_PATH });
}

export function setAuthCookies(res, user) {
  clearHostOnlyCookies(res);
  const options = getAuthCookieOptions();

  res.cookie(ACCESS_COOKIE, createAccessToken(user), {
    ...options,
    path: "/",
    maxAge: ACCESS_TOKEN_MINUTES * 60 * 1000,
  });

  res.cookie(REFRESH_COOKIE, createRefreshToken(user), {
    ...options,
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res) {
  clearHostOnlyCookies(res);
  const options = getAuthCookieOptions();

  res.clearCookie(ACCESS_COOKIE, { ...options, path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...options, path: REFRESH_COOKIE_PATH });
}

// Trả về payload nếu token hợp lệ, trả về null nếu sai hoặc hết hạn
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}
