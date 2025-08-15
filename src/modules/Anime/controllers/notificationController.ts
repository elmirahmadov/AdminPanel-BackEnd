import { Request, Response } from "express";
import { getNotificationService } from "../../../notifications/notification.service";
import prisma from "../../../prisma";
import logger from "../../../common/utils/logger";

// Kullanıcının notification'larını getir
export async function getUserNotifications(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { limit = 20, offset = 0 } = req.query;

  if (!userId) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
  }

  try {
    const notificationService = getNotificationService();
    const notifications = await notificationService.getUserNotifications(
      userId,
      Number(limit),
      Number(offset)
    );

    res.json({
      notifications,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: notifications.length,
      },
    });
  } catch (error) {
    logger.error(`Error getting notifications for user ${userId}:`, error);
    res.status(500).json({
      error: "Notification'lar alınamadı.",
      detail: error instanceof Error ? error.message : error,
    });
  }
}

// Notification'ı okundu olarak işaretle
export async function markAsRead(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { notificationId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
  }

  try {
    const notificationService = getNotificationService();
    const notification = await notificationService.markAsRead(
      Number(notificationId),
      userId
    );

    res.json({
      message: "Notification okundu olarak işaretlendi.",
      notification,
    });
  } catch (error) {
    logger.error(
      `Error marking notification as read for user ${userId}:`,
      error
    );
    res.status(500).json({
      error: "Notification işaretlenemedi.",
      detail: error instanceof Error ? error.message : error,
    });
  }
}

// Tüm notification'ları okundu olarak işaretle
export async function markAllAsRead(req: Request, res: Response) {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
  }

  try {
    const notificationService = getNotificationService();
    await notificationService.markAllAsRead(userId);

    res.json({
      message: "Tüm notification'lar okundu olarak işaretlendi.",
    });
  } catch (error) {
    logger.error(
      `Error marking all notifications as read for user ${userId}:`,
      error
    );
    res.status(500).json({
      error: "Notification'lar işaretlenemedi.",
      detail: error instanceof Error ? error.message : error,
    });
  }
}

// Okunmamış notification sayısını getir
export async function getUnreadCount(req: Request, res: Response) {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
  }

  try {
    const notificationService = getNotificationService();
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      unreadCount: count,
    });
  } catch (error) {
    logger.error(`Error getting unread count for user ${userId}:`, error);
    res.status(500).json({
      error: "Okunmamış notification sayısı alınamadı.",
      detail: error instanceof Error ? error.message : error,
    });
  }
}

// Notification'ı sil
export async function deleteNotification(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { notificationId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
  }

  try {
    const notificationService = getNotificationService();
    const notification = await notificationService.deleteNotification(
      Number(notificationId),
      userId
    );

    res.json({
      message: "Notification silindi.",
      notification,
    });
  } catch (error) {
    logger.error(`Error deleting notification for user ${userId}:`, error);
    res.status(500).json({
      error: "Notification silinemedi.",
      detail: error instanceof Error ? error.message : error,
    });
  }
}

// Notification ayarlarını getir
export async function getNotificationSettings(req: Request, res: Response) {
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
  }

  try {
    const settings = await prisma.notificationSetting.findMany({
      where: { userId },
    });

    res.json({ settings });
  } catch (error) {
    logger.error(
      `Error getting notification settings for user ${userId}:`,
      error
    );
    res.status(500).json({
      error: "Notification ayarları alınamadı.",
      detail: error instanceof Error ? error.message : error,
    });
  }
}

// Notification ayarlarını güncelle
export async function updateNotificationSettings(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { settings } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
  }

  try {
    const updatedSettings = [];

    for (const setting of settings) {
      const updatedSetting = await prisma.notificationSetting.upsert({
        where: {
          userId_type: {
            userId,
            type: setting.type,
          },
        },
        update: {
          enabled: setting.enabled,
        },
        create: {
          userId,
          type: setting.type,
          enabled: setting.enabled,
        },
      });

      updatedSettings.push(updatedSetting);
    }

    res.json({
      message: "Notification ayarları güncellendi.",
      settings: updatedSettings,
    });
  } catch (error) {
    logger.error(
      `Error updating notification settings for user ${userId}:`,
      error
    );
    res.status(500).json({
      error: "Notification ayarları güncellenemedi.",
      detail: error instanceof Error ? error.message : error,
    });
  }
}
