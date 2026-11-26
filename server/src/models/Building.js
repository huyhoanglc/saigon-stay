import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    // 'fixed' = giá cố định, 'state' = giá nhà nước
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

const buildingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    address: {
      houseNumber: { type: String, required: true, select: false },
      street: { type: String, required: true },
      ward: { type: String, required: true },
      area: { type: String, required: true, index: true },
    },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },

    roadType: {
      type: String,
      enum: ["street_front", "car_alley", "motorbike_alley"],
      required: true,
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
    petAllowed: { type: Boolean, default: false },
    cleaningPerWeek: { type: Number, default: 0 },
    freeHours: { type: Boolean, default: true },

    fees: {
      electricity: feeSchema,
      water: feeSchema,
      wifi: feeSchema,
      trash: feeSchema,
      parking: feeSchema,
      management: feeSchema,
    },

    contact: { type: contactSchema, select: false },

    description: { type: String, default: "" },
    images: [String],
  },
  { timestamps: true },
);

buildingSchema.index({ location: "2dsphere" });

export default mongoose.model("Building", buildingSchema);
