import mongoose from "mongoose";
import Room from "../models/Room.js";
import Building from "../models/Building.js";
import {
  fail,
  readString,
  readBoolean,
  readNumber,
  isNumberInRange,
  isIntegerInRange,
  readImages,
  escapeRegex,
  readPaging,
} from "../utils/validate.js";
import { deleteUnusedImages, findRemovedImages } from "../utils/cloudinary.js";

const LAYOUTS = ["studio", "duplex", "1br", "2br"];
const WINDOWS = ["balcony", "outside", "hallway", "none"];
const FURNITURES = ["full", "basic", "empty"];
const STATUSES = ["available", "upcoming", "rented", "hidden"];
const MAX_PRICE = 1000000000;

// Admin xem danh sách thì chỉ cần vài trường của tòa nhà
const BUILDING_LIST_FIELDS = "name address.street address.ward address.area";

// Kiểm tra và lấy dữ liệu phòng từ body. Trả về { data } hoặc { error }.
// Chưa kiểm tra tòa nhà có tồn tại không (cần query DB, làm ở controller).
function parseRoomInput(body) {
  if (!mongoose.isValidObjectId(body.building)) {
    return fail("BUILDING_REQUIRED", "Vui lòng chọn tòa nhà");
  }

  const code = readString(body.code);
  if (code === "") {
    return fail("ROOM_CODE_REQUIRED", "Thiếu mã phòng");
  }
  if (code.length > 20) {
    return fail("ROOM_CODE_TOO_LONG", "Mã phòng quá dài");
  }

  const title = readString(body.title);
  if (title.length > 150) {
    return fail("TITLE_TOO_LONG", "Tiêu đề quá dài");
  }

  const description = readString(body.description);
  if (description.length > 5000) {
    return fail("DESCRIPTION_TOO_LONG", "Mô tả quá dài");
  }

  const floor = readNumber(body.floor);
  if (floor !== null && !isIntegerInRange(floor, 0, 100)) {
    return fail("FLOOR_INVALID", "Tầng không hợp lệ");
  }

  if (!LAYOUTS.includes(body.layout)) {
    return fail("LAYOUT_INVALID", "Loại phòng không hợp lệ");
  }

  const size = readNumber(body.size);
  if (size === null || !isNumberInRange(size, 1, 1000)) {
    return fail("SIZE_INVALID", "Diện tích không hợp lệ");
  }

  let maxOccupants = readNumber(body.maxOccupants);
  if (maxOccupants === null) {
    maxOccupants = 2;
  }
  if (!isIntegerInRange(maxOccupants, 1, 20)) {
    return fail("OCCUPANTS_INVALID", "Số người ở không hợp lệ");
  }

  let windowType = "outside";
  if (body.window !== undefined) {
    windowType = body.window;
  }
  if (!WINDOWS.includes(windowType)) {
    return fail("WINDOW_INVALID", "Loại cửa sổ không hợp lệ");
  }

  let furniture = "full";
  if (body.furniture !== undefined) {
    furniture = body.furniture;
  }
  if (!FURNITURES.includes(furniture)) {
    return fail("FURNITURE_INVALID", "Loại nội thất không hợp lệ");
  }

  const price = readNumber(body.price);
  if (price === null || !isNumberInRange(price, 0, MAX_PRICE)) {
    return fail("PRICE_INVALID", "Giá thuê không hợp lệ");
  }

  const originalPrice = readNumber(body.originalPrice);
  if (originalPrice !== null && !isNumberInRange(originalPrice, 0, MAX_PRICE)) {
    return fail("ORIGINAL_PRICE_INVALID", "Giá gốc không hợp lệ");
  }

  let depositMonths = readNumber(body.depositMonths);
  if (depositMonths === null) {
    depositMonths = 1;
  }
  if (!isNumberInRange(depositMonths, 0, 12)) {
    return fail("DEPOSIT_INVALID", "Số tháng cọc không hợp lệ");
  }

  let minLeaseMonths = readNumber(body.minLeaseMonths);
  if (minLeaseMonths === null) {
    minLeaseMonths = 6;
  }
  if (!isIntegerInRange(minLeaseMonths, 0, 60)) {
    return fail("MIN_LEASE_INVALID", "Thời hạn hợp đồng không hợp lệ");
  }

  const commission = readNumber(body.commission);
  if (commission !== null && !isNumberInRange(commission, 0, MAX_PRICE)) {
    return fail("COMMISSION_INVALID", "Hoa hồng không hợp lệ");
  }

  let status = "available";
  if (body.status !== undefined) {
    status = body.status;
  }
  if (!STATUSES.includes(status)) {
    return fail("STATUS_INVALID", "Trạng thái không hợp lệ");
  }

  // Ngày trống phòng: để trống thì bỏ qua, có nhập thì phải là ngày hợp lệ
  let availableFrom = undefined;
  if (body.availableFrom) {
    const date = new Date(body.availableFrom);
    if (Number.isNaN(date.getTime())) {
      return fail("DATE_INVALID", "Ngày không hợp lệ");
    }
    availableFrom = date;
  }

  const images = readImages(body.images);
  if (images === null) {
    return fail("IMAGES_INVALID", "Danh sách ảnh không hợp lệ");
  }

  // Ô số để trống thì lưu undefined để Mongoose xoá trường đó khi cập nhật
  let floorValue = undefined;
  if (floor !== null) {
    floorValue = floor;
  }
  let originalPriceValue = undefined;
  if (originalPrice !== null) {
    originalPriceValue = originalPrice;
  }
  let commissionValue = undefined;
  if (commission !== null) {
    commissionValue = commission;
  }

  const data = {
    building: body.building,
    code: code,
    title: title,
    description: description,
    floor: floorValue,
    layout: body.layout,
    separateKitchen: readBoolean(body.separateKitchen),
    size: size,
    maxOccupants: maxOccupants,
    window: windowType,
    furniture: furniture,
    privateWasher: readBoolean(body.privateWasher),
    price: price,
    originalPrice: originalPriceValue,
    depositMonths: depositMonths,
    minLeaseMonths: minLeaseMonths,
    commission: commissionValue,
    status: status,
    availableFrom: availableFrom,
    isHot: readBoolean(body.isHot),
    images: images,
  };

  return { data: data };
}

