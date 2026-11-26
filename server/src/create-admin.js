// Tạo (hoặc nâng quyền) tài khoản admin.
// Cách dùng: npm run create-admin -- email@example.com "MatKhau123" "Tên hiển thị"
// Đăng ký trên web luôn là guest, nên admin đầu tiên phải tạo bằng lệnh này.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import LoginAttempt from "./models/LoginAttempt.js";

const email = process.argv[2];
const password = process.argv[3];
let name = process.argv[4];
if (!name) {
  name = "Admin";
}

if (!email || !password) {
  console.log(
    'Cách dùng: npm run create-admin -- email@example.com "MatKhau123" "Tên"',
  );
  process.exit(1);
}

if (password.length < 8) {
  console.log("❌ Mật khẩu phải có ít nhất 8 ký tự");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const normalizedEmail = email.trim().toLowerCase();
const hashed = await bcrypt.hash(password, 10);
const existing = await User.findOne({ email: normalizedEmail });

if (existing) {
  // Đã có tài khoản: nâng lên admin, đặt mật khẩu mới và đăng xuất mọi phiên cũ
  existing.role = "admin";
  existing.password = hashed;
  existing.isActive = true;
  existing.tokenVersion = existing.tokenVersion + 1;
  await existing.save();
  console.log("✅ Đã nâng quyền admin cho " + normalizedEmail);
} else {
  await User.create({
    name: name,
    email: normalizedEmail,
    password: hashed,
    role: "admin",
  });
  console.log("✅ Đã tạo admin " + normalizedEmail);
}

// Xoá khoá tạm do nhập sai mật khẩu (nếu có), để đăng nhập được ngay
await LoginAttempt.deleteOne({ email: normalizedEmail });

await mongoose.disconnect();
