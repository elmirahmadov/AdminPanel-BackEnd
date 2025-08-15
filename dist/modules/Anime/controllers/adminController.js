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
exports.getAllUsers = getAllUsers;
exports.getAllUsersWithOnlineStatus = getAllUsersWithOnlineStatus;
exports.getUserById = getUserById;
exports.updateUserRole = updateUserRole;
exports.toggleUserStatus = toggleUserStatus;
exports.banUser = banUser;
exports.unbanUser = unbanUser;
exports.getAllReports = getAllReports;
exports.updateReportStatus = updateReportStatus;
exports.getAdminStats = getAdminStats;
exports.searchUsers = searchUsers;
const prisma_1 = __importDefault(require("../../../prisma"));
const notification_service_1 = require("../../../notifications/notification.service");
// Tüm kullanıcıları getir (admin) - Sadece online olanları
function getAllUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield prisma_1.default.user.findMany({
                include: {
                    badges: {
                        include: { badge: true },
                    },
                    activities: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                    reports: true,
                    banHistory: {
                        orderBy: { createdAt: "desc" },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            res.json(users);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcılar getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tüm kullanıcıları getir (admin) - Online durumu ile birlikte
function getAllUsersWithOnlineStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const users = yield prisma_1.default.user.findMany({
                include: {
                    badges: {
                        include: { badge: true },
                    },
                    activities: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                    reports: true,
                    banHistory: {
                        orderBy: { createdAt: "desc" },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            // Online durumunu ekle (WebSocket kaldırıldığı için hepsi false)
            const usersWithOnlineStatus = users.map((user) => (Object.assign(Object.assign({}, user), { isOnline: false, lastSeen: user.updatedAt })));
            res.json(usersWithOnlineStatus);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcılar getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı detayını getir (admin)
function getUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const user = yield prisma_1.default.user.findUnique({
                where: { id: Number(id) },
                include: {
                    badges: {
                        include: { badge: true },
                    },
                    activities: {
                        orderBy: { createdAt: "desc" },
                    },
                    reports: true,
                    banHistory: {
                        orderBy: { createdAt: "desc" },
                    },
                    favorites: {
                        include: { anime: true },
                    },
                    watchlist: {
                        include: { anime: true },
                    },
                    ratings: {
                        include: { anime: true },
                    },
                    comments: {
                        include: { anime: true, episode: true },
                    },
                },
            });
            if (!user) {
                return res.status(404).json({ error: "Kullanıcı bulunamadı." });
            }
            res.json(user);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı rolünü güncelle (admin)
function updateUserRole(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const { role } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        try {
            const user = yield prisma_1.default.user.update({
                where: { id: Number(id) },
                data: { role },
                include: {
                    badges: {
                        include: { badge: true },
                    },
                    activities: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                    reports: true,
                    banHistory: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            });
            // Kullanıcıya notification gönder
            const notificationService = (0, notification_service_1.getNotificationService)();
            yield notificationService.sendNotification({
                type: "SYSTEM",
                title: "Rol Güncellendi",
                message: `Rolünüz ${role} olarak güncellendi.`,
                userId: Number(id),
                data: { previousRole: user.role, newRole: role },
            });
            res.json(user);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı rolü güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcıyı devre dışı bırak/etkinleştir (admin)
function toggleUserStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const { status } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        try {
            const user = yield prisma_1.default.user.update({
                where: { id: Number(id) },
                data: { status },
                include: {
                    badges: {
                        include: { badge: true },
                    },
                    activities: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                    reports: true,
                    banHistory: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            });
            // Kullanıcıya notification gönder
            const notificationService = (0, notification_service_1.getNotificationService)();
            yield notificationService.sendNotification({
                type: "SYSTEM",
                title: status === "BANNED"
                    ? "Hesabınız Devre Dışı Bırakıldı"
                    : "Hesabınız Etkinleştirildi",
                message: status === "BANNED"
                    ? "Hesabınız admin tarafından devre dışı bırakıldı."
                    : "Hesabınız admin tarafından etkinleştirildi.",
                userId: Number(id),
                data: {
                    status,
                    updatedBy: adminId,
                },
            });
            res.json(user);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı durumu güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcıyı banla (admin)
function banUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const { reason, duration } = req.body;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        try {
            const user = yield prisma_1.default.user.update({
                where: { id: Number(id) },
                data: {
                    status: "BANNED",
                    banHistory: {
                        create: {
                            reason,
                            bannedById: adminId,
                            expiresAt: duration
                                ? new Date(Date.now() + duration * 60 * 60 * 1000)
                                : null,
                        },
                    },
                },
                include: {
                    badges: {
                        include: { badge: true },
                    },
                    activities: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                    reports: true,
                    banHistory: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            });
            // Kullanıcıya notification gönder
            const notificationService = (0, notification_service_1.getNotificationService)();
            yield notificationService.sendNotification({
                type: "SYSTEM",
                title: "Hesabınız Devre Dışı Bırakıldı",
                message: `Hesabınız ${reason} nedeniyle devre dışı bırakıldı.${duration ? ` Süre: ${duration} saat` : ""}`,
                userId: Number(id),
                data: {
                    reason,
                    duration,
                    bannedBy: adminId,
                },
            });
            res.json(user);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı banlanamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcının banını kaldır (admin)
function unbanUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        try {
            const user = yield prisma_1.default.user.update({
                where: { id: Number(id) },
                data: { status: "ACTIVE" },
                include: {
                    badges: {
                        include: { badge: true },
                    },
                    activities: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                    reports: true,
                    banHistory: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            });
            // Kullanıcıya notification gönder
            const notificationService = (0, notification_service_1.getNotificationService)();
            yield notificationService.sendNotification({
                type: "SYSTEM",
                title: "Hesabınız Etkinleştirildi",
                message: "Hesabınız admin tarafından etkinleştirildi.",
                userId: Number(id),
                data: {
                    unbannedBy: adminId,
                },
            });
            res.json(user);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcının banı kaldırılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tüm raporları getir (admin)
function getAllReports(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const reports = yield prisma_1.default.report.findMany({
                include: {
                    reportedBy: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                    handledBy: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    anime: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    comment: {
                        select: {
                            id: true,
                            content: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    forumPost: {
                        select: {
                            id: true,
                            content: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            res.json(reports);
        }
        catch (err) {
            res.status(500).json({
                error: "Raporlar getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Rapor durumunu güncelle (admin)
function updateReportStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { status, handledById } = req.body;
        try {
            const report = yield prisma_1.default.report.update({
                where: { id: Number(id) },
                data: {
                    status,
                    handledById: Number(handledById),
                    handledAt: new Date(),
                },
                include: {
                    reportedBy: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                    handledBy: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    anime: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    comment: {
                        select: {
                            id: true,
                            content: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    forumPost: {
                        select: {
                            id: true,
                            content: true,
                        },
                    },
                },
            });
            res.json(report);
        }
        catch (err) {
            res.status(500).json({
                error: "Rapor durumu güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Admin istatistiklerini getir - Gerçek zamanlı güncelleme
function getAdminStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const [totalUsers, bannedUsers, totalAnimes, totalComments, totalReports, pendingReports, totalViews,] = yield Promise.all([
                prisma_1.default.user.count(), // Toplam kayıtlı kullanıcı
                prisma_1.default.user.count({ where: { status: "BANNED" } }), // Banlanmış kullanıcılar
                prisma_1.default.anime.count(),
                prisma_1.default.comment.count(),
                prisma_1.default.report.count(),
                prisma_1.default.report.count({ where: { status: "PENDING" } }),
                prisma_1.default.view.count(),
            ]);
            const stats = {
                totalUsers, // Toplam kayıtlı kullanıcı sayısı
                activeUsers: 0, // WebSocket kaldırıldığı için 0
                bannedUsers, // Banlanmış kullanıcılar
                onlineUsers: 0, // WebSocket kaldırıldığı için 0
                totalAnimes,
                totalComments,
                totalReports,
                pendingReports,
                totalViews,
                lastUpdated: new Date(),
            };
            res.json(stats);
        }
        catch (err) {
            res.status(500).json({
                error: "İstatistikler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı arama (admin)
function searchUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { query, role, status } = req.query;
        try {
            const where = {};
            if (query) {
                where.OR = [
                    { username: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                ];
            }
            if (role) {
                where.role = role;
            }
            if (status) {
                where.status = status;
            }
            const users = yield prisma_1.default.user.findMany({
                where,
                include: {
                    badges: {
                        include: { badge: true },
                    },
                    activities: {
                        orderBy: { createdAt: "desc" },
                        take: 5,
                    },
                    reports: true,
                    banHistory: {
                        orderBy: { createdAt: "desc" },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            res.json(users);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı arama başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
