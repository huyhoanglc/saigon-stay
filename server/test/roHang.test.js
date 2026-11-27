import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {
  parseRoHang,
  buildProjectCode,
  splitCodes,
  parsePhone,
  parsePrice,
  parseYesNo,
  cleanCode,
  cleanDistrict,
  cleanText,
  toWindowType,
} from "../src/import/roHang.js";
import { readXlsx } from "../src/import/readXlsx.js";

const PROJECT_HEADER = [
  "MÃ DỰ ÁN*",
  "SỐ NHÀ*",
  "TÊN ĐƯỜNG*",
  "QUẬN*",
  "THANG BỘ/MÁY*",
  "HẺM Ô TÔ/XE MÁY",
  "NHẬN NGẮN HẠN THÁNG*",
  "THÚ CƯNG",
  "NGƯỜI NƯỚC NGOÀI",
  "CHÍNH SÁCH",
  "HỆ THỐNG",
  "SỐ CHỦ NHÀ*",
  "LINK GR TỔNG",
  "REVIEW CHỦ NHÀ TỪ KẾ TOÁN",
];
const ROOM_HEADER = [
  "MÃ PHÒNG*",
  "MÃ DỰ ÁN*",
  "GIÁ*",
  "DẠNG PHÒNG*",
  "BAN CÔNG*",
  "CỬA SỔ*",
  "MÁY GIẶT RIÊNG*",
  "LINK HÌNH ẢNH",
];

function project(overrides) {
  const row = {
    code: null,
    house: "499/10",
    street: "Cách Mạng Tháng Tám",
    district: 10,
    elevator: "Thang bộ",
    road: "Hẻm xe máy",
    shortTerm: "Không",
    pets: "Không",
    foreigners: "Có",
    policy: "Chính sách",
    system: "KIM HOUSING",
    phone: "0911566741",
    zalo: "https://zalo.me/g/abc",
    review: null,
    ...overrides,
  };
  return [
    row.code,
    row.house,
    row.street,
    row.district,
    row.elevator,
    row.road,
    row.shortTerm,
    row.pets,
    row.foreigners,
    row.policy,
    row.system,
    row.phone,
    row.zalo,
    row.review,
  ];
}

function room(codes, projectCode, price, type, extra) {
  const values = { balcony: "Có", window: "Có", washer: "Không", image: codes, ...extra };
  return [codes, projectCode, price, type, values.balcony, values.window, values.washer, values.image];
}

function parse(projectRows, roomRows) {
  return parseRoHang({
    "DỰ ÁN": [PROJECT_HEADER, ...projectRows],
    "MÃ PHÒNG": [ROOM_HEADER, ...roomRows],
  });
}

function issuesOf(result, level) {
  return result.issues.filter((issue) => issue.level === level);
}

// ===== Hàm nhỏ =====

test("mã dự án tính theo công thức của sheet", () => {
  assert.equal(buildProjectCode("499/10", "Cách Mạng Tháng Tám", "10"), "499/10.CMT8.Q10");
  assert.equal(buildProjectCode("79", "Ca Văn Thỉnh", "Tân Bình"), "79.CVT.QTB");
  assert.equal(buildProjectCode("632", "Đường 3 tháng 2", "10"), "632.Đ3T2.Q10");
  assert.equal(buildProjectCode("1", "Đuòng số 9", "11"), "1.ĐS9.Q11");
  assert.equal(buildProjectCode("159/30", "Trần Văn Đang", "3"), "159/30.TVĐ.Q3");
  assert.equal(buildProjectCode("190", "Phan Xích Long", "Phú Nhuận"), "190.PXL.QPN");
  assert.equal(buildProjectCode("7a/75", "Thành Thái", "10"), "7a/75.TT.Q10");
  assert.equal(buildProjectCode("44- 45", "Tam Đảo", "10"), "44- 45.TĐ.Q10");
  assert.equal(buildProjectCode(null, "Tam Đảo", "10"), null);
});

