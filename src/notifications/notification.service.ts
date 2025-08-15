import prisma from "../prisma";
import logger from "../common/utils/logger";

export interface NotificationData {
  type: "SYSTEM" | "USER" | "ANIME" | "COMMENT" | "FORUM" | "TASK" | "BADGE";
  title: string;
  message: string;
  userId: number;
  data?: any;
  senderId?: number;
  animeId?: number;
  link?: string;
}

export class NotificationService {
  // Kullanıcıya notification gönder
  async sendNotification(notificationData: NotificationData) {
    try {
      // Veritabanına notification kaydet
      const notification = await prisma.notification.create({
        data: {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          userId: notificationData.userId,
          data: notificationData.data || {},
          senderId: notificationData.senderId || null,
          animeId: notificationData.animeId || null,
          link: notificationData.link || null,
          isRead: false,
        },
      });

      logger.info(
        `Notification sent to user ${notificationData.userId}: ${notificationData.title}`
      );
      return notification;
    } catch (error) {
      logger.error("Error sending notification:", error);
      throw error;
    }
  }

  // Toplu notification gönder
  async sendBulkNotifications(notifications: NotificationData[]) {
    const results = [];
    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification);
        results.push(result);
      } catch (error) {
        logger.error(
          `Error sending bulk notification to user ${notification.userId}:`,
          error
        );
        results.push(null);
      }
    }
    return results;
  }

  // Sistem notification'ı gönder (tüm kullanıcılara)
  async sendSystemNotification(title: string, message: string, data?: any) {
    try {
      // Tüm aktif kullanıcıları al
      const users = await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      const notifications = users.map((user: { id: number }) => ({
        type: "SYSTEM" as const,
        title,
        message,
        userId: user.id,
        data,
      }));

      const results = await this.sendBulkNotifications(notifications);
      logger.info(`System notification sent to ${results.length} users`);
      return results;
    } catch (error) {
      logger.error("Error sending system notification:", error);
      throw error;
    }
  }

  // Kullanıcının notification'larını getir
  async getUserNotifications(
    userId: number,
    limit: number = 20,
    offset: number = 0
  ) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              profileImage: true,
            },
          },
          anime: true,
        },
      });

      return notifications;
    } catch (error) {
      logger.error(`Error getting notifications for user ${userId}:`, error);
      throw error;
    }
  }

  // Notification'ı okundu olarak işaretle
  async markAsRead(notificationId: number, userId: number) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: userId,
        },
        data: { isRead: true },
      });

      return notification;
    } catch (error) {
      logger.error(
        `Error marking notification as read for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  // Tüm notification'ları okundu olarak işaretle
  async markAllAsRead(userId: number) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      logger.info(`All notifications marked as read for user ${userId}`);
    } catch (error) {
      logger.error(
        `Error marking all notifications as read for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  // Okunmamış notification sayısını getir
  async getUnreadCount(userId: number) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      logger.error(`Error getting unread count for user ${userId}:`, error);
      throw error;
    }
  }

  // Notification'ı sil
  async deleteNotification(notificationId: number, userId: number) {
    try {
      const notification = await prisma.notification.delete({
        where: {
          id: notificationId,
          userId: userId,
        },
      });

      return notification;
    } catch (error) {
      logger.error(`Error deleting notification for user ${userId}:`, error);
      throw error;
    }
  }

  // Yorum notification'ı gönder
  async sendCommentNotification(
    commentId: number,
    animeId: number,
    commenterId: number
  ) {
    try {
      // Anime'yi bul
      const anime = await prisma.anime.findUnique({
        where: { id: animeId },
        select: { id: true, title: true },
      });

      if (!anime) {
        throw new Error("Anime not found");
      }

      // Yorumu bul
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: { id: true, username: true },
          },
        },
      });

      if (!comment) {
        throw new Error("Comment not found");
      }

      // Anime sahibine notification gönder
      const notification = await this.sendNotification({
        type: "COMMENT",
        title: "Yeni Yorum",
        message: `${
          comment.user.username
        } anime'nizde yorum yaptı: "${comment.content.substring(0, 50)}..."`,
        userId: anime.id, // FIXME: Burada anime.ownerId gibi bir alan yoksa kullanıcı ID'si geçilmelidir
        data: {
          commentId: commentId,
          animeId: animeId,
          commenterId: commenterId,
        },
        senderId: commenterId,
        animeId: animeId,
        link: `/anime/${animeId}#comment-${commentId}`,
      });

      return notification;
    } catch (error) {
      logger.error("Error sending comment notification:", error);
      throw error;
    }
  }

  // Badge notification'ı gönder
  async sendBadgeNotification(userId: number, badgeId: number) {
    try {
      const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
      });

      if (!badge) {
        throw new Error("Badge not found");
      }

      const notification = await this.sendNotification({
        type: "BADGE",
        title: "Yeni Rozet Kazandınız!",
        message: `"${badge.name}" rozetini kazandınız!`,
        userId: userId,
        data: {
          badgeId: badgeId,
          badgeName: badge.name,
          badgeType: badge.type,
        },
        link: `/profile/badges`,
      });

      return notification;
    } catch (error) {
      logger.error("Error sending badge notification:", error);
      throw error;
    }
  }

  // Task completion notification'ı gönder
  async sendTaskCompletionNotification(userId: number, taskId: number) {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      const notification = await this.sendNotification({
        type: "TASK",
        title: "Görev Tamamlandı!",
        message: `"${task.name}" görevini başarıyla tamamladınız!`,
        userId: userId,
        data: {
          taskId: taskId,
          taskTitle: task.name,
          taskType: task.type,
        },
        link: `/tasks`,
      });

      return notification;
    } catch (error) {
      logger.error("Error sending task completion notification:", error);
      throw error;
    }
  }
}

// Singleton instance
let notificationService: NotificationService | null = null;

export function initializeNotificationService() {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}

export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = new NotificationService();
  }
  return notificationService;
}
