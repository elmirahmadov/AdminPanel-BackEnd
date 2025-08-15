import { Router } from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationSettings,
  updateNotificationSettings,
} from "../controllers/notificationController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";

const router = Router();

// Tüm notification route'ları protected
router.use(authenticateToken);

// Notification'ları getir
router.get("/", getUserNotifications);

// Okunmamış notification sayısını getir
router.get("/unread-count", getUnreadCount);

// Notification'ı okundu olarak işaretle
router.put("/:notificationId/read", markAsRead);

// Tüm notification'ları okundu olarak işaretle
router.put("/mark-all-read", markAllAsRead);

// Notification'ı sil
router.delete("/:notificationId", deleteNotification);

// Notification ayarlarını getir
router.get("/settings", getNotificationSettings);

// Notification ayarlarını güncelle
router.put("/settings", updateNotificationSettings);

export default router;
