"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../controllers/commentController");
const authMiddleware_1 = require("../../../common/middlewares/authMiddleware");
const isAdmin_1 = require("../../../common/middlewares/isAdmin");
const router = (0, express_1.Router)();
// Client-side yorum erişimi (anime ve bölüm yorumları)
router.get("/anime/:animeId", commentController_1.getCommentsByAnime);
router.get("/episode/:episodeId", commentController_1.getCommentsByEpisode);
// Genel yorum endpoint'leri
router.get("/:id", commentController_1.getCommentById);
router.post("/", authMiddleware_1.authenticateToken, commentController_1.createComment);
router.put("/:id", authMiddleware_1.authenticateToken, commentController_1.updateComment);
router.delete("/:id", authMiddleware_1.authenticateToken, commentController_1.deleteComment);
router.post("/:id/report", authMiddleware_1.authenticateToken, commentController_1.reportComment);
// Yorum yönetimi endpoint'leri (admin ve moderatör için)
router.get("/admin/all", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("MODERATOR"), commentController_1.getAllComments);
router.get("/admin/search", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("MODERATOR"), commentController_1.searchComments);
router.post("/:id/moderate", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("MODERATOR"), commentController_1.moderateComment);
router.get("/admin/reports", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("MODERATOR"), commentController_1.getCommentReports);
exports.default = router;
