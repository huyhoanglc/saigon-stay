import express, { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getStats } from "../controllers/admin.stats.controller.js";
import {
  listBuildings,
  getBuilding,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from "../controllers/admin.building.controller.js";
import {
  listRooms,
  getRoom,
  createRoom,
  updateRoom,
  patchRoom,
  deleteRoom,
} from "../controllers/admin.room.controller.js";
import {
  listInquiries,
  updateInquiryStatus,
} from "../controllers/admin.inquiry.controller.js";
import {
  createUploadSignature,
  cleanupUploads,
} from "../controllers/upload.controller.js";
import { listUsers, updateUser } from "../controllers/admin.user.controller.js";
import { importRoHang } from "../controllers/admin.import.controller.js";
import { listImages, listRoomImages, importImage } from "../controllers/admin.drive.controller.js";

const router = Router();

// Mọi API bên dưới đều bắt buộc đăng nhập và phải là admin
router.use(requireAuth, requireRole("admin"));

router.get("/stats", getStats);

router.get("/buildings", listBuildings);
router.get("/buildings/:id", getBuilding);
router.post("/buildings", createBuilding);
router.put("/buildings/:id", updateBuilding);
router.delete("/buildings/:id", deleteBuilding);

router.get("/rooms", listRooms);
router.get("/rooms/:id", getRoom);
router.post("/rooms", createRoom);
router.put("/rooms/:id", updateRoom);
router.patch("/rooms/:id", patchRoom);
router.delete("/rooms/:id", deleteRoom);

router.get("/inquiries", listInquiries);
router.patch("/inquiries/:id", updateInquiryStatus);

router.get("/users", listUsers);
router.patch("/users/:id", updateUser);

router.post("/uploads/signature", createUploadSignature);
router.post("/uploads/cleanup", cleanupUploads);

// Lấy ảnh từ thư mục Google Drive
router.get("/drive/images", listImages);
router.get("/drive/rooms/:id/images", listRoomImages);
router.post("/drive/images/:id/import", importImage);

// Nhập file Excel rổ hàng. Body là file .xlsx gửi thẳng (không phải JSON).
router.post(
  "/import/rohang",
  express.raw({ type: "application/octet-stream", limit: "10mb" }),
  importRoHang,
);

export default router;
