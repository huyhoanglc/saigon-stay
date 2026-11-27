// Đọc dữ liệu "rổ hàng" (file Excel DATA RỔ HÀNG.xlsx) đã được chuyển thành mảng các dòng.
// File này KHÔNG đụng tới DB, chỉ chuẩn hoá + kiểm tra dữ liệu, nên test được dễ dàng.
//
// Đầu vào: { "DỰ ÁN": rows, "MÃ PHÒNG": rows }, rows[0] là dòng tiêu đề (dòng 1 trong Excel).
// Đầu ra:  { projects: [...], issues: [{ sheet, row, column, level, message }] }

export const PROJECT_SHEET = "DỰ ÁN";
export const ROOM_SHEET = "MÃ PHÒNG";

const MAX_POLICY_LENGTH = 20000;
const MAX_ROOM_CODE_LENGTH = 20;
const MAX_TEXT_LENGTH = 500;

// Tên cột (đã bỏ dấu *) → tên field. Map theo tên để người dùng chèn thêm cột cũng không vỡ.
const PROJECT_COLUMNS = {
  projectCode: "MÃ DỰ ÁN",
  houseNumber: "SỐ NHÀ",
  street: "TÊN ĐƯỜNG",
  district: "QUẬN",
  elevator: "THANG BỘ/MÁY",
  roadType: "HẺM Ô TÔ/XE MÁY",
  shortTermRental: "NHẬN NGẮN HẠN THÁNG",
  petAllowed: "THÚ CƯNG",
  foreignersAllowed: "NGƯỜI NƯỚC NGOÀI",
  policy: "CHÍNH SÁCH",
  system: "HỆ THỐNG",
  ownerPhone: "SỐ CHỦ NHÀ",
  zaloGroupUrl: "LINK GR TỔNG",
  ownerReview: "REVIEW CHỦ NHÀ TỪ KẾ TOÁN",
};
const PROJECT_REQUIRED_COLUMNS = ["houseNumber", "street", "district"];

const ROOM_COLUMNS = {
  roomCodes: "MÃ PHÒNG",
  projectCode: "MÃ DỰ ÁN",
  price: "GIÁ",
  roomType: "DẠNG PHÒNG",
  balcony: "BAN CÔNG",
  window: "CỬA SỔ",
  privateWasher: "MÁY GIẶT RIÊNG",
  imageRef: "LINK HÌNH ẢNH",
};
const ROOM_REQUIRED_COLUMNS = ["roomCodes", "projectCode", "price", "roomType"];

// Dạng phòng trong Excel → giá trị layout trong DB
const ROOM_TYPES = {
  studio: "studio",
  duplex: "duplex",
  "1pn": "1br",
  "2pn": "2br",
  "3pn": "3br",
};

// ===== Chuẩn hoá giá trị ô =====

// Chuỗi đã chuẩn hoá: NFC, đổi khoảng trắng không ngắt dòng (\xa0) thành space, bỏ khoảng trắng 2 đầu.
// Ô trống → null.
export function cleanText(value) {
  if (value === undefined || value === null) {
    return null;
  }
  let text = String(value);
  text = text.replace(/ /g, " ").normalize("NFC").trim();
  if (text === "") {
    return null;
  }
  return text;
}

// Số nguyên bị lưu thành "79.0" / 79 → "79". Chuỗi khác giữ nguyên.
export function cleanCode(value) {
  const text = cleanText(value);
  if (text === null) {
    return null;
  }
  const match = text.match(/^(-?\d+)\.0+$/);
  if (match) {
    return match[1];
  }
  return text;
}

