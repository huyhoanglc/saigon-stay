import crypto from "node:crypto";
import User from "../models/User.js";
import { getDefaultOrigin } from "./origins.js";
import { sendMail } from "./mailer.js";
import { staffInviteEmail, resetPasswordEmail } from "./emailTemplates.js";

// Thời hạn link: mời nhân viên lâu hơn (có thể chưa đọc mail ngay), quên mật khẩu ngắn cho an toàn
export const INVITE_HOURS = 48;
export const RESET_HOURS = 1;

// Ẩn mặc định trong model, phải select thêm mới đọc được
export const TOKEN_FIELDS =
  "+passwordTokenHash +passwordTokenExpires +passwordTokenPurpose +passwordTokenSentAt";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Trang đặt mật khẩu nằm ở web khách (sale và admin đều dùng được).
// PUBLIC_SITE_URL không đặt thì lấy domain đầu tiên trong CLIENT_URL.
export function buildSetPasswordLink(token) {
  let base = process.env.PUBLIC_SITE_URL;
  if (!base) {
    base = getDefaultOrigin();
  }
  base = base.replace(/\/+$/, "");
  return base + "/reset-password?token=" + encodeURIComponent(token);
}

// Tạo token mới (token cũ chưa dùng sẽ hết tác dụng) và lưu bản băm vào user.
// Trả về token gốc: chỉ dùng để gửi mail, không lưu ở đâu cả.
export async function createPasswordToken(user, purpose, hours) {
  // 32 byte ngẫu nhiên → không thể đoán
  const token = crypto.randomBytes(32).toString("base64url");
  user.passwordTokenHash = hashToken(token);
  user.passwordTokenExpires = new Date(Date.now() + hours * 60 * 60 * 1000);
  user.passwordTokenPurpose = purpose;
  user.passwordTokenSentAt = new Date();
  await user.save();
  return token;
}

// Tìm user theo token còn hạn. Trả về null nếu token sai, đã dùng hoặc hết hạn.
export async function findUserByToken(token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 200) {
    return null;
  }
  const user = await User.findOne({
    passwordTokenHash: hashToken(token),
    passwordTokenExpires: { $gt: new Date() },
  }).select(TOKEN_FIELDS + " +password");
  return user;
}

// Xoá token sau khi dùng: mỗi link chỉ dùng được 1 lần.
// Xoá cả mốc thời gian gửi, để lần quên mật khẩu sau không bị chặn bởi lần gửi trước đã dùng xong.
export function clearPasswordToken(user) {
  user.passwordTokenHash = undefined;
  user.passwordTokenExpires = undefined;
  user.passwordTokenPurpose = undefined;
  user.passwordTokenSentAt = undefined;
}

// Gửi email mời (nhân viên mới) hoặc đặt lại mật khẩu.
// Gửi lỗi thì không ném lỗi ra ngoài, trả về { emailSent: false, link } để admin tự gửi link.
export async function sendPasswordEmail(user, purpose) {
  let hours = RESET_HOURS;
  if (purpose === "invite") {
    hours = INVITE_HOURS;
  }

  const token = await createPasswordToken(user, purpose, hours);
  const link = buildSetPasswordLink(token);

  const data = {
    name: user.name,
    email: user.email,
    role: user.role,
    staffCode: user.staffCode,
    link: link,
    expiresHours: hours,
  };

  let mail;
  if (purpose === "invite") {
    mail = staffInviteEmail(data);
  } else {
    mail = resetPasswordEmail(data);
  }

  try {
    await sendMail(user.email, mail.subject, mail.html, mail.text);
    return { emailSent: true, link: link, errorCode: "" };
  } catch (err) {
    return { emailSent: false, link: link, errorCode: err.code || "MAIL_FAILED" };
  }
}
