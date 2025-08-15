import { Router } from "express";
import {
  getAllEpisodes,
  getEpisodeById,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getEpisodesByAnimeAndSeason,
} from "../controllers/episodeController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

router.get("/", getAllEpisodes);
router.get("/:id", getEpisodeById);
router.get("/anime/:animeId/season/:seasonId", getEpisodesByAnimeAndSeason);
router.post(
  "/anime/:animeId/season/:seasonId",
  authenticateToken,
  isRole("ADMIN"),
  createEpisode
);
router.put("/:id", authenticateToken, isRole("ADMIN"), updateEpisode);
router.delete("/:id", authenticateToken, isRole("ADMIN"), deleteEpisode);

export default router;
