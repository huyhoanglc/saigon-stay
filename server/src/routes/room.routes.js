import { Router } from "express";
import { listRooms, getRoom } from "../controllers/room.controller.js";

const router = Router();

router.get("/", listRooms);
router.get("/:id", getRoom);

export default router;
