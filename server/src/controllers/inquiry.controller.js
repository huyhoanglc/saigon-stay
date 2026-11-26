import mongoose from "mongoose";
import Inquiry from "../models/Inquiry.js";
import Room from "../models/Room.js";

// Số di động Việt Nam: 0 hoặc +84, sau đó là đầu 3/5/7/8/9 và 8 số
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

// POST /api/inquiries
export async function createInquiry(req, res) {
  let body = req.body;
  if (!body) {
    body = {};
  }

  // Ô ẩn "website": người thật không thấy nên không điền, bot thì hay điền
  if (body.website) {
    return res.status(201).json({ code: "INQUIRY_CREATED" });
  }

  const roomId = body.room;
  if (!mongoose.isValidObjectId(roomId)) {
    return res
      .status(400)
      .json({ code: "INVALID_ID", message: "ID không hợp lệ" });
  }

  // Bỏ dấu cách, dấu chấm, gạch ngang trong số điện thoại
  let phone = "";
  if (typeof body.phone === "string") {
    phone = body.phone.replace(/[\s.-]/g, "");
  }

  if (phone === "") {
    return res
      .status(400)
      .json({ code: "PHONE_REQUIRED", message: "Thiếu số điện thoại" });
  }

  if (!PHONE_REGEX.test(phone)) {
    return res
      .status(400)
      .json({ code: "PHONE_INVALID", message: "Số điện thoại không hợp lệ" });
  }

  let name = "";
  if (typeof body.name === "string") {
    name = body.name.trim();
  }
  if (name.length > 100) {
    return res
      .status(400)
      .json({ code: "NAME_TOO_LONG", message: "Họ tên quá dài" });
  }

  let note = "";
  if (typeof body.note === "string") {
    note = body.note.trim();
  }
  if (note.length > 1000) {
    return res
      .status(400)
      .json({ code: "NOTE_TOO_LONG", message: "Ghi chú quá dài" });
  }

  let staffCode = "";
  if (typeof body.staffCode === "string") {
    staffCode = body.staffCode.trim().slice(0, 20);
  }

  const room = await Room.findById(roomId);
  if (!room || room.status === "hidden") {
    return res
      .status(404)
      .json({ code: "ROOM_NOT_FOUND", message: "Không tìm thấy phòng" });
  }

  const inquiry = await Inquiry.create({
    room: room._id,
    name: name,
    phone: phone,
    note: note,
    staffCode: staffCode,
  });

  res.status(201).json({ code: "INQUIRY_CREATED", id: inquiry._id });
}
