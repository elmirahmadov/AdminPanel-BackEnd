"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const authMiddleware_1 = require("../../../common/middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Tüm notification route'ları protected
router.use(authMiddleware_1.authenticateToken);
// Notification'ları getir
router.get("/", notificationController_1.getUserNotifications);
// Okunmamış notification sayısını getir
router.get("/unread-count", notificationController_1.getUnreadCount);
// Notification'ı okundu olarak işaretle
router.put("/:notificationId/read", notificationController_1.markAsRead);
// Tüm notification'ları okundu olarak işaretle
router.put("/mark-all-read", notificationController_1.markAllAsRead);
// Notification'ı sil
router.delete("/:notificationId", notificationController_1.deleteNotification);
// Notification ayarlarını getir
router.get("/settings", notificationController_1.getNotificationSettings);
// Notification ayarlarını güncelle
router.put("/settings", notificationController_1.updateNotificationSettings);
exports.default = router;
