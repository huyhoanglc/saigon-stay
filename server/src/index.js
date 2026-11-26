import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import roomRoutes from "./routes/room.routes.js";
import inquiryRoutes from "./routes/inquiry.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

// Thiếu khoá ký JWT thì dừng luôn, tránh chạy với cấu hình sai
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error("❌ Thiếu JWT_ACCESS_SECRET hoặc JWT_REFRESH_SECRET trong .env");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ["http://localhost:5173"];
if (process.env.CLIENT_URL) {
  const urls = process.env.CLIENT_URL.split(",");
  for (const url of urls) {
    allowedOrigins.push(url.trim());
  }
}

// credentials: true để trình duyệt được gửi cookie đăng nhập kèm request
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/rooms", roomRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

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

  // Trùng giá trị unique (ví dụ 2 request tạo cùng lúc)
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ code: "DUPLICATE_KEY", message: "Dữ liệu đã tồn tại" });
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
export default app;
