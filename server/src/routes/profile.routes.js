import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  updateProfile,
  changePassword,
  unlinkProvider,
  createAvatarSignature,
} from "../controllers/profile.controller.js";

const router = Router();

// Mọi API trang cá nhân đều cần đăng nhập (vai trò nào cũng được)
router.use(requireAuth);

router.patch("/", updateProfile);
router.post("/password", changePassword);
router.delete("/providers/:provider", unlinkProvider);
router.post("/avatar-signature", createAvatarSignature);

export default router;
