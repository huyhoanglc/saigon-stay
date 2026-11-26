import mongoose from "mongoose";

const inquirySchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    name: { type: String, trim: true, maxlength: 100, default: "" },
    phone: { type: String, required: true, trim: true },
    note: { type: String, trim: true, maxlength: 1000, default: "" },
    staffCode: { type: String, trim: true, maxlength: 20, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted", "viewed", "closed"],
      default: "new",
    },
  },
  { timestamps: true },
);

inquirySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Inquiry", inquirySchema);
