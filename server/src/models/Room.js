import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },

    code: { type: String, required: true, trim: true },
    title: { type: String, trim: true, maxlength: 150 },
    floor: { type: Number, min: 0 },

    layout: {
      type: String,
      enum: ["studio", "duplex", "1br", "2br"],
      required: true,
    },
    separateKitchen: { type: Boolean, default: false },
    size: { type: Number, required: true, min: 1 },
    maxOccupants: { type: Number, default: 2 },

    window: {
      type: String,
      enum: ["balcony", "outside", "hallway", "none"],
      default: "outside",
    },
    furniture: {
      type: String,
      enum: ["full", "basic", "empty"],
      default: "full",
    },
    privateWasher: { type: Boolean, default: false },

    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    depositMonths: { type: Number, default: 1 },
    minLeaseMonths: { type: Number, default: 6 },

    commission: { type: Number, select: false },

    status: {
      type: String,
      enum: ["available", "upcoming", "rented", "hidden"],
      default: "available",
    },
    availableFrom: Date,
    isHot: { type: Boolean, default: false },

    images: [String],
  },
  { timestamps: true },
);

roomSchema.index({ building: 1, code: 1 }, { unique: true });
roomSchema.index({ status: 1, price: 1 });

export default mongoose.model("Room", roomSchema);