test("số nhà / quận bị lưu dạng số thực thì bỏ .0", () => {
  assert.equal(cleanCode(79), "79");
  assert.equal(cleanCode("79.0"), "79");
  assert.equal(cleanCode("499/10"), "499/10");
  assert.equal(cleanDistrict(10), "10");
  assert.equal(cleanDistrict("10.0"), "10");
  assert.equal(cleanDistrict("Quận 3"), "3");
  assert.equal(cleanDistrict("Quận Tân Bình"), "Tân Bình");
  assert.equal(cleanDistrict("Tân Bình"), "Tân Bình");
});

test("mã phòng: tách dấu phẩy, bỏ phần tử rỗng, giữ số 0 đầu", () => {
  assert.deepEqual(splitCodes("205,305,405,"), ["205", "305", "405"]);
  assert.deepEqual(splitCodes("002,102, 202"), ["002", "102", "202"]);
  assert.deepEqual(splitCodes("G01"), ["G01"]);
  assert.deepEqual(splitCodes(101), ["101"]);
  assert.deepEqual(splitCodes(null), []);
});

test("số điện thoại có khoảng trắng hoặc mất số 0 đầu", () => {
  assert.equal(parsePhone("035 7398166"), "0357398166");
  assert.equal(parsePhone("090 140 1097"), "0901401097");
  assert.equal(parsePhone(911566741), "0911566741");
  assert.equal(parsePhone(null), null);
});

test("giá: số, số thực dạng chuỗi, có dấu chấm, viết tắt triệu", () => {
  assert.equal(parsePrice(7000000), 7000000);
  assert.equal(parsePrice("7000000.0"), 7000000);
  assert.equal(parsePrice("7.000.000"), 7000000);
  assert.equal(parsePrice("7,000,000"), 7000000);
  assert.equal(parsePrice("7tr"), 7000000);
  assert.equal(parsePrice("7.5 triệu"), 7500000);
  assert.equal(parsePrice("liên hệ"), null);
});

test("Có / Không, ô trống, giá trị lạ", () => {
  assert.equal(parseYesNo("Có"), true);
  assert.equal(parseYesNo(" không "), false);
  assert.equal(parseYesNo("Co"), true);
  assert.equal(parseYesNo(null), null);
  assert.equal(parseYesNo("   "), null);
  assert.equal(parseYesNo("tuỳ"), undefined);
});

test("chuỗi: đổi \\xa0, chuẩn hoá NFC, giữ xuống dòng bên trong", () => {
  const nfd = "Tân Bình".normalize("NFD");
  assert.equal(cleanText(nfd), "Tân Bình");
  assert.equal(cleanText("  a b\nc  "), "a b\nc");
  assert.equal(cleanText("   "), null);
});

test("ban công / cửa sổ → kiểu cửa sổ", () => {
  assert.equal(toWindowType(true, false), "balcony");
  assert.equal(toWindowType(false, true), "outside");
  assert.equal(toWindowType(false, false), "none");
  assert.equal(toWindowType(false, null), null);
});

// ===== Cả bảng =====

