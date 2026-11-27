import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import LoginAttempt from "../models/LoginAttempt.js";
import { readString, escapeRegex, readPaging } from "../utils/validate.js";
import {
  generatePassword,
  normalizeStaffCode,
  saveWithNewStaffCode,
} from "../utils/staff.js";

const ROLES = ["guest", "sale", "admin"];
// Vai trò của nhân viên (được cấp mã nhân viên)
const STAFF_ROLES = ["sale", "admin"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Số di động Việt Nam: 0 hoặc +84, sau đó là đầu 3/5/7/8/9 và 8 số
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const SALT_ROUNDS = 10;

function sendError(res, status, code, message) {
  return res.status(status).json({ code: code, message: message });
}

// Mã nhân viên đã có người khác dùng chưa (excludeId: bỏ qua chính người đang sửa)
async function isStaffCodeTaken(code, excludeId) {
  const filter = { staffCode: code };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const existing = await User.exists(filter);
  return Boolean(existing);
}

// Chỉ trả về các trường an toàn (không có password, tokenVersion)
function toAdminUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email || "",
    phone: user.phone || "",
    staffCode: user.staffCode || "",
    avatar: user.avatar || "",
    google: Boolean(user.googleId),
    zalo: Boolean(user.zaloId),
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// GET /api/admin/users?q=&role=&page=&limit=
export async function listUsers(req, res) {
  const query = req.query;
  const paging = readPaging(query, 20, 100);
  const filter = {};

  if (query.role) {
    if (!ROLES.includes(query.role)) {
      return res
        .status(400)
        .json({ code: "ROLE_INVALID", message: "Vai trò không hợp lệ" });
    }
    filter.role = query.role;
  }

  // Tìm theo tên, email hoặc mã nhân viên, không phân biệt hoa thường
  const keyword = readString(query.q);
  if (keyword !== "") {
    const pattern = new RegExp(escapeRegex(keyword), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { staffCode: pattern }];
  }

  const skip = (paging.page - 1) * paging.limit;
  const users = await User.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(paging.limit);
  const total = await User.countDocuments(filter);

  const items = [];
  for (const user of users) {
    items.push(toAdminUser(user));
  }

  res.json({
    items: items,
    total: total,
    page: paging.page,
    totalPages: Math.ceil(total / paging.limit),
  });
}

// PATCH /api/admin/users/:id  body: { role?, isActive?, staffCode? }
// staffCode: "" để tự cấp mã mới theo thứ tự, hoặc mã admin tự đặt (vd "NV012")
export async function updateUser(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json({ code: "INVALID_ID", message: "ID không hợp lệ" });
  }

  let body = req.body;
  if (!body) {
    body = {};
  }

  const changes = {};

  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) {
      return res
        .status(400)
        .json({ code: "ROLE_INVALID", message: "Vai trò không hợp lệ" });
    }
    changes.role = body.role;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "isActive phải là true/false",
      });
    }
    changes.isActive = body.isActive;
  }

  let newStaffCode = undefined;
  if (body.staffCode !== undefined) {
    if (body.staffCode !== "") {
      newStaffCode = normalizeStaffCode(body.staffCode);
      if (!newStaffCode) {
        return sendError(res, 400, "STAFF_CODE_INVALID", "Mã nhân viên không hợp lệ");
      }
      if (await isStaffCodeTaken(newStaffCode, id)) {
        return sendError(res, 409, "STAFF_CODE_EXISTS", "Mã nhân viên đã có người dùng");
      }
    }
    changes.staffCode = newStaffCode;
  }

  if (Object.keys(changes).length === 0) {
    return res
      .status(400)
      .json({ code: "NOTHING_TO_UPDATE", message: "Không có gì để cập nhật" });
  }

  // Admin không được tự hạ quyền hoặc tự khoá mình, tránh hệ thống không còn ai quản trị
  const isSelf = String(req.user._id) === id;
  if (isSelf) {
    let changesSelf = false;
    if (changes.role !== undefined && changes.role !== "admin") {
      changesSelf = true;
    }
    if (changes.isActive === false) {
      changesSelf = true;
    }
    if (changesSelf) {
      return res.status(400).json({
        code: "CANNOT_CHANGE_SELF",
        message: "Không thể tự hạ quyền hoặc tự khoá tài khoản của mình",
      });
    }
  }

  const user = await User.findById(id);
  if (!user) {
    return res
      .status(404)
      .json({ code: "USER_NOT_FOUND", message: "Không tìm thấy người dùng" });
  }

  // Chỉ tính là thay đổi khi giá trị mới khác giá trị cũ
  let hasChanged = false;
  if (changes.role !== undefined && changes.role !== user.role) {
    user.role = changes.role;
    hasChanged = true;
  }
  if (changes.isActive !== undefined && changes.isActive !== user.isActive) {
    user.isActive = changes.isActive;
    hasChanged = true;
  }

  if (hasChanged) {
    // Tăng tokenVersion để user đó bị đăng xuất, đăng nhập lại sẽ nhận quyền mới
    user.tokenVersion = user.tokenVersion + 1;
  }

  // Đổi mã nhân viên không cần đăng xuất người đó
  if ("staffCode" in changes && changes.staffCode !== undefined) {
    user.staffCode = changes.staffCode;
  }

  // Thành nhân viên (sale / admin) mà chưa có mã, hoặc admin bấm "cấp mã tự động" → tự cấp mã
  const askedAutoCode = "staffCode" in changes && changes.staffCode === undefined;
  const isStaffWithoutCode = STAFF_ROLES.includes(user.role) && !user.staffCode;
  if (askedAutoCode || isStaffWithoutCode) {
    await saveWithNewStaffCode(user);
  } else {
    await user.save();
  }

  res.json({ user: toAdminUser(user) });
}

