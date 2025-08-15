import { Router } from "express";
import {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  // reportComment, // Rapor sistemini kaldır
  // Yorum yönetimi import'ları
  searchComments,
  moderateComment,
  // getCommentReports, // Rapor sistemini kaldır
  // Client-side yorum erişimi için
  getCommentsByAnime,
  getCommentsByEpisode,
} from "../controllers/commentController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

// Client-side yorum erişimi (anime ve bölüm yorumları)
router.get("/", getAllComments); // Tüm yorumları getir (genel erişim)
router.get("/anime/:animeId", getCommentsByAnime);
router.get("/episode/:episodeId", getCommentsByEpisode);

// Genel yorum endpoint'leri
router.get("/:id", getCommentById);
router.post("/", authenticateToken, createComment);
router.put("/:id", authenticateToken, updateComment);
router.delete("/:id", authenticateToken, deleteComment);

// Yorum yönetimi endpoint'leri (admin ve moderatör için)
router.get(
  "/admin/all",
  authenticateToken,
  isRole("MODERATOR"),
  getAllComments
);
router.get(
  "/admin/search",
  authenticateToken,
  isRole("MODERATOR"),
  searchComments
);
router.post(
  "/:id/moderate",
  authenticateToken,
  isRole("MODERATOR"),
  moderateComment
);

export default router;
