import mongoose from "mongoose";
import Inquiry from "../models/Inquiry.js";
import { readPaging } from "../utils/validate.js";

const STATUSES = ["new", "contacted", "viewed", "closed"];

// GET /api/admin/inquiries?status=&page=&limit=
export async function listInquiries(req, res) {
  const query = req.query;
  const paging = readPaging(query, 20, 100);
  const filter = {};

  if (query.status) {
    if (!STATUSES.includes(query.status)) {
      return res.status(400).json({
        code: "INQUIRY_STATUS_INVALID",
        message: "Trạng thái không hợp lệ",
      });
    }
    filter.status = query.status;
  }

  const skip = (paging.page - 1) * paging.limit;

  // Lấy kèm mã phòng và tên tòa nhà để admin biết khách hỏi phòng nào
  const items = await Inquiry.find(filter)
    .populate({
      path: "room",
      select: "code title building",
      populate: { path: "building", select: "name" },
    })
    .sort({ createdAt: -1, _id: -1 })
    .skip(skip)
    .limit(paging.limit);
  const total = await Inquiry.countDocuments(filter);

  res.json({
    items: items,
    total: total,
    page: paging.page,
    totalPages: Math.ceil(total / paging.limit),
  });
}

// PATCH /api/admin/inquiries/:id  → đổi trạng thái xử lý
export async function updateInquiryStatus(req, res) {
  const id = req.params.id;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json({ code: "INVALID_ID", message: "ID không hợp lệ" });
  }

  let status = undefined;
  if (req.body) {
    status = req.body.status;
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({
      code: "INQUIRY_STATUS_INVALID",
      message: "Trạng thái không hợp lệ",
    });
  }

  const inquiry = await Inquiry.findByIdAndUpdate(
    id,
    { status: status },
    { returnDocument: "after" },
  );
  if (!inquiry) {
    return res.status(404).json({
      code: "INQUIRY_NOT_FOUND",
      message: "Không tìm thấy yêu cầu tư vấn",
    });
  }

  res.json({ id: inquiry._id, status: inquiry.status });
}
