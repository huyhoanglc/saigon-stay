import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    pricing: { type: String, enum: ["fixed", "state"], default: "fixed" },
    amount: {
      type: Number,
      min: 0,
      required: function () {
        return this.pricing === "fixed";
      },
    },
    unit: {
      type: String,
      enum: ["kwh", "m3", "person", "room", "vehicle", "month"],
      required: function () {
        return this.pricing === "fixed";
      },
    },
  },
  { _id: false },
);

const contactSchema = new mongoose.Schema(
  {
    ownerName: String,
    ownerPhone: String,
    managerName: String,
    managerPhone: String,
  },
  { _id: false },
);

// Thông tin nội bộ lấy từ file rổ hàng (Excel), khách không xem được
const sourcingSchema = new mongoose.Schema(
  {
    system: String, // Hệ thống quản lý, vd KIM HOUSING
    policy: String, // Chính sách dự án (văn bản dài, có thể có hoa hồng)
    zaloGroupUrl: String,
    ownerReview: String,
    importedAt: Date,
  },
  { _id: false },
);

const buildingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Mã dự án trong file rổ hàng, vd "499/10.CMT8.Q10". Dùng để nhập lại file không bị tạo trùng.
    projectCode: { type: String, trim: true, unique: true, sparse: true },

    address: {
      houseNumber: { type: String, required: true, select: false },
      street: { type: String, required: true },
      // Tòa nhập từ Excel chưa có phường, admin bổ sung sau
      ward: { type: String, default: "" },
      area: { type: String, required: true, index: true },
    },

    // Tòa nhập từ Excel chưa có tọa độ → không có location (index 2dsphere tự bỏ qua).
    // Không để default, nếu không Mongoose sẽ tạo { type: "Point" } rỗng và MongoDB báo lỗi.
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined },
    },

    roadType: {
      type: String,
      enum: ["street_front", "car_alley", "motorbike_alley"],
    },
    isDeadEnd: { type: Boolean, default: false },

    floors: { type: Number, min: 1 },
    hasElevator: { type: Boolean, default: false },
    parking: {
      type: String,
      enum: ["basement", "garage", "none"],
      default: "garage",
    },
    hasSecurity: { type: Boolean, default: false },
    hasFireSafety: { type: Boolean, default: false },
    petAllowed: { type: Boolean, default: false },
    shortTermRental: { type: Boolean }, // Nhận thuê ngắn hạn theo tháng
    foreignersAllowed: { type: Boolean }, // Nhận người nước ngoài
    cleaningPerWeek: { type: Number, default: 0 },
    freeHours: { type: Boolean, default: true },
    isNewOpening: { type: Boolean, default: false },

    fees: {
      electricity: feeSchema,
      water: feeSchema,
      wifi: feeSchema,
      trash: feeSchema,
      parking: feeSchema,
      management: feeSchema,
    },

    contact: { type: contactSchema, select: false },
    sourcing: { type: sourcingSchema, select: false },

    description: { type: String, default: "" },
    images: [String],
  },
  { timestamps: true },
);

buildingSchema.index({ location: "2dsphere" });

export default mongoose.model("Building", buildingSchema);