// POST /api/admin/users  body: { name, email, phone?, role, staffCode? }
// Admin tạo tài khoản nhân viên. Mật khẩu tự tạo ngẫu nhiên, chỉ trả về đúng 1 lần trong response này.
export async function createStaff(req, res) {
  let body = req.body;
  if (!body) {
    body = {};
  }

  const name = readString(body.name);
  if (name === "") {
    return sendError(res, 400, "NAME_REQUIRED", "Thiếu họ tên");
  }
  if (name.length > 100) {
    return sendError(res, 400, "NAME_TOO_LONG", "Họ tên quá dài");
  }

  const email = readString(body.email).toLowerCase();
  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return sendError(res, 400, "EMAIL_INVALID", "Email không hợp lệ");
  }

  // Bỏ dấu cách, dấu chấm, gạch ngang. Để trống cũng được.
  const phone = readString(body.phone).replace(/[\s.-]/g, "");
  if (phone !== "" && !PHONE_REGEX.test(phone)) {
    return sendError(res, 400, "PHONE_INVALID", "Số điện thoại không hợp lệ");
  }

  if (!STAFF_ROLES.includes(body.role)) {
    return sendError(res, 400, "ROLE_INVALID", "Vai trò không hợp lệ");
  }

  // Mã nhân viên: để trống thì tự cấp, có nhập thì kiểm tra định dạng và trùng
  let staffCode = undefined;
  const staffCodeInput = readString(body.staffCode);
  if (staffCodeInput !== "") {
    staffCode = normalizeStaffCode(staffCodeInput);
    if (!staffCode) {
      return sendError(res, 400, "STAFF_CODE_INVALID", "Mã nhân viên không hợp lệ");
    }
    if (await isStaffCodeTaken(staffCode, null)) {
      return sendError(res, 409, "STAFF_CODE_EXISTS", "Mã nhân viên đã có người dùng");
    }
  }

  // Email đã có tài khoản (vd nhân viên tự đăng ký trước) → nâng quyền ở danh sách, không tạo trùng
  const existing = await User.exists({ email: email });
  if (existing) {
    return sendError(res, 409, "EMAIL_EXISTS", "Email đã được sử dụng");
  }

  const password = generatePassword();
  const user = new User({
    name: name,
    email: email,
    phone: phone,
    role: body.role,
    password: await bcrypt.hash(password, SALT_ROUNDS),
  });

  if (staffCode) {
    user.staffCode = staffCode;
    await user.save();
  } else {
    await saveWithNewStaffCode(user);
  }

  res.status(201).json({ user: toAdminUser(user), password: password });
}

// POST /api/admin/users/:id/reset-password
// Tạo mật khẩu mới cho nhân viên quên mật khẩu. Người đó bị đăng xuất khỏi mọi thiết bị.
export async function resetUserPassword(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, "INVALID_ID", "ID không hợp lệ");
  }

  // Mật khẩu của chính mình thì đổi ở trang cá nhân (phải nhập mật khẩu cũ)
  if (String(req.user._id) === id) {
    return sendError(res, 400, "CANNOT_CHANGE_SELF", "Đổi mật khẩu của mình ở trang cá nhân");
  }

  const user = await User.findById(id);
  if (!user) {
    return sendError(res, 404, "USER_NOT_FOUND", "Không tìm thấy người dùng");
  }

  // Đăng nhập bằng mật khẩu cần email (tài khoản Zalo không có email)
  if (!user.email) {
    return sendError(
      res,
      400,
      "EMAIL_REQUIRED_FOR_PASSWORD",
      "Tài khoản chưa có email nên chưa đặt được mật khẩu",
    );
  }

  const password = generatePassword();
  user.password = await bcrypt.hash(password, SALT_ROUNDS);
  user.tokenVersion = user.tokenVersion + 1;
  await user.save();

  // Xoá khoá tạm do nhập sai nhiều lần, để nhân viên đăng nhập được ngay
  await LoginAttempt.deleteOne({ email: user.email });

  res.json({ user: toAdminUser(user), password: password });
}
