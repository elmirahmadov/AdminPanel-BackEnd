import { Router } from "express";
import {
  getAllBadges,
  getBadgeById,
  createBadge,
  updateBadge,
  deleteBadge,
  getUserBadges,
  awardBadge,
  removeBadge,
  getBadgeStats,
} from "../controllers/badgeController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

router.get("/", getAllBadges);
router.get("/:id", getBadgeById);
router.post("/", authenticateToken, isRole("ADMIN"), createBadge);
router.put("/:id", authenticateToken, isRole("ADMIN"), updateBadge);
router.delete("/:id", authenticateToken, isRole("ADMIN"), deleteBadge);
router.get("/user/:userId", getUserBadges);
router.post("/award", authenticateToken, isRole("ADMIN"), awardBadge);
router.delete("/award", authenticateToken, isRole("ADMIN"), removeBadge);
router.get("/stats", getBadgeStats);

export default router;
