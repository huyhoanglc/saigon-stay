import Building from "../models/Building.js";
import Room from "../models/Room.js";
import Inquiry from "../models/Inquiry.js";

// Đổi kết quả $group thành object dạng { available: 3, rented: 1, ... }
function groupToObject(groups, keys) {
  const result = {};
  for (const key of keys) {
    result[key] = 0;
  }
  for (const item of groups) {
    result[item._id] = item.count;
  }
  return result;
}

// GET /api/admin/stats
export async function getStats(req, res) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const buildingCount = await Building.countDocuments();
  const hotRoomCount = await Room.countDocuments({ isHot: true });

  const roomGroups = await Room.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const inquiryGroups = await Inquiry.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const inquiriesLast7Days = await Inquiry.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  // 5 yêu cầu mới nhất chưa xử lý, hiện ngay ở trang tổng quan
  const latestInquiries = await Inquiry.find({ status: "new" })
    .populate({
      path: "room",
      select: "code building",
      populate: { path: "building", select: "name" },
    })
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    buildingCount: buildingCount,
    hotRoomCount: hotRoomCount,
    roomsByStatus: groupToObject(roomGroups, [
      "available",
      "upcoming",
      "rented",
      "hidden",
    ]),
    inquiriesByStatus: groupToObject(inquiryGroups, [
      "new",
      "contacted",
      "viewed",
      "closed",
    ]),
    inquiriesLast7Days: inquiriesLast7Days,
    latestInquiries: latestInquiries,
  });
}
