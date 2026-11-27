import mongoose from "mongoose";
import Building from "../models/Building.js";
import Room from "../models/Room.js";
import {
  fail,
  readString,
  readBoolean,
  readNumber,
  isNumberInRange,
  isIntegerInRange,
  readImages,
} from "../utils/validate.js";
import { deleteUnusedImages, findRemovedImages } from "../utils/cloudinary.js";

// Admin được xem đủ, kể cả các trường ẩn với khách
const HIDDEN_FIELDS = "+address.houseNumber +contact +sourcing";

const ROAD_TYPES = ["street_front", "car_alley", "motorbike_alley"];
const PARKING_TYPES = ["basement", "garage", "none"];
const FEE_KEYS = [
  "electricity",
  "water",
  "wifi",
  "trash",
  "parking",
  "management",
];
const FEE_UNITS = ["kwh", "m3", "person", "room", "vehicle", "month"];
const CONTACT_KEYS = ["ownerName", "ownerPhone", "managerName", "managerPhone"];

// Đọc 1 loại phí. Trả về undefined nếu không có phí này, null nếu dữ liệu sai.
function readFee(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "object") {
    return null;
  }

  if (value.pricing === "state") {
    return { pricing: "state" };
  }

  if (value.pricing === "fixed") {
    const amount = readNumber(value.amount);
    if (amount === null || !isNumberInRange(amount, 0, 1000000000)) {
      return null;
    }
    if (!FEE_UNITS.includes(value.unit)) {
      return null;
    }
    return { pricing: "fixed", amount: amount, unit: value.unit };
  }

  return null;
}

// Kiểm tra và lấy dữ liệu tòa nhà từ body. Trả về { data } hoặc { error }.
function parseBuildingInput(body) {
  const name = readString(body.name);
  if (name === "") {
    return fail("BUILDING_NAME_REQUIRED", "Thiếu tên tòa nhà");
  }
  if (name.length > 150) {
    return fail("BUILDING_NAME_TOO_LONG", "Tên tòa nhà quá dài");
  }

  let addressInput = body.address;
  if (!addressInput || typeof addressInput !== "object") {
    addressInput = {};
  }
  const address = {
    houseNumber: readString(addressInput.houseNumber),
    street: readString(addressInput.street),
    ward: readString(addressInput.ward),
    area: readString(addressInput.area),
  };
  if (
    address.houseNumber === "" ||
    address.street === "" ||
    address.ward === "" ||
    address.area === ""
  ) {
    return fail("ADDRESS_REQUIRED", "Thiếu thông tin địa chỉ");
  }

  // Tọa độ theo GeoJSON: [kinh độ, vĩ độ]
  let lng = null;
  let lat = null;
  if (body.location && Array.isArray(body.location.coordinates)) {
    lng = readNumber(body.location.coordinates[0]);
    lat = readNumber(body.location.coordinates[1]);
  }
  if (
    lng === null ||
    lat === null ||
    !isNumberInRange(lng, -180, 180) ||
    !isNumberInRange(lat, -90, 90)
  ) {
    return fail("LOCATION_INVALID", "Tọa độ không hợp lệ");
  }

  if (!ROAD_TYPES.includes(body.roadType)) {
    return fail("ROAD_TYPE_INVALID", "Loại đường không hợp lệ");
  }

  let parking = "none";
  if (body.parking !== undefined) {
    parking = body.parking;
  }
  if (!PARKING_TYPES.includes(parking)) {
    return fail("PARKING_INVALID", "Loại chỗ để xe không hợp lệ");
  }

  const floors = readNumber(body.floors);
  if (floors !== null && !isIntegerInRange(floors, 1, 100)) {
    return fail("FLOORS_INVALID", "Số tầng không hợp lệ");
  }

  let cleaningPerWeek = readNumber(body.cleaningPerWeek);
  if (cleaningPerWeek === null) {
    cleaningPerWeek = 0;
  }
  if (!isIntegerInRange(cleaningPerWeek, 0, 14)) {
    return fail("CLEANING_INVALID", "Số lần dọn phòng không hợp lệ");
  }

  let feesInput = body.fees;
  if (!feesInput || typeof feesInput !== "object") {
    feesInput = {};
  }
  const fees = {};
  for (const key of FEE_KEYS) {
    const fee = readFee(feesInput[key]);
    if (fee === null) {
      return fail("FEE_INVALID", "Thông tin phí dịch vụ không hợp lệ");
    }
    if (fee !== undefined) {
      fees[key] = fee;
    }
  }

  let contactInput = body.contact;
  if (!contactInput || typeof contactInput !== "object") {
    contactInput = {};
  }
  const contact = {};
  for (const key of CONTACT_KEYS) {
    const value = readString(contactInput[key]);
    if (value.length > 100) {
      return fail("CONTACT_TOO_LONG", "Thông tin liên hệ quá dài");
    }
    contact[key] = value;
  }

  const description = readString(body.description);
  if (description.length > 5000) {
    return fail("DESCRIPTION_TOO_LONG", "Mô tả quá dài");
  }

  const images = readImages(body.images);
  if (images === null) {
    return fail("IMAGES_INVALID", "Danh sách ảnh không hợp lệ");
  }

  let floorsValue = undefined;
  if (floors !== null) {
    floorsValue = floors;
  }

  const data = {
    name: name,
    address: address,
    location: { type: "Point", coordinates: [lng, lat] },
    roadType: body.roadType,
    isDeadEnd: readBoolean(body.isDeadEnd),
    floors: floorsValue,
    hasElevator: readBoolean(body.hasElevator),
    parking: parking,
    hasSecurity: readBoolean(body.hasSecurity),
    hasFireSafety: readBoolean(body.hasFireSafety),
    petAllowed: readBoolean(body.petAllowed),
    cleaningPerWeek: cleaningPerWeek,
    freeHours: readBoolean(body.freeHours),
    isNewOpening: readBoolean(body.isNewOpening),
    fees: fees,
    contact: contact,
    description: description,
    images: images,
  };

  return { data: data };
}