test("đọc dự án + phòng, ghép phòng vào đúng dự án", () => {
  const result = parse(
    [
      project({ code: "499/10.CMT8.Q10" }),
      project({ code: null, house: "79.0", street: "Ca Văn Thỉnh", district: "Tân Bình", elevator: "Thang máy", road: "Hẻm ô tô", shortTerm: null, phone: "035 7398166" }),
    ],
    [
      room("101,201", "499/10.CMT8.Q10", 7000000, "Studio"),
      room("002,102,202", "499/10.CMT8.Q10", "10000000.0", "1PN", { window: null }),
      room("205,305,405,", "79.CVT.QTB", 8500000, "3PN", { image: "205,305,405,505" }),
    ],
  );

  assert.equal(issuesOf(result, "error").length, 0);
  assert.equal(result.projects.length, 2);

  const [first, second] = result.projects;
  assert.equal(first.projectCode, "499/10.CMT8.Q10");
  assert.equal(first.district, "10");
  assert.equal(first.area, "Quận 10");
  assert.equal(first.hasElevator, false);
  assert.equal(first.roadType, "motorbike_alley");
  assert.equal(first.foreignersAllowed, true);
  assert.equal(first.sourceRow, 2);
  assert.equal(first.rooms.length, 2);
  assert.deepEqual(first.rooms[1].roomCodes, ["002", "102", "202"]);
  assert.equal(first.rooms[1].price, 10000000);
  assert.equal(first.rooms[1].layout, "1br");
  assert.equal(first.rooms[1].window, null);

  // Mã dự án trống → tự sinh; số nhà 79.0 → 79; quận chữ
  assert.equal(second.projectCode, "79.CVT.QTB");
  assert.equal(second.houseNumber, "79");
  assert.equal(second.area, "Tân Bình");
  assert.equal(second.hasElevator, true);
  assert.equal(second.roadType, "car_alley");
  assert.equal(second.shortTermRental, null);
  assert.equal(second.ownerPhone, "0357398166");
  assert.deepEqual(second.rooms[0].roomCodes, ["205", "305", "405"]);
  assert.equal(second.rooms[0].layout, "3br");

  // Cảnh báo: ngắn hạn trống (dòng 3), cửa sổ trống (dòng 3 sheet phòng), link ảnh khác mã phòng (dòng 4)
  const warnings = issuesOf(result, "warning");
  assert.ok(warnings.some((w) => w.sheet === "DỰ ÁN" && w.row === 3 && w.column === "NHẬN NGẮN HẠN THÁNG"));
  assert.ok(warnings.some((w) => w.sheet === "MÃ PHÒNG" && w.row === 3 && w.column === "CỬA SỔ"));
  assert.ok(warnings.some((w) => w.sheet === "MÃ PHÒNG" && w.row === 4 && w.column === "LINK HÌNH ẢNH"));
});

test("bỏ qua dòng trống, kể cả dòng trống ở giữa", () => {
  const result = parse(
    [project({}), [null, null, null, null], [], project({ house: "88", street: "Tô Hiến Thành" })],
    [room("101", "499/10.CMT8.Q10", 7000000, "Studio"), [], [null, null, " "]],
  );
  assert.equal(result.issues.filter((i) => i.level === "error").length, 0);
  assert.equal(result.projects.length, 2);
  assert.equal(result.projects[1].sourceRow, 5);
});

test("lỗi dòng: trùng mã dự án, mã dự án không tồn tại, giá sai, dạng phòng lạ", () => {
  const result = parse(
    [project({}), project({})],
    [
      room("101", "KHONG.CO.Q1", 7000000, "Studio"),
      room("102", "499/10.CMT8.Q10", "liên hệ", "Studio"),
      room("103", "499/10.CMT8.Q10", 0, "Studio"),
      room("104", "499/10.CMT8.Q10", 7000000, "4PN"),
      room("", "499/10.CMT8.Q10", 7000000, "Studio"),
      room("105", "499/10.CMT8.Q10", 7000000, "studio"),
    ],
  );

  const errors = issuesOf(result, "error");
  assert.deepEqual(
    errors.map((e) => e.sheet + ":" + e.row + ":" + e.column),
    [
      "DỰ ÁN:3:MÃ DỰ ÁN",
      "MÃ PHÒNG:2:MÃ DỰ ÁN",
      "MÃ PHÒNG:3:GIÁ",
      "MÃ PHÒNG:4:GIÁ",
      "MÃ PHÒNG:5:DẠNG PHÒNG",
      "MÃ PHÒNG:6:MÃ PHÒNG",
    ],
  );
  assert.equal(result.projects.length, 1);
  assert.deepEqual(result.projects[0].rooms.map((r) => r.roomCodes[0]), ["105"]);
});

