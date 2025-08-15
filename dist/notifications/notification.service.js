"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
exports.initializeNotificationService = initializeNotificationService;
exports.getNotificationService = getNotificationService;
const prisma_1 = __importDefault(require("../prisma"));
const logger_1 = __importDefault(require("../common/utils/logger"));
class NotificationService {
    // Kullanıcıya notification gönder
    sendNotification(notificationData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Veritabanına notification kaydet
                const notification = yield prisma_1.default.notification.create({
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
                logger_1.default.info(`Notification sent to user ${notificationData.userId}: ${notificationData.title}`);
                return notification;
            }
            catch (error) {
                logger_1.default.error("Error sending notification:", error);
                throw error;
            }
        });
    }
    // Toplu notification gönder
    sendBulkNotifications(notifications) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = [];
            for (const notification of notifications) {
                try {
                    const result = yield this.sendNotification(notification);
                    results.push(result);
                }
                catch (error) {
                    logger_1.default.error(`Error sending bulk notification to user ${notification.userId}:`, error);
                    results.push(null);
                }
            }
            return results;
        });
    }
    // Sistem notification'ı gönder (tüm kullanıcılara)
    sendSystemNotification(title, message, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Tüm aktif kullanıcıları al
                const users = yield prisma_1.default.user.findMany({
                    where: { status: "ACTIVE" },
                    select: { id: true },
                });
                const notifications = users.map((user) => ({
                    type: "SYSTEM",
                    title,
                    message,
                    userId: user.id,
                    data,
                }));
                const results = yield this.sendBulkNotifications(notifications);
                logger_1.default.info(`System notification sent to ${results.length} users`);
                return results;
            }
            catch (error) {
                logger_1.default.error("Error sending system notification:", error);
                throw error;
            }
        });
    }
    // Kullanıcının notification'larını getir
    getUserNotifications(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 20, offset = 0) {
            try {
                const notifications = yield prisma_1.default.notification.findMany({
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
            }
            catch (error) {
                logger_1.default.error(`Error getting notifications for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // Notification'ı okundu olarak işaretle
    markAsRead(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield prisma_1.default.notification.update({
                    where: {
                        id: notificationId,
                        userId: userId,
                    },
                    data: { isRead: true },
                });
                return notification;
            }
            catch (error) {
                logger_1.default.error(`Error marking notification as read for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // Tüm notification'ları okundu olarak işaretle
    markAllAsRead(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield prisma_1.default.notification.updateMany({
                    where: {
                        userId: userId,
                        isRead: false,
                    },
                    data: { isRead: true },
                });
                logger_1.default.info(`All notifications marked as read for user ${userId}`);
            }
            catch (error) {
                logger_1.default.error(`Error marking all notifications as read for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // Okunmamış notification sayısını getir
    getUnreadCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield prisma_1.default.notification.count({
                    where: {
                        userId: userId,
                        isRead: false,
                    },
                });
                return count;
            }
            catch (error) {
                logger_1.default.error(`Error getting unread count for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // Notification'ı sil
    deleteNotification(notificationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield prisma_1.default.notification.delete({
                    where: {
                        id: notificationId,
                        userId: userId,
                    },
                });
                return notification;
            }
            catch (error) {
                logger_1.default.error(`Error deleting notification for user ${userId}:`, error);
                throw error;
            }
        });
    }
    // Yorum notification'ı gönder
    sendCommentNotification(commentId, animeId, commenterId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Anime'yi bul
                const anime = yield prisma_1.default.anime.findUnique({
                    where: { id: animeId },
                    select: { id: true, title: true },
                });
                if (!anime) {
                    throw new Error("Anime not found");
                }
                // Yorumu bul
                const comment = yield prisma_1.default.comment.findUnique({
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
                const notification = yield this.sendNotification({
                    type: "COMMENT",
                    title: "Yeni Yorum",
                    message: `${comment.user.username} anime'nizde yorum yaptı: "${comment.content.substring(0, 50)}..."`,
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
            }
            catch (error) {
                logger_1.default.error("Error sending comment notification:", error);
                throw error;
            }
        });
    }
    // Badge notification'ı gönder
    sendBadgeNotification(userId, badgeId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const badge = yield prisma_1.default.badge.findUnique({
                    where: { id: badgeId },
                });
                if (!badge) {
                    throw new Error("Badge not found");
                }
                const notification = yield this.sendNotification({
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
            }
            catch (error) {
                logger_1.default.error("Error sending badge notification:", error);
                throw error;
            }
        });
    }
    // Task completion notification'ı gönder
    sendTaskCompletionNotification(userId, taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const task = yield prisma_1.default.task.findUnique({
                    where: { id: taskId },
                });
                if (!task) {
                    throw new Error("Task not found");
                }
                const notification = yield this.sendNotification({
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
            }
            catch (error) {
                logger_1.default.error("Error sending task completion notification:", error);
                throw error;
            }
        });
    }
}
exports.NotificationService = NotificationService;
// Singleton instance
let notificationService = null;
function initializeNotificationService() {
    if (!notificationService) {
        notificationService = new NotificationService();
    }
    return notificationService;
}
function getNotificationService() {
    if (!notificationService) {
        notificationService = new NotificationService();
    }
    return notificationService;
}
