import mongoose from "mongoose";

// Đếm số lần đăng nhập sai theo email.
// Lưu trong DB (không lưu RAM) để server khởi động lại trên Render vẫn còn.
const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  firstFailAt: { type: Date, required: true },
  // TTL index: MongoDB tự xoá bản ghi khi tới thời điểm này (trễ tối đa khoảng 1 phút)
  expireAt: { type: Date, required: true, index: { expires: 0 } },
});

export default mongoose.model("LoginAttempt", loginAttemptSchema);