// Bỏ dấu tiếng Việt + chữ thường, chỉ dùng để so sánh
export function toKey(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// "Có"/"Không" → true/false. Trống → null. Giá trị lạ → undefined.
export function parseYesNo(value) {
  const text = cleanText(value);
  if (text === null) {
    return null;
  }
  const key = toKey(text);
  if (["co", "yes", "x", "true", "1"].includes(key)) {
    return true;
  }
  if (["khong", "no", "false", "0"].includes(key)) {
    return false;
  }
  return undefined;
}

// Giá thuê → số nguyên (đồng). Không đọc được → null.
// Chấp nhận: 7000000, "7000000.0", "7.000.000", "7,000,000", "7tr", "7.5 triệu".
export function parsePrice(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.round(value);
  }

  const text = cleanText(value);
  if (text === null) {
    return null;
  }
  const key = toKey(text).replace(/\s/g, "").replace(/(d|vnd|đ)$/, "");

  if (/^\d+(\.\d+)?$/.test(key)) {
    return Math.round(Number(key));
  }
  if (/^\d{1,3}([.,]\d{3})+$/.test(key)) {
    return Number(key.replace(/[.,]/g, ""));
  }
  const million = key.match(/^(\d+(?:[.,]\d+)?)(tr|trieu)$/);
  if (million) {
    return Math.round(Number(million[1].replace(",", ".")) * 1000000);
  }
  return null;
}

// Số điện thoại: chỉ giữ chữ số, thêm lại số 0 đầu nếu Excel làm mất
export function parsePhone(value) {
  const text = cleanCode(value);
  if (text === null) {
    return null;
  }
  let digits = text.replace(/\D/g, "");
  if (digits.length === 9 && !digits.startsWith("0")) {
    digits = "0" + digits;
  }
  return digits;
}

export function isValidPhone(phone) {
  return /^0\d{9}$/.test(phone);
}

// "Quận 10" / "10" / 10 / "10.0" → "10". "Quận Tân Bình" → "Tân Bình".
export function cleanDistrict(value) {
  const text = cleanCode(value);
  if (text === null) {
    return null;
  }
  const withoutPrefix = text.replace(/^quận\s+/i, "").replace(/^q\.?\s*(?=\d)/i, "");
  return cleanCode(withoutPrefix);
}

// Tên khu vực lưu trong DB (khớp danh sách Khu vực trên web): "10" → "Quận 10", "Tân Bình" giữ nguyên.
export function districtToArea(district) {
  if (/^\d+$/.test(district)) {
    return "Quận " + district;
  }
  return district;
}

// "1, 2,,3 " → ["1", "2", "3"]. Bỏ phần tử rỗng và trùng.
export function splitCodes(value) {
  const text = cleanCode(value);
  if (text === null) {
    return [];
  }
  const codes = [];
  for (const part of text.split(",")) {
    const code = part.trim();
    if (code !== "" && !codes.includes(code)) {
      codes.push(code);
    }
  }
  return codes;
}

// ===== Mã dự án =====

function initials(text) {
  const words = text.split(/\s+/).filter((word) => word !== "");
  let result = "";
  for (const word of words) {
    result = result + Array.from(word)[0];
  }
  return result.toUpperCase();
}

export function abbreviateStreet(street) {
  if (street.trim().toLowerCase() === "cách mạng tháng tám") {
    return "CMT8";
  }
  return initials(street);
}

export function abbreviateDistrict(district) {
  if (/^\d+$/.test(district)) {
    return "Q" + district;
  }
  return "Q" + initials(district.replace(/^quận\s+/i, ""));
}

// Giống công thức cột A trong sheet DỰ ÁN: <số nhà>.<viết tắt đường>.<viết tắt quận>
export function buildProjectCode(houseNumber, street, district) {
  if (!houseNumber || !street || !district) {
    return null;
  }
  return houseNumber + "." + abbreviateStreet(street) + "." + abbreviateDistrict(district);
}

// ===== Đọc bảng =====

function normalizeHeader(value) {
  const text = cleanText(value);
  if (text === null) {
    return "";
  }
  return text.replace(/\*/g, "").replace(/\s+/g, " ").trim().toUpperCase();
}

// Tìm vị trí từng cột theo tiêu đề. Trả về { index: { field: số cột }, missing: [field] }
function mapColumns(headerRow, columns) {
  const positions = {};
  const headers = [];
  for (const cell of headerRow || []) {
    headers.push(normalizeHeader(cell));
  }
  const missing = [];
  for (const field of Object.keys(columns)) {
    const position = headers.indexOf(columns[field].toUpperCase());
    if (position === -1) {
      missing.push(field);
    } else {
      positions[field] = position;
    }
  }
  return { positions: positions, missing: missing };
}

