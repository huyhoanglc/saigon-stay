// Các hàm nhỏ để đọc dữ liệu từ req.body một cách an toàn.
// Dữ liệu gửi lên có thể sai kiểu (số thành chữ, mảng thành object...), nên luôn kiểm tra kiểu trước.

export function fail(code, message) {
  return { error: { code: code, message: message } };
}

// Trả về chuỗi đã bỏ khoảng trắng 2 đầu, sai kiểu thì trả về ""
export function readString(value) {
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

// Chỉ true khi đúng là true, mọi giá trị khác là false
export function readBoolean(value) {
  if (value === true) {
    return true;
  }
  return false;
}

// Ô số để trống thì trả về null. Có nhập thì trả về Number (có thể là NaN nếu nhập sai).
export function readNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return Number(value);
}

// Kiểm tra số nằm trong khoảng [min, max]
export function isNumberInRange(value, min, max) {
  if (!Number.isFinite(value)) {
    return false;
  }
  if (value < min || value > max) {
    return false;
  }
  return true;
}

export function isIntegerInRange(value, min, max) {
  if (!Number.isInteger(value)) {
    return false;
  }
  return isNumberInRange(value, min, max);
}

const MAX_IMAGES = 30;

// Danh sách link ảnh: phải là mảng các link https, trả về null nếu sai
export function readImages(value) {
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value) || value.length > MAX_IMAGES) {
    return null;
  }

  const images = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.startsWith("https://")) {
      return null;
    }
    images.push(item);
  }
  return images;
}

// Dùng khi tìm kiếm bằng RegExp: thoát các ký tự đặc biệt để người dùng không chèn được biểu thức lạ
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Đọc số trang và số dòng mỗi trang từ query
export function readPaging(query, defaultLimit, maxLimit) {
  let page = Number(query.page);
  if (!Number.isInteger(page) || page < 1) {
    page = 1;
  }

  let limit = Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  return { page: page, limit: limit };
}
