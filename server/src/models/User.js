import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Chỉ lưu mật khẩu đã băm bằng bcrypt, và ẩn mặc định để không lỡ trả ra API
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["guest", "sale", "admin"],
      default: "guest",
    },
    isActive: { type: Boolean, default: true },
    // Tăng số này lên là mọi token cũ của user hết hiệu lực (dùng khi đăng xuất)
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