// Đọc 1 dòng thành object { field: giá trị gốc }
function readRow(row, positions) {
  const result = {};
  for (const field of Object.keys(positions)) {
    let value = null;
    if (row) {
      value = row[positions[field]];
    }
    if (value === undefined) {
      value = null;
    }
    result[field] = value;
  }
  return result;
}

function isBlankRow(raw, fields) {
  for (const field of fields) {
    if (cleanText(raw[field]) !== null) {
      return false;
    }
  }
  return true;
}

// Tìm sheet theo tên, không phân biệt hoa thường / khoảng trắng / kiểu gõ dấu
export function findSheet(sheets, name) {
  const wanted = toKey(name);
  for (const sheetName of Object.keys(sheets)) {
    if (toKey(sheetName) === wanted) {
      return sheets[sheetName];
    }
  }
  return null;
}

// ===== Hàm chính =====

export function parseRoHang(sheets) {
  const issues = [];

  function addIssue(sheet, row, column, level, message) {
    issues.push({ sheet: sheet, row: row, column: column, level: level, message: message });
  }

  const projectRows = findSheet(sheets, PROJECT_SHEET);
  const roomRows = findSheet(sheets, ROOM_SHEET);
  if (!projectRows) {
    addIssue(PROJECT_SHEET, null, null, "error", "Không tìm thấy sheet \"" + PROJECT_SHEET + "\"");
  }
  if (!roomRows) {
    addIssue(ROOM_SHEET, null, null, "error", "Không tìm thấy sheet \"" + ROOM_SHEET + "\"");
  }
  if (!projectRows || !roomRows) {
    return { projects: [], issues: issues };
  }

  const projects = parseProjects(projectRows, addIssue);
  parseRooms(roomRows, projects, addIssue);

  return { projects: projects, issues: issues };
}

function checkColumns(sheet, headerRow, columns, required, addIssue) {
  const mapped = mapColumns(headerRow, columns);
  let ok = true;
  for (const field of mapped.missing) {
    let level = "warning";
    let message = "Không có cột này, bỏ qua";
    if (required.includes(field)) {
      level = "error";
      message = "Thiếu cột bắt buộc";
      ok = false;
    }
    addIssue(sheet, 1, columns[field], level, message);
  }
  return { positions: mapped.positions, ok: ok };
}

