import { Router } from "express";
import {
  getAllPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
  addAnimeToPeriod,
  removeAnimeFromPeriod,
} from "../controllers/periodController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";
import upload from "../../../common/middlewares/uploadMiddleware";

const router = Router();

// Tüm dönemleri listele
router.get("/", getAllPeriods);

// Belirli dönemi getir
router.get("/:id", getPeriodById);

// Yeni dönem oluştur (Admin/Moderator)
router.post(
  "/",
  authenticateToken,
  isRole("ADMIN"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  createPeriod
);

// Dönem güncelle (Admin/Moderator)
router.put(
  "/:id",
  authenticateToken,
  isRole("ADMIN"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  updatePeriod
);

// Dönem sil (Admin)
router.delete("/:id", authenticateToken, isRole("ADMIN"), deletePeriod);

// Döneme anime ekle (Admin/Moderator)
router.post(
  "/:id/animes/:animeId",
  authenticateToken,
  isRole("MODERATOR"),
  addAnimeToPeriod
);

// Dönemden anime çıkar (Admin/Moderator)
router.delete(
  "/:id/animes/:animeId",
  authenticateToken,
  isRole("MODERATOR"),
  removeAnimeFromPeriod
);

export default router;
