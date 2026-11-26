import bcrypt from "bcryptjs";
import User from "../models/User.js";
import LoginAttempt from "../models/LoginAttempt.js";
import {
  REFRESH_COOKIE,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { toPublicUser, getPublicUser } from "../utils/publicUser.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
// bcrypt chỉ dùng 72 byte đầu của mật khẩu, dài hơn cũng vô ích
const PASSWORD_MAX = 72;
const SALT_ROUNDS = 10;

// Chặn đoán mật khẩu: sai 5 lần trong 15 phút thì khoá tạm email đó.
// Lưu trong collection LoginAttempt nên server khởi động lại vẫn còn.
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

// Hash giả để so sánh khi email không tồn tại.
// Nhờ vậy thời gian trả lời giống nhau, kẻ xấu không đoán được email nào có thật.
const DUMMY_HASH = bcrypt.hashSync("dummy-password", SALT_ROUNDS);

function readString(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

async function isLocked(email) {
  const record = await LoginAttempt.findOne({ email: email });
  if (!record) {
    return false;
  }

  // MongoDB chỉ dọn bản ghi hết hạn khoảng 1 phút/lần, nên tự kiểm tra thời gian cho chính xác
  if (record.expireAt.getTime() <= Date.now()) {
    await LoginAttempt.deleteOne({ _id: record._id });
    return false;
  }

  if (record.count >= MAX_FAILED_LOGINS) {
    return true;
  }
  return false;
}

async function recordFailedLogin(email) {
  const now = new Date();
  const expireAt = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);

  // upsert: chưa có thì tạo mới (count = 1), có rồi thì cộng thêm 1.
  // Làm trong 1 lệnh để 2 request cùng lúc không ghi đè số đếm của nhau.
  await LoginAttempt.updateOne(
    { email: email },
    {
      $inc: { count: 1 },
      $setOnInsert: { firstFailAt: now, expireAt: expireAt },
    },
    { upsert: true },
  );
}

// POST /api/auth/register  (tài khoản mới luôn là guest)
export async function register(req, res) {
  let body = req.body;
  if (!body) {
    body = {};
  }

  const name = readString(body.name);
  const email = readString(body.email).toLowerCase();
  let password = "";
  if (typeof body.password === "string") {
    password = body.password;
  }

  if (name === "") {
    return res
      .status(400)
      .json({ code: "NAME_REQUIRED", message: "Thiếu họ tên" });
  }
  if (name.length > 100) {
    return res
      .status(400)
      .json({ code: "NAME_TOO_LONG", message: "Họ tên quá dài" });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res
      .status(400)
      .json({ code: "EMAIL_INVALID", message: "Email không hợp lệ" });
  }
  if (password.length < PASSWORD_MIN) {
    return res
      .status(400)
      .json({ code: "PASSWORD_TOO_SHORT", message: "Mật khẩu quá ngắn" });
  }
  if (password.length > PASSWORD_MAX) {
    return res
      .status(400)
      .json({ code: "PASSWORD_TOO_LONG", message: "Mật khẩu quá dài" });
  }

  const existing = await User.findOne({ email: email });
  if (existing) {
    return res
      .status(409)
      .json({ code: "EMAIL_EXISTS", message: "Email đã được sử dụng" });
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: name,
    email: email,
    password: hashed,
    role: "guest",
  });

  setAuthCookies(res, user);
  res.status(201).json({ user: toPublicUser(user) });
}

// POST /api/auth/login
export async function login(req, res) {
  let body = req.body;
  if (!body) {
    body = {};
  }

  const email = readString(body.email).toLowerCase();
  let password = "";
  if (typeof body.password === "string") {
    password = body.password;
  }

  if (email === "" || password === "") {
    return res.status(400).json({
      code: "CREDENTIALS_REQUIRED",
      message: "Vui lòng nhập email và mật khẩu",
    });
  }

  // Email dài bất thường thì từ chối luôn, không ghi vào DB
  if (email.length > 254) {
    return res.status(401).json({
      code: "INVALID_CREDENTIALS",
      message: "Email hoặc mật khẩu không đúng",
    });
  }

  const locked = await isLocked(email);
  if (locked) {
    return res.status(429).json({
      code: "TOO_MANY_ATTEMPTS",
      message: "Sai quá nhiều lần, vui lòng thử lại sau",
    });
  }

  const user = await User.findOne({ email: email }).select("+password");

  // Tài khoản tạo bằng Google/Zalo có thể chưa có mật khẩu
  let hasPassword = false;
  if (user && user.password) {
    hasPassword = true;
  }

  let hashToCompare = DUMMY_HASH;
  if (hasPassword) {
    hashToCompare = user.password;
  }
  let isMatch = await bcrypt.compare(password, hashToCompare);
  // So với hash giả thì luôn tính là sai, kể cả khi ai đó đoán trúng chuỗi giả
  if (!hasPassword) {
    isMatch = false;
  }

  if (!user || !isMatch) {
    await recordFailedLogin(email);
    return res.status(401).json({
      code: "INVALID_CREDENTIALS",
      message: "Email hoặc mật khẩu không đúng",
    });
  }

  if (!user.isActive) {
    return res
      .status(403)
      .json({ code: "ACCOUNT_DISABLED", message: "Tài khoản đã bị khoá" });
  }

  // Đăng nhập đúng thì xoá số lần sai trước đó
  await LoginAttempt.deleteOne({ email: email });
  setAuthCookies(res, user);
  res.json({ user: toPublicUser(user) });
}

// POST /api/auth/refresh  → cấp lại cả access token và refresh token mới
export async function refresh(req, res) {
  let token = null;
  if (req.cookies) {
    token = req.cookies[REFRESH_COOKIE];
  }

  let payload = null;
  if (token) {
    payload = verifyRefreshToken(token);
  }

  if (!payload) {
    clearAuthCookies(res);
    return res
      .status(401)
      .json({ code: "UNAUTHORIZED", message: "Bạn chưa đăng nhập" });
  }

  const user = await User.findById(payload.sub).select("+password");
  if (!user || !user.isActive || user.tokenVersion !== payload.version) {
    clearAuthCookies(res);
    return res
      .status(401)
      .json({ code: "UNAUTHORIZED", message: "Bạn chưa đăng nhập" });
  }

  setAuthCookies(res, user);
  res.json({ user: toPublicUser(user) });
}

// POST /api/auth/logout
export async function logout(req, res) {
  let token = null;
  if (req.cookies) {
    token = req.cookies[REFRESH_COOKIE];
  }

  // Tăng tokenVersion để token cũ (kể cả bị lộ) không dùng được nữa
  if (token) {
    const payload = verifyRefreshToken(token);
    if (payload) {
      await User.updateOne({ _id: payload.sub }, { $inc: { tokenVersion: 1 } });
    }
  }

  clearAuthCookies(res);
  res.json({ code: "LOGGED_OUT" });
}

// GET /api/auth/me  (cần requireAuth chạy trước)
export async function getMe(req, res) {
  const user = await getPublicUser(req.user._id);
  res.json({ user: user });
}
