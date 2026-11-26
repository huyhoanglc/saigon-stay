import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from "../controllers/auth.controller.js";
import { startOAuth, oauthCallback } from "../controllers/oauth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

// Đăng nhập / liên kết bằng Google, Zalo (provider = "google" | "zalo")
router.get("/:provider/start", startOAuth);
router.get("/:provider/callback", oauthCallback);

export default router;
