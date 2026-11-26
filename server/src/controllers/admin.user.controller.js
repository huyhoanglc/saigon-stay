import mongoose from "mongoose";
import User from "../models/User.js";
import { readString, escapeRegex, readPaging } from "../utils/validate.js";

const ROLES = ["guest", "sale", "admin"];

// Chỉ trả về các trường an toàn (không có password, tokenVersion)
function toAdminUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email || "",
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

  // Tìm theo tên hoặc email, không phân biệt hoa thường
  const keyword = readString(query.q);
  if (keyword !== "") {
    const pattern = new RegExp(escapeRegex(keyword), "i");
    filter.$or = [{ name: pattern }, { email: pattern }];
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

// PATCH /api/admin/users/:id  body: { role?, isActive? }
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
    await user.save();
  }

  res.json({ user: toAdminUser(user) });
}