// Kiểm tra tòa nhà có tồn tại và mã phòng chưa bị dùng trong tòa đó.
// excludeRoomId: khi sửa phòng thì bỏ qua chính phòng đang sửa.
async function checkRoomConflicts(data, excludeRoomId) {
  const buildingExists = await Building.exists({ _id: data.building });
  if (!buildingExists) {
    return fail("BUILDING_NOT_FOUND", "Không tìm thấy tòa nhà");
  }

  const filter = { building: data.building, code: data.code };
  if (excludeRoomId) {
    filter._id = { $ne: excludeRoomId };
  }
  const duplicate = await Room.exists(filter);
  if (duplicate) {
    return fail("ROOM_CODE_EXISTS", "Mã phòng đã tồn tại trong tòa nhà này");
  }

  return null;
}

function sendInvalidId(res) {
  return res.status(400).json({ code: "INVALID_ID", message: "ID không hợp lệ" });
}

function sendRoomNotFound(res) {
  return res
    .status(404)
    .json({ code: "ROOM_NOT_FOUND", message: "Không tìm thấy phòng" });
}

// GET /api/admin/rooms?building=&status=&q=&hot=true&page=&limit=
export async function listRooms(req, res) {
  const query = req.query;
  const paging = readPaging(query, 20, 100);
  const filter = {};

  if (query.building) {
    if (!mongoose.isValidObjectId(query.building)) {
      return sendInvalidId(res);
    }
    filter.building = query.building;
  }

  if (query.status) {
    if (!STATUSES.includes(query.status)) {
      return res
        .status(400)
        .json({ code: "STATUS_INVALID", message: "Trạng thái không hợp lệ" });
    }
    filter.status = query.status;
  }

  if (query.hot === "true") {
    filter.isHot = true;
  }

  // Tìm theo mã phòng hoặc tiêu đề, không phân biệt hoa thường
  const keyword = readString(query.q);
  if (keyword !== "") {
    const pattern = new RegExp(escapeRegex(keyword), "i");
    filter.$or = [{ code: pattern }, { title: pattern }];
  }

  const skip = (paging.page - 1) * paging.limit;

  const items = await Room.find(filter)
    .select("+commission")
    .populate("building", BUILDING_LIST_FIELDS)
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(paging.limit);
  const total = await Room.countDocuments(filter);

  res.json({
    items: items,
    total: total,
    page: paging.page,
    totalPages: Math.ceil(total / paging.limit),
  });
}