test("cột LINK HÌNH ẢNH là link Drive thì lưu nguyên, không cảnh báo", () => {
  const link = "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
  const result = parse([project({})], [room("101,201", "499/10.CMT8.Q10", 7000000, "Studio", { image: link })]);
  assert.equal(result.projects[0].rooms[0].imageRef, link);
  assert.equal(result.issues.filter((i) => i.column === "LINK HÌNH ẢNH").length, 0);
});

test("cùng 1 phòng xuất hiện ở 2 dòng thì giữ dòng đầu và cảnh báo", () => {
  const result = parse(
    [project({})],
    [
      room("101,201", "499/10.CMT8.Q10", 7000000, "Studio"),
      room("201,301", "499/10.CMT8.Q10", 8000000, "Studio"),
    ],
  );
  const rooms = result.projects[0].rooms;
  assert.deepEqual(rooms[1].roomCodes, ["301"]);
  assert.ok(issuesOf(result, "warning").some((w) => w.row === 3 && w.message.includes("201")));
});

test("map cột theo tên tiêu đề, không theo vị trí", () => {
  const shuffledHeader = ["GHI CHÚ", "Quận *", " tên đường* ", "SỐ NHÀ*", "MÃ DỰ ÁN*"];
  const result = parseRoHang({
    "DỰ ÁN": [shuffledHeader, ["x", "Phú Nhuận", "Phan Xích Long", 190, null]],
    "MÃ PHÒNG": [ROOM_HEADER, room("101", "190.PXL.QPN", 9000000, "Duplex")],
  });
  assert.equal(issuesOf(result, "error").length, 0);
  assert.equal(result.projects[0].projectCode, "190.PXL.QPN");
  assert.equal(result.projects[0].rooms[0].layout, "duplex");
});

test("thiếu sheet hoặc thiếu cột bắt buộc thì báo lỗi rõ ràng", () => {
  const noSheet = parseRoHang({ "DỰ ÁN": [PROJECT_HEADER] });
  assert.equal(noSheet.issues[0].level, "error");
  assert.equal(noSheet.issues[0].sheet, "MÃ PHÒNG");

  const noColumn = parseRoHang({
    "DỰ ÁN": [["MÃ DỰ ÁN*", "SỐ NHÀ*", "QUẬN*"], ["1.A.Q1", "1", "1"]],
    "MÃ PHÒNG": [ROOM_HEADER],
  });
  assert.ok(noColumn.issues.some((i) => i.level === "error" && i.column === "TÊN ĐƯỜNG"));
  assert.equal(noColumn.projects.length, 0);
});

// ===== Đọc file .xlsx thật =====

test("đọc .xlsx: lấy giá trị đã tính của ô công thức, bỏ dòng trống cuối", async () => {
  const workbook = new ExcelJS.Workbook();
  const projectSheet = workbook.addWorksheet("DỰ ÁN");
  projectSheet.addRow(PROJECT_HEADER);
  projectSheet.addRow(project({}));
  // Công thức kiểu Google Sheets, có sẵn kết quả đã tính
  projectSheet.getCell("A2").value = {
    formula: '__xludf.DUMMYFUNCTION("B2&...")',
    result: "499/10.CMT8.Q10",
  };
  projectSheet.getCell("A50").value = ""; // ô trống ở xa, như vùng định dạng sẵn tới dòng 1000

  const roomSheet = workbook.addWorksheet("MÃ PHÒNG");
  roomSheet.addRow(ROOM_HEADER);
  roomSheet.addRow(room("101,201", "499/10.CMT8.Q10", 7000000, "Studio"));

  const buffer = await workbook.xlsx.writeBuffer();
  const sheets = await readXlsx(Buffer.from(buffer));

  assert.equal(sheets["DỰ ÁN"].length, 2);
  assert.equal(sheets["DỰ ÁN"][1][0], "499/10.CMT8.Q10");

  const result = parseRoHang(sheets);
  assert.equal(issuesOf(result, "error").length, 0);
  assert.equal(result.projects[0].rooms[0].price, 7000000);
});