function parseProjects(rows, addIssue) {
  const sheet = PROJECT_SHEET;
  const columns = checkColumns(sheet, rows[0], PROJECT_COLUMNS, PROJECT_REQUIRED_COLUMNS, addIssue);
  if (!columns.ok) {
    return [];
  }

  const projects = [];
  const seenCodes = {};

  for (let i = 1; i < rows.length; i++) {
    const rowNumber = i + 1;
    const raw = readRow(rows[i], columns.positions);
    if (isBlankRow(raw, ["projectCode", "houseNumber", "street", "district"])) {
      continue;
    }

    function warn(field, message) {
      addIssue(sheet, rowNumber, PROJECT_COLUMNS[field], "warning", message);
    }
    function error(field, message) {
      addIssue(sheet, rowNumber, PROJECT_COLUMNS[field], "error", message);
    }

    const houseNumber = cleanCode(raw.houseNumber);
    const street = cleanText(raw.street);
    const district = cleanDistrict(raw.district);

    // Mã dự án: ưu tiên giá trị trong file, trống thì tự tính lại theo công thức
    const computedCode = buildProjectCode(houseNumber, street, district);
    let projectCode = cleanCode(raw.projectCode);
    if (projectCode === null) {
      projectCode = computedCode;
    } else if (computedCode !== null && projectCode !== computedCode) {
      warn("projectCode", "Mã trong file (" + projectCode + ") khác mã tính lại (" + computedCode + "), dùng mã trong file");
    }

    if (projectCode === null) {
      error("projectCode", "Thiếu mã dự án (cần đủ số nhà, tên đường, quận)");
      continue;
    }
    if (houseNumber === null || street === null || district === null) {
      error("houseNumber", "Thiếu số nhà, tên đường hoặc quận");
      continue;
    }
    if (seenCodes[projectCode]) {
      error("projectCode", "Trùng mã dự án với dòng " + seenCodes[projectCode] + ", bỏ qua dòng này");
      continue;
    }
    seenCodes[projectCode] = rowNumber;

    // Thang bộ / thang máy
    let hasElevator = null;
    const elevatorText = cleanText(raw.elevator);
    if (elevatorText === null) {
      warn("elevator", "Trống");
    } else if (toKey(elevatorText) === "thang may") {
      hasElevator = true;
    } else if (toKey(elevatorText) === "thang bo") {
      hasElevator = false;
    } else {
      warn("elevator", "Giá trị không hợp lệ: \"" + elevatorText + "\"");
    }

    // Hẻm ô tô / xe máy
    let roadType = null;
    const roadText = cleanText(raw.roadType);
    if (roadText !== null) {
      const key = toKey(roadText);
      if (key === "hem o to" || key === "hem oto") {
        roadType = "car_alley";
      } else if (key === "hem xe may") {
        roadType = "motorbike_alley";
      } else if (key === "mat tien") {
        roadType = "street_front";
      } else {
        warn("roadType", "Giá trị không hợp lệ: \"" + roadText + "\"");
      }
    }

    function readYesNo(field, warnIfBlank) {
      const value = parseYesNo(raw[field]);
      if (value === undefined) {
        warn(field, "Giá trị không hợp lệ: \"" + cleanText(raw[field]) + "\"");
        return null;
      }
      if (value === null && warnIfBlank) {
        warn(field, "Trống");
      }
      return value;
    }

    const shortTermRental = readYesNo("shortTermRental", true);
    const petAllowed = readYesNo("petAllowed", false);
    const foreignersAllowed = readYesNo("foreignersAllowed", false);

    // Chính sách: giữ nguyên xuống dòng bên trong, chỉ bỏ khoảng trắng 2 đầu
    let policy = cleanText(raw.policy);
    if (policy !== null && policy.length > MAX_POLICY_LENGTH) {
      warn("policy", "Quá dài, chỉ lấy " + MAX_POLICY_LENGTH + " ký tự đầu");
      policy = policy.slice(0, MAX_POLICY_LENGTH);
    }

    let ownerPhone = parsePhone(raw.ownerPhone);
    if (ownerPhone === null) {
      warn("ownerPhone", "Trống");
    } else if (!isValidPhone(ownerPhone)) {
      warn("ownerPhone", "Số điện thoại không đủ 10 số: \"" + cleanText(raw.ownerPhone) + "\"");
    }
    if (ownerPhone === "") {
      ownerPhone = null;
    }

    let zaloGroupUrl = cleanText(raw.zaloGroupUrl);
    if (zaloGroupUrl !== null && !/^https?:\/\//i.test(zaloGroupUrl)) {
      warn("zaloGroupUrl", "Không phải đường link, bỏ qua");
      zaloGroupUrl = null;
    }

    projects.push({
      projectCode: projectCode,
      houseNumber: houseNumber,
      street: street,
      district: district,
      area: districtToArea(district),
      hasElevator: hasElevator,
      roadType: roadType,
      shortTermRental: shortTermRental,
      petAllowed: petAllowed,
      foreignersAllowed: foreignersAllowed,
      policy: policy,
      system: limitText(cleanText(raw.system)),
      ownerPhone: ownerPhone,
      zaloGroupUrl: limitText(zaloGroupUrl),
      ownerReview: limitText(cleanText(raw.ownerReview)),
      rooms: [],
      sourceRow: rowNumber,
    });
  }

  return projects;
}

function limitText(text) {
  if (text === null) {
    return null;
  }
  return text.slice(0, MAX_TEXT_LENGTH);
}

