import mongoose from "mongoose";
import Room from "../models/Room.js";
import Building from "../models/Building.js";

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
};

const BUILDING_FIELDS =
  "name address roadType hasElevator hasFireSafety petAllowed isNewOpening fees";

export async function listRooms(req, res) {
  const { area, layout, minPrice, maxPrice, hot, newOpening, sort } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 50);

  const filter = { status: { $in: ["available", "upcoming"] } };

  if (layout) filter.layout = layout;
  if (hot === "true") filter.isHot = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const buildingFilter = {};
  if (area) buildingFilter["address.area"] = area;
  if (newOpening === "true") buildingFilter.isNewOpening = true;

  if (Object.keys(buildingFilter).length > 0) {
    const buildings = await Building.find(buildingFilter).select("_id");
    filter.building = { $in: buildings.map((b) => b._id) };
  }

  const [items, total] = await Promise.all([
    Room.find(filter)
      .populate("building", BUILDING_FIELDS)
      .sort(SORTS[sort] || SORTS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Room.countDocuments(filter),
  ]);

  res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
}

export async function getRoom(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json({ code: "INVALID_ID", message: "ID không hợp lệ" });
  }

  const room = await Room.findById(id).populate("building");
  if (!room || room.status === "hidden") {
    return res
      .status(404)
      .json({ code: "ROOM_NOT_FOUND", message: "Không tìm thấy phòng" });
  }

  res.json(room);
}
