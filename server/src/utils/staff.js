import crypto from "node:crypto";
import User from "../models/User.js";

const STAFF_PREFIX = "NV";
// Mã tự cấp có ít nhất 3 chữ số: NV001, NV002... NV999, NV1000
const STAFF_DIGITS = 3;
// Mã do admin tự đặt: chữ in hoa, số, gạch ngang, gạch dưới, 2-20 ký tự
const STAFF_CODE_REGEX = /^[A-Z0-9_-]{2,20}$/;

// Bỏ các ký tự dễ nhìn nhầm (0/O, 1/l/I) vì mật khẩu sẽ được đọc / gõ lại bằng tay
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const PASSWORD_LENGTH = 12;

// Mật khẩu ngẫu nhiên đủ mạnh. Dùng crypto.randomInt (không dùng Math.random vì đoán được).
export function generatePassword() {
  let password = "";
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    const index = crypto.randomInt(PASSWORD_CHARS.length);
    password = password + PASSWORD_CHARS[index];
  }
  return password;
}

// Chuẩn hoá mã admin nhập: bỏ khoảng trắng, đổi sang chữ in hoa. Trả về null nếu sai định dạng.
export function normalizeStaffCode(value) {
  if (typeof value !== "string") {
    return null;
  }
  const code = value.trim().toUpperCase();
  if (!STAFF_CODE_REGEX.test(code)) {
    return null;
  }
  return code;
}

// Từ danh sách mã đang có, tính mã tự cấp tiếp theo.
// Chỉ xét mã dạng NV + số (vd NV007); mã admin tự đặt kiểu "SALE-AN" thì bỏ qua.
export function nextStaffCode(existingCodes) {
  let max = 0;
  for (const code of existingCodes) {
    const match = /^NV(\d+)$/.exec(String(code));
    if (match) {
      const number = Number(match[1]);
      if (number > max) {
        max = number;
      }
    }
  }
  return STAFF_PREFIX + String(max + 1).padStart(STAFF_DIGITS, "0");
}

// Cấp mã mới cho user rồi lưu.
// 2 admin cùng tạo nhân viên một lúc có thể ra trùng mã → index unique báo lỗi 11000 → thử lại.
export async function saveWithNewStaffCode(user) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const users = await User.find({ staffCode: /^NV\d+$/ }).select("staffCode");
    const codes = [];
    for (const item of users) {
      codes.push(item.staffCode);
    }
    user.staffCode = nextStaffCode(codes);

    try {
      await user.save();
      return;
    } catch (err) {
      const isDuplicateCode = err.code === 11000 && err.keyPattern && err.keyPattern.staffCode;
      if (!isDuplicateCode) {
        throw err;
      }
    }
  }
  throw new Error("Không cấp được mã nhân viên, thử lại sau");
}
