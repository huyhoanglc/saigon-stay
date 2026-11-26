import User from "../models/User.js";

// Chuyển user trong DB thành dữ liệu an toàn để gửi cho trình duyệt.
// Không bao giờ gửi password, tokenVersion, googleId, zaloId.
// Lưu ý: user phải được lấy kèm .select("+password") thì hasPassword mới đúng.
export function toPublicUser(user) {
  let email = "";
  if (user.email) {
    email = user.email;
  }

  return {
    id: String(user._id),
    name: user.name,
    email: email,
    role: user.role,
    phone: user.phone || "",
    avatar: user.avatar || "",
    hasPassword: Boolean(user.password),
    google: Boolean(user.googleId),
    zalo: Boolean(user.zaloId),
  };
}

// Lấy lại user từ DB (kèm password để biết đã đặt mật khẩu chưa) rồi chuyển sang dạng an toàn
export async function getPublicUser(userId) {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    return null;
  }
  return toPublicUser(user);
}
