import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { toPublicUser } from "../utils/publicUser.js";
import { setAuthCookies } from "../utils/tokens.js";
import { readString } from "../utils/validate.js";
import {
  UPLOAD_FOLDER,
  getCloudinaryConfig,
  getPublicIdFromUrl,
  signParams,
  deleteUnusedImages,
} from "../utils/cloudinary.js";

// Số di động Việt Nam: 0 hoặc +84, sau đó là đầu 3/5/7/8/9 và 8 số
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
const SALT_ROUNDS = 10;
const AVATAR_FOLDER = UPLOAD_FOLDER + "/avatars";
const PROVIDER_FIELDS = { google: "googleId", zalo: "zaloId" };

// Ảnh đại diện tự upload phải nằm trong thư mục avatars trên Cloudinary của mình
function isOwnAvatarUrl(url) {
  const config = getCloudinaryConfig();
  if (!config) {
    return false;
  }
  const publicId = getPublicIdFromUrl(url, config.cloudName);
  if (!publicId) {
    return false;
  }
  return publicId.startsWith(AVATAR_FOLDER + "/");
}

// Lấy user đang đăng nhập kèm password (để biết đã có mật khẩu chưa)
async function loadCurrentUser(req) {
  return User.findById(req.user._id).select("+password");
}

// PATCH /api/profile  body: { name?, phone?, avatar? }
export async function updateProfile(req, res) {
  let body = req.body;
  if (!body) {
    body = {};
  }

  const user = await loadCurrentUser(req);
  let oldAvatar = "";

  if (body.name !== undefined) {
    const name = readString(body.name);
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
    user.name = name;
  }

  if (body.phone !== undefined) {
    // Bỏ dấu cách, dấu chấm, gạch ngang. Để trống là xoá số điện thoại.
    const phone = readString(body.phone).replace(/[\s.-]/g, "");
    if (phone !== "" && !PHONE_REGEX.test(phone)) {
      return res
        .status(400)
        .json({ code: "PHONE_INVALID", message: "Số điện thoại không hợp lệ" });
    }
    user.phone = phone;
  }

  if (body.avatar !== undefined) {
    const avatar = readString(body.avatar);
    // Chỉ nhận "" (xoá ảnh) hoặc ảnh vừa upload lên thư mục avatars của mình
    if (avatar !== "" && !isOwnAvatarUrl(avatar)) {
      return res
        .status(400)
        .json({ code: "AVATAR_INVALID", message: "Ảnh đại diện không hợp lệ" });
    }
    if (avatar !== user.avatar) {
      oldAvatar = user.avatar;
      user.avatar = avatar;
    }
  }

  await user.save();

  // Ảnh cũ tự upload thì xoá khỏi Cloudinary (ảnh từ Google/Zalo thì hàm này tự bỏ qua)
  if (oldAvatar) {
    await deleteUnusedImages([oldAvatar]);
  }

  res.json({ user: toPublicUser(user) });
}

// POST /api/profile/password  body: { currentPassword?, newPassword }
// Đã có mật khẩu → phải nhập đúng mật khẩu cũ. Tài khoản Google/Zalo chưa có → đặt mới.
export async function changePassword(req, res) {
  let body = req.body;
  if (!body) {
    body = {};
  }

  let newPassword = "";
  if (typeof body.newPassword === "string") {
    newPassword = body.newPassword;
  }
  let currentPassword = "";
  if (typeof body.currentPassword === "string") {
    currentPassword = body.currentPassword;
  }

  if (newPassword.length < PASSWORD_MIN) {
    return res
      .status(400)
      .json({ code: "PASSWORD_TOO_SHORT", message: "Mật khẩu quá ngắn" });
  }
  if (newPassword.length > PASSWORD_MAX) {
    return res
      .status(400)
      .json({ code: "PASSWORD_TOO_LONG", message: "Mật khẩu quá dài" });
  }

  const user = await loadCurrentUser(req);

  if (user.password) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        code: "CURRENT_PASSWORD_WRONG",
        message: "Mật khẩu hiện tại không đúng",
      });
    }
  }

  // Đặt mật khẩu cần có email để sau này đăng nhập bằng email + mật khẩu
  if (!user.email) {
    return res.status(400).json({
      code: "EMAIL_REQUIRED_FOR_PASSWORD",
      message: "Tài khoản chưa có email nên chưa đặt được mật khẩu",
    });
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  // Đăng xuất mọi thiết bị khác, thiết bị đang dùng thì cấp cookie mới để không bị văng ra
  user.tokenVersion = user.tokenVersion + 1;
  await user.save();
  setAuthCookies(res, user);

  res.json({ user: toPublicUser(user) });
}

// DELETE /api/profile/providers/:provider  → gỡ liên kết Google hoặc Zalo
export async function unlinkProvider(req, res) {
  const field = PROVIDER_FIELDS[req.params.provider];
  if (!field) {
    return res
      .status(404)
      .json({ code: "NOT_FOUND", message: "Không hỗ trợ cách đăng nhập này" });
  }

  const user = await loadCurrentUser(req);
  if (!user[field]) {
    return res
      .status(400)
      .json({ code: "PROVIDER_NOT_LINKED", message: "Chưa liên kết" });
  }

  // Đếm số cách đăng nhập còn lại, không cho gỡ cách cuối cùng (sẽ không vào được tài khoản nữa)
  let methodCount = 0;
  if (user.password) {
    methodCount = methodCount + 1;
  }
  if (user.googleId) {
    methodCount = methodCount + 1;
  }
  if (user.zaloId) {
    methodCount = methodCount + 1;
  }
  if (methodCount <= 1) {
    return res.status(400).json({
      code: "LAST_LOGIN_METHOD",
      message: "Không thể gỡ cách đăng nhập duy nhất",
    });
  }

  user[field] = undefined;
  await user.save();

  res.json({ user: toPublicUser(user) });
}

// POST /api/profile/avatar-signature  → chữ ký để tự upload ảnh đại diện lên Cloudinary
export async function createAvatarSignature(req, res) {
  const config = getCloudinaryConfig();
  if (!config) {
    return res.status(503).json({
      code: "UPLOAD_NOT_CONFIGURED",
      message: "Chưa cấu hình Cloudinary",
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams(
    { folder: AVATAR_FOLDER, timestamp: timestamp },
    config.apiSecret,
  );

  res.json({
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder: AVATAR_FOLDER,
    timestamp: timestamp,
    signature: signature,
  });
}