function sendInvalidId(res) {
  return res.status(400).json({ code: "INVALID_ID", message: "ID không hợp lệ" });
}

function sendBuildingNotFound(res) {
  return res
    .status(404)
    .json({ code: "BUILDING_NOT_FOUND", message: "Không tìm thấy tòa nhà" });
}

// GET /api/admin/buildings
export async function listBuildings(req, res) {
  const buildings = await Building.find()
    .select(HIDDEN_FIELDS)
    .sort({ createdAt: -1 });

  // Đếm số phòng của từng tòa trong 1 lần query
  const counts = await Room.aggregate([
    { $group: { _id: "$building", count: { $sum: 1 } } },
  ]);
  const countByBuilding = {};
  for (const item of counts) {
    countByBuilding[String(item._id)] = item.count;
  }

  const items = [];
  for (const building of buildings) {
    const item = building.toObject();
    let roomCount = countByBuilding[String(building._id)];
    if (!roomCount) {
      roomCount = 0;
    }
    item.roomCount = roomCount;
    items.push(item);
  }

  res.json({ items: items });
}

// GET /api/admin/buildings/:id
export async function getBuilding(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return sendInvalidId(res);
  }

  const building = await Building.findById(id).select(HIDDEN_FIELDS);
  if (!building) {
    return sendBuildingNotFound(res);
  }

  res.json(building);
}

// POST /api/admin/buildings
export async function createBuilding(req, res) {
  let body = req.body;
  if (!body) {
    body = {};
  }

  const result = parseBuildingInput(body);
  if (result.error) {
    return res.status(400).json(result.error);
  }

  const building = await Building.create(result.data);
  res.status(201).json({ id: building._id });
}

// PUT /api/admin/buildings/:id
export async function updateBuilding(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return sendInvalidId(res);
  }

  let body = req.body;
  if (!body) {
    body = {};
  }

  const result = parseBuildingInput(body);
  if (result.error) {
    return res.status(400).json(result.error);
  }

  const building = await Building.findById(id).select(HIDDEN_FIELDS);
  if (!building) {
    return sendBuildingNotFound(res);
  }

  // Nhớ danh sách ảnh cũ để biết ảnh nào bị bỏ đi
  const oldImages = building.images.slice();

  building.set(result.data);
  await building.save();

  // Lưu xong mới xoá ảnh trên Cloudinary (nếu lưu lỗi thì ảnh vẫn còn nguyên)
  await deleteUnusedImages(findRemovedImages(oldImages, result.data.images));

  res.json({ id: building._id });
}

// DELETE /api/admin/buildings/:id               → chỉ xoá được tòa không còn phòng
// DELETE /api/admin/buildings/:id?withRooms=1   → xoá luôn mọi phòng của tòa (admin đã xác nhận)
export async function deleteBuilding(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return sendInvalidId(res);
  }

  const building = await Building.findById(id).select("_id");
  if (!building) {
    return sendBuildingNotFound(res);
  }

  // Không có cờ withRooms thì không cho xoá tòa còn phòng, tránh phòng bị "mồ côi"
  const withRooms = req.query.withRooms === "1";
  const roomCount = await Room.countDocuments({ building: id });
  if (roomCount > 0 && !withRooms) {
    return res.status(409).json({
      code: "BUILDING_HAS_ROOMS",
      message: "Tòa nhà vẫn còn phòng, hãy xoá phòng trước",
      roomCount: roomCount,
    });
  }

  // Nhớ ảnh của các phòng trước khi xoá để dọn trên Cloudinary
  let roomImages = [];
  if (roomCount > 0) {
    const rooms = await Room.find({ building: id }).select("images");
    for (const room of rooms) {
      roomImages = roomImages.concat(room.images);
    }
    await Room.deleteMany({ building: id });
  }

  const deleted = await Building.findByIdAndDelete(id);
  if (!deleted) {
    return sendBuildingNotFound(res);
  }

  // Xoá dữ liệu xong mới xoá ảnh (ảnh nào còn chỗ khác dùng thì được giữ lại)
  await deleteUnusedImages(deleted.images.concat(roomImages));

  res.json({ code: "BUILDING_DELETED", deletedRooms: roomCount });
}
