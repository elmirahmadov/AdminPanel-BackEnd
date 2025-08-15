import { Router } from "express";
import {
  getAllSeasons,
  getSeasonsByAnime,
  getSeasonById,
  createSeason,
  updateSeason,
  deleteSeason,
} from "../controllers/seasonController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

router.get("/", getAllSeasons);
router.get("/anime/:id", getSeasonsByAnime);
router.get("/:id", getSeasonById);
router.post("/anime/:id", authenticateToken, isRole("ADMIN"), createSeason);
router.put(
  "/:seasonId/anime/:id",
  authenticateToken,
  isRole("ADMIN"),
  updateSeason
);
router.delete(
  "/:seasonId/anime/:id",
  authenticateToken,
  isRole("ADMIN"),
  deleteSeason
);

export default router;