// GET /api/admin/rooms/:id
export async function getRoom(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return sendInvalidId(res);
  }

  const room = await Room.findById(id).select("+commission");
  if (!room) {
    return sendRoomNotFound(res);
  }

  res.json(room);
}

// POST /api/admin/rooms
export async function createRoom(req, res) {
  let body = req.body;
  if (!body) {
    body = {};
  }

  const result = parseRoomInput(body);
  if (result.error) {
    return res.status(400).json(result.error);
  }

  const conflict = await checkRoomConflicts(result.data, null);
  if (conflict) {
    let status = 409;
    if (conflict.error.code === "BUILDING_NOT_FOUND") {
      status = 404;
    }
    return res.status(status).json(conflict.error);
  }

  const room = await Room.create(result.data);
  res.status(201).json({ id: room._id });
}

// PUT /api/admin/rooms/:id
export async function updateRoom(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return sendInvalidId(res);
  }

  let body = req.body;
  if (!body) {
    body = {};
  }

  const result = parseRoomInput(body);
  if (result.error) {
    return res.status(400).json(result.error);
  }

  const room = await Room.findById(id).select("+commission");
  if (!room) {
    return sendRoomNotFound(res);
  }

  const conflict = await checkRoomConflicts(result.data, id);
  if (conflict) {
    let status = 409;
    if (conflict.error.code === "BUILDING_NOT_FOUND") {
      status = 404;
    }
    return res.status(status).json(conflict.error);
  }

  // Nhớ danh sách ảnh cũ để biết ảnh nào bị bỏ đi
  const oldImages = room.images.slice();

  room.set(result.data);
  await room.save();

  // Lưu xong mới xoá ảnh trên Cloudinary (nếu lưu lỗi thì ảnh vẫn còn nguyên)
  await deleteUnusedImages(findRemovedImages(oldImages, result.data.images));

  res.json({ id: room._id });
}

// PATCH /api/admin/rooms/:id  → đổi nhanh trạng thái hoặc bật/tắt Hot từ danh sách
export async function patchRoom(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return sendInvalidId(res);
  }

  let body = req.body;
  if (!body) {
    body = {};
  }

  const changes = {};

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return res
        .status(400)
        .json({ code: "STATUS_INVALID", message: "Trạng thái không hợp lệ" });
    }
    changes.status = body.status;
  }

  if (body.isHot !== undefined) {
    if (typeof body.isHot !== "boolean") {
      return res
        .status(400)
        .json({ code: "VALIDATION_ERROR", message: "isHot phải là true/false" });
    }
    changes.isHot = body.isHot;
  }

  if (Object.keys(changes).length === 0) {
    return res
      .status(400)
      .json({ code: "NOTHING_TO_UPDATE", message: "Không có gì để cập nhật" });
  }

  const room = await Room.findByIdAndUpdate(id, changes, {
    returnDocument: "after",
  });
  if (!room) {
    return sendRoomNotFound(res);
  }

  res.json({ id: room._id, status: room.status, isHot: room.isHot });
}

// DELETE /api/admin/rooms/:id
export async function deleteRoom(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return sendInvalidId(res);
  }

  const deleted = await Room.findByIdAndDelete(id);
  if (!deleted) {
    return sendRoomNotFound(res);
  }

  await deleteUnusedImages(deleted.images);

  res.json({ code: "ROOM_DELETED" });
}
