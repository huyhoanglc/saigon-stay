import mongoose from "mongoose";
import Room from "../models/Room.js";
import Building from "../models/Building.js";

export async function listRooms(req, res) {
  const { area, layout, minPrice, maxPrice } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 12, 50);

  const filter = { status: { $in: ["available", "upcoming"] } };

  if (layout) filter.layout = layout;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (area) {
    const buildings = await Building.find({ "address.area": area }).select(
      "_id",
    );
    filter.building = { $in: buildings.map((b) => b._id) };
  }

  const [items, total] = await Promise.all([
    Room.find(filter)
      .populate(
        "building",
        "name address location roadType hasElevator petAllowed",
      )
      .sort({ price: 1 })
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