function parseRooms(rows, projects, addIssue) {
  const sheet = ROOM_SHEET;
  const columns = checkColumns(sheet, rows[0], ROOM_COLUMNS, ROOM_REQUIRED_COLUMNS, addIssue);
  if (!columns.ok) {
    return;
  }

  const projectByCode = {};
  for (const project of projects) {
    projectByCode[project.projectCode] = project;
  }
  // Mã phòng đã gặp trong từng dự án → dòng Excel, để báo trùng
  const seenRooms = {};

  for (let i = 1; i < rows.length; i++) {
    const rowNumber = i + 1;
    const raw = readRow(rows[i], columns.positions);
    if (isBlankRow(raw, Object.keys(columns.positions))) {
      continue;
    }

    function warn(field, message) {
      addIssue(sheet, rowNumber, ROOM_COLUMNS[field], "warning", message);
    }
    function error(field, message) {
      addIssue(sheet, rowNumber, ROOM_COLUMNS[field], "error", message);
    }

    let roomCodes = splitCodes(raw.roomCodes);
    if (roomCodes.length === 0) {
      error("roomCodes", "Thiếu mã phòng");
      continue;
    }

    const projectCode = cleanCode(raw.projectCode);
    if (projectCode === null) {
      error("projectCode", "Thiếu mã dự án");
      continue;
    }
    const project = projectByCode[projectCode];
    if (!project) {
      error("projectCode", "Mã dự án \"" + projectCode + "\" không có (hoặc bị lỗi) trong sheet " + PROJECT_SHEET);
      continue;
    }

    const price = parsePrice(raw.price);
    if (price === null || price <= 0) {
      error("price", "Giá không hợp lệ: \"" + cleanText(raw.price) + "\"");
      continue;
    }

    const roomTypeText = cleanText(raw.roomType);
    let layout = undefined;
    if (roomTypeText !== null) {
      layout = ROOM_TYPES[toKey(roomTypeText).replace(/\s/g, "")];
    }
    if (!layout) {
      error("roomType", "Dạng phòng không hợp lệ: \"" + roomTypeText + "\" (chỉ nhận Studio, 1PN, 2PN, 3PN, Duplex)");
      continue;
    }

    function readYesNo(field) {
      const value = parseYesNo(raw[field]);
      if (value === undefined) {
        warn(field, "Giá trị không hợp lệ: \"" + cleanText(raw[field]) + "\"");
        return null;
      }
      if (value === null) {
        warn(field, "Trống");
      }
      return value;
    }

    const balcony = readYesNo("balcony");
    const hasWindow = readYesNo("window");
    const privateWasher = readYesNo("privateWasher");

    // Bỏ các mã quá dài hoặc đã xuất hiện ở dòng trước của cùng dự án
    const validCodes = [];
    for (const code of roomCodes) {
      if (code.length > MAX_ROOM_CODE_LENGTH) {
        error("roomCodes", "Mã phòng \"" + code + "\" quá dài (tối đa " + MAX_ROOM_CODE_LENGTH + " ký tự)");
        continue;
      }
      const key = projectCode + "|" + code;
      if (seenRooms[key]) {
        warn("roomCodes", "Phòng " + code + " đã có ở dòng " + seenRooms[key] + ", giữ dữ liệu dòng đó");
        continue;
      }
      seenRooms[key] = rowNumber;
      validCodes.push(code);
    }
    roomCodes = validCodes;
    if (roomCodes.length === 0) {
      continue;
    }

    // Cột LINK HÌNH ẢNH: link thư mục ảnh Google Drive, hoặc (file cũ) danh sách mã phòng → lưu nguyên.
    // Nếu là danh sách mã phòng mà khác cột A thì cảnh báo.
    const imageRef = cleanCode(raw.imageRef);
    if (imageRef === null) {
      if ("imageRef" in columns.positions) {
        warn("imageRef", "Trống");
      }
    } else if (/^https?:\/\//i.test(imageRef)) {
      // Link thư mục ảnh (Google Drive): admin lấy ảnh từ link này trong form sửa phòng
    } else if (splitCodes(imageRef).join(",") !== splitCodes(raw.roomCodes).join(",")) {
      warn("imageRef", "Khác cột " + ROOM_COLUMNS.roomCodes + ": \"" + imageRef + "\"");
    }

    project.rooms.push({
      roomCodes: roomCodes,
      price: price,
      layout: layout,
      balcony: balcony,
      window: hasWindow,
      privateWasher: privateWasher,
      imageRef: limitText(imageRef),
      sourceRow: rowNumber,
    });
  }
}

// Ban công / cửa sổ trong Excel → kiểu cửa sổ trong DB. Không đủ thông tin → null (giữ nguyên).
export function toWindowType(balcony, hasWindow) {
  if (balcony === true) {
    return "balcony";
  }
  if (hasWindow === true) {
    return "outside";
  }
  if (hasWindow === false) {
    return "none";
  }
  return null;
}
