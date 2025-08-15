"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const forumController_1 = require("../controllers/forumController");
const authMiddleware_1 = require("../../../common/middlewares/authMiddleware");
const isAdmin_1 = require("../../../common/middlewares/isAdmin");
const router = (0, express_1.Router)();
// Kategori
router.get("/categories", forumController_1.getAllForumCategories);
router.get("/categories/:id", forumController_1.getForumCategoryById);
router.post("/categories", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("ADMIN"), forumController_1.createForumCategory);
router.put("/categories/:id", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("ADMIN"), forumController_1.updateForumCategory);
router.delete("/categories/:id", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("ADMIN"), forumController_1.deleteForumCategory);
// Konu
router.get("/categories/:categoryId/topics", forumController_1.getAllForumTopics);
router.post("/topics", authMiddleware_1.authenticateToken, forumController_1.createForumTopic);
router.put("/topics/:id", authMiddleware_1.authenticateToken, forumController_1.updateForumTopic);
router.delete("/topics/:id", authMiddleware_1.authenticateToken, forumController_1.deleteForumTopic);
// Mesaj
router.get("/topics/:topicId/posts", forumController_1.getAllForumPosts);
router.post("/posts", authMiddleware_1.authenticateToken, forumController_1.createForumPost);
router.put("/posts/:id", authMiddleware_1.authenticateToken, forumController_1.updateForumPost);
router.delete("/posts/:id", authMiddleware_1.authenticateToken, forumController_1.deleteForumPost);
exports.default = router;
