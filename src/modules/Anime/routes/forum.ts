import { Router } from "express";
import {
  // Forum yönetimi
  createForum,
  updateForum,
  deleteForum,
  getAllForums,
  getAllForumsAdmin,
  searchForums,

  // Forum kategorileri
  getAllForumCategories,

  // Konu yönetimi
  getAllForumTopics,
  getAllForumTopicsAdmin,
  createForumTopic,
  updateForumTopic,
  deleteForumTopic,
  getTopicsByCategory,
  getForumTopic,
  getTopicsByForum,

  // Konu moderasyonu
  pinTopic,
  lockTopic,
  stickyTopic,

  // Yanıt yönetimi
  getAllForumPosts,
  createForumPost,
  updateForumPost,
  deleteForumPost,
  getPostsByTopic,

  // Arama
  searchForum,
} from "../controllers/forumController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

// ===== CLIENT API'LARI (Tüm Kullanıcılar) =====

// Forum görüntüleme
router.get("/", getAllForums); // Forum listesi (sadece aktif olanlar)
router.get("/search", searchForums); // Forum arama
router.get("/categories", getAllForumCategories); // Kategori listesi

// Konu işlemleri
router.get("/categories/:categoryId/topics", getTopicsByCategory); // Kategoriye ait konular
router.get("/topics", getAllForumTopics); // Tüm konular
router.post("/topics", authenticateToken, createForumTopic); // Konu oluştur
router.put("/topics/:id", authenticateToken, updateForumTopic); // Konu güncelle (kendi konusu)

// Yanıt işlemleri
router.get("/topics/:topicId/posts", getPostsByTopic); // Konudaki yanıtlar
router.get("/posts", getAllForumPosts); // Tüm yanıtlar
router.post("/posts", authenticateToken, createForumPost); // Yanıt oluştur
router.put("/posts/:id", authenticateToken, updateForumPost); // Yanıt güncelle (kendi yanıtı)

// ===== ADMIN PANEL API'LARI (Sadece Admin/Moderatör) =====

// Admin forum yönetimi
router.get("/admin", authenticateToken, isRole("ADMIN"), getAllForumsAdmin); // Tüm forumları getir (aktif + pasif)
router.post("/admin", authenticateToken, isRole("ADMIN"), createForum); // Forum oluştur
router.put("/admin/:id", authenticateToken, isRole("ADMIN"), updateForum); // Forum güncelle
router.delete("/admin/:id", authenticateToken, isRole("ADMIN"), deleteForum); // Forum sil

// Admin konu yönetimi
router.post(
  "/admin/topics",
  authenticateToken,
  isRole("MODERATOR"),
  createForumTopic
); // Konu oluştur (admin için)
router.get(
  "/admin/topics",
  authenticateToken,
  isRole("MODERATOR"),
  getAllForumTopicsAdmin
); // Tüm konuları getir (admin için)
router.get(
  "/admin/topics/:id",
  authenticateToken,
  isRole("MODERATOR"),
  getForumTopic
); // Belirli konuyu getir
router.put(
  "/admin/topics/:id",
  authenticateToken,
  isRole("MODERATOR"),
  updateForumTopic
); // Konu güncelle (admin için)
router.delete(
  "/admin/topics/:id",
  authenticateToken,
  isRole("MODERATOR"),
  deleteForumTopic
); // Konu sil

// Belirli forumun konularını getir
router.get(
  "/admin/:forumId/topics",
  authenticateToken,
  isRole("MODERATOR"),
  getTopicsByForum
); // Belirli forumun konularını getir

// Admin konu moderasyonu
router.patch(
  "/admin/topics/:id/pin",
  authenticateToken,
  isRole("MODERATOR"),
  pinTopic
); // Konu sabitle/kaldır
router.patch(
  "/admin/topics/:id/lock",
  authenticateToken,
  isRole("MODERATOR"),
  lockTopic
); // Konu kilitle/aç
router.patch(
  "/admin/topics/:id/sticky",
  authenticateToken,
  isRole("MODERATOR"),
  stickyTopic
); // Konu yapışkan yap/kaldır

// Admin içerik moderasyonu
router.delete(
  "/admin/posts/:id",
  authenticateToken,
  isRole("MODERATOR"),
  deleteForumPost
); // Yanıt sil

export default router;
