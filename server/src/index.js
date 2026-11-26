import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); // đọc body JSON từ request

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Đã kết nối MongoDB");
  app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
} catch (err) {
  console.error("❌ Lỗi kết nối MongoDB:", err.message);
  process.exit(1);
}
