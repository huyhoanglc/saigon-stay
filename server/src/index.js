import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import roomRoutes from "./routes/room.routes.js";
import inquiryRoutes from "./routes/inquiry.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/rooms", roomRoutes);
app.use("/api/inquiries", inquiryRoutes);

// Không có route nào khớp
app.use((req, res) => {
  res.status(404).json({ code: "NOT_FOUND", message: "Không tìm thấy API" });
});

// Bắt mọi lỗi chưa được xử lý
app.use((err, req, res, next) => {
  console.error(err);

  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ code: "INVALID_JSON", message: "Dữ liệu gửi lên sai định dạng" });
  }

  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ code: "VALIDATION_ERROR", message: err.message });
  }

  res.status(500).json({ code: "UNKNOWN", message: "Lỗi server" });
});

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Đã kết nối MongoDB");
  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("❌ Lỗi kết nối MongoDB:", err.message);
  process.exit(1);
}
