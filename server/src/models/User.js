import mongoose from "mongoose";

// Chỉ đánh unique khi trường có giá trị (kiểu chuỗi).
// Cần vì tài khoản Zalo không có email, tài khoản thường không có googleId...
// nếu dùng unique bình thường thì 2 user cùng "không có" sẽ bị coi là trùng.
function uniqueWhenSet(field) {
  return {
    unique: true,
    partialFilterExpression: { [field]: { $type: "string" } },
  };
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Không bắt buộc: đăng nhập bằng Zalo thì không có email
    email: { type: String, trim: true, lowercase: true },
    // Chỉ lưu mật khẩu đã băm bằng bcrypt, và ẩn mặc định để không lỡ trả ra API.
    // Tài khoản tạo bằng Google/Zalo chưa có mật khẩu cho tới khi tự đặt.
    password: { type: String, select: false },
    phone: { type: String, trim: true, default: "" },
    avatar: { type: String, default: "" },

    // ID tài khoản bên Google / Zalo, dùng để nhận ra người dùng khi đăng nhập lại
    googleId: { type: String },
    zaloId: { type: String },

    // Mã nhân viên (vd "NV001"), chỉ sale / admin mới có.
    // Khách điền mã này ở form yêu cầu tư vấn để biết ai giới thiệu.
    staffCode: { type: String, trim: true, uppercase: true },

    role: {
      type: String,
      enum: ["guest", "sale", "admin"],
      default: "guest",
    },
    // Link đặt mật khẩu (mời nhân viên / quên mật khẩu). Chỉ lưu bản băm của token,
    // lộ database cũng không dựng lại được link. Ẩn mặc định như password.
    passwordTokenHash: { type: String, select: false },
    passwordTokenExpires: { type: Date, select: false },
    passwordTokenPurpose: { type: String, enum: ["invite", "reset"], select: false },
    passwordTokenSentAt: { type: Date, select: false },

    isActive: { type: Boolean, default: true },
    // Tăng số này lên là mọi token cũ của user hết hiệu lực (dùng khi đăng xuất)
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, uniqueWhenSet("email"));
userSchema.index({ googleId: 1 }, uniqueWhenSet("googleId"));
userSchema.index({ zaloId: 1 }, uniqueWhenSet("zaloId"));
userSchema.index({ staffCode: 1 }, uniqueWhenSet("staffCode"));
userSchema.index({ passwordTokenHash: 1 }, uniqueWhenSet("passwordTokenHash"));

export default mongoose.model("User", userSchema);
