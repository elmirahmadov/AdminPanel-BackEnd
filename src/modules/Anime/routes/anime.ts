import { Router } from "express";
import {
  getAllAnimes,
  getAnimeById,
  createAnime,
  updateAnime,
  deleteAnime,
  searchAnimes,
  lookupAnimes,
  rateAnime,
  setFeatured,
  removeFeatured,
  getFeaturedAnimes,
} from "../controllers/animeController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";
import upload from "../../../common/middlewares/uploadMiddleware";

const router = Router();

router.get("/", getAllAnimes);
router.get("/featured", getFeaturedAnimes);
router.get("/search", searchAnimes);
router.get("/lookup", lookupAnimes);
router.get("/:id", getAnimeById);
router.post(
  "/",
  authenticateToken,
  isRole("ADMIN"),
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  createAnime
);
router.put(
  "/:id",
  authenticateToken,
  isRole("ADMIN"),
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  updateAnime
);
router.delete("/:id", authenticateToken, isRole("ADMIN"), deleteAnime);
router.post("/:id/rate", authenticateToken, rateAnime);
router.post(
  "/:id/featured",
  authenticateToken,
  isRole("MODERATOR"),
  setFeatured
);
router.delete(
  "/:id/featured",
  authenticateToken,
  isRole("MODERATOR"),
  removeFeatured
);

export default router;
