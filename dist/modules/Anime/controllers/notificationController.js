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
exports.getUserNotifications = getUserNotifications;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.getUnreadCount = getUnreadCount;
exports.deleteNotification = deleteNotification;
exports.getNotificationSettings = getNotificationSettings;
exports.updateNotificationSettings = updateNotificationSettings;
const notification_service_1 = require("../../../notifications/notification.service");
const prisma_1 = __importDefault(require("../../../prisma"));
const logger_1 = __importDefault(require("../../../common/utils/logger"));
// Kullanıcının notification'larını getir
function getUserNotifications(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { limit = 20, offset = 0 } = req.query;
        if (!userId) {
            return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
        }
        try {
            const notificationService = (0, notification_service_1.getNotificationService)();
            const notifications = yield notificationService.getUserNotifications(userId, Number(limit), Number(offset));
            res.json({
                notifications,
                pagination: {
                    limit: Number(limit),
                    offset: Number(offset),
                    total: notifications.length,
                },
            });
        }
        catch (error) {
            logger_1.default.error(`Error getting notifications for user ${userId}:`, error);
            res.status(500).json({
                error: "Notification'lar alınamadı.",
                detail: error instanceof Error ? error.message : error,
            });
        }
    });
}
// Notification'ı okundu olarak işaretle
function markAsRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { notificationId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
        }
        try {
            const notificationService = (0, notification_service_1.getNotificationService)();
            const notification = yield notificationService.markAsRead(Number(notificationId), userId);
            res.json({
                message: "Notification okundu olarak işaretlendi.",
                notification,
            });
        }
        catch (error) {
            logger_1.default.error(`Error marking notification as read for user ${userId}:`, error);
            res.status(500).json({
                error: "Notification işaretlenemedi.",
                detail: error instanceof Error ? error.message : error,
            });
        }
    });
}
// Tüm notification'ları okundu olarak işaretle
function markAllAsRead(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
        }
        try {
            const notificationService = (0, notification_service_1.getNotificationService)();
            yield notificationService.markAllAsRead(userId);
            res.json({
                message: "Tüm notification'lar okundu olarak işaretlendi.",
            });
        }
        catch (error) {
            logger_1.default.error(`Error marking all notifications as read for user ${userId}:`, error);
            res.status(500).json({
                error: "Notification'lar işaretlenemedi.",
                detail: error instanceof Error ? error.message : error,
            });
        }
    });
}
// Okunmamış notification sayısını getir
function getUnreadCount(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
        }
        try {
            const notificationService = (0, notification_service_1.getNotificationService)();
            const count = yield notificationService.getUnreadCount(userId);
            res.json({
                unreadCount: count,
            });
        }
        catch (error) {
            logger_1.default.error(`Error getting unread count for user ${userId}:`, error);
            res.status(500).json({
                error: "Okunmamış notification sayısı alınamadı.",
                detail: error instanceof Error ? error.message : error,
            });
        }
    });
}
// Notification'ı sil
function deleteNotification(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { notificationId } = req.params;
        if (!userId) {
            return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
        }
        try {
            const notificationService = (0, notification_service_1.getNotificationService)();
            const notification = yield notificationService.deleteNotification(Number(notificationId), userId);
            res.json({
                message: "Notification silindi.",
                notification,
            });
        }
        catch (error) {
            logger_1.default.error(`Error deleting notification for user ${userId}:`, error);
            res.status(500).json({
                error: "Notification silinemedi.",
                detail: error instanceof Error ? error.message : error,
            });
        }
    });
}
// Notification ayarlarını getir
function getNotificationSettings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
        }
        try {
            const settings = yield prisma_1.default.notificationSetting.findMany({
                where: { userId },
            });
            res.json({ settings });
        }
        catch (error) {
            logger_1.default.error(`Error getting notification settings for user ${userId}:`, error);
            res.status(500).json({
                error: "Notification ayarları alınamadı.",
                detail: error instanceof Error ? error.message : error,
            });
        }
    });
}
// Notification ayarlarını güncelle
function updateNotificationSettings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { settings } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
        }
        try {
            const updatedSettings = [];
            for (const setting of settings) {
                const updatedSetting = yield prisma_1.default.notificationSetting.upsert({
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
        }
        catch (error) {
            logger_1.default.error(`Error updating notification settings for user ${userId}:`, error);
            res.status(500).json({
                error: "Notification ayarları güncellenemedi.",
                detail: error instanceof Error ? error.message : error,
            });
        }
    });
}
