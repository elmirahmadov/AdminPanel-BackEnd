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
exports.getAllBadges = getAllBadges;
exports.getBadgeById = getBadgeById;
exports.createBadge = createBadge;
exports.updateBadge = updateBadge;
exports.deleteBadge = deleteBadge;
exports.getUserBadges = getUserBadges;
exports.awardBadgeToUser = awardBadgeToUser;
exports.removeBadgeFromUser = removeBadgeFromUser;
exports.searchBadges = searchBadges;
exports.getBadgeStats = getBadgeStats;
exports.awardBadge = awardBadge;
exports.removeBadge = removeBadge;
const prisma_1 = __importDefault(require("../../../prisma"));
// Tüm rozetleri getir
function getAllBadges(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const badges = yield prisma_1.default.badge.findMany({
            include: {
                userBadges: {
                    include: { user: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(badges);
    });
}
// Rozeti ID ile getir
function getBadgeById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const badge = yield prisma_1.default.badge.findUnique({
            where: { id: Number(id) },
            include: {
                userBadges: {
                    include: { user: true },
                },
            },
        });
        if (!badge)
            return res.status(404).json({ error: "Rozet bulunamadı." });
        res.json(badge);
    });
}
// Rozet oluştur
function createBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, description, iconUrl, color, type, requirement } = req.body;
        try {
            const badge = yield prisma_1.default.badge.create({
                data: {
                    name,
                    description,
                    iconUrl,
                    type,
                    requirement,
                },
            });
            res.status(201).json(badge);
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Rozet güncelle
function updateBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { name, description, iconUrl, color, type, requirement } = req.body;
        try {
            const badge = yield prisma_1.default.badge.update({
                where: { id: Number(id) },
                data: {
                    name,
                    description,
                    iconUrl,
                    type,
                    requirement,
                },
            });
            res.json(badge);
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Rozet sil
function deleteBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.badge.delete({ where: { id: Number(id) } });
            res.json({ message: "Rozet silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcının rozetlerini getir
function getUserBadges(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const userBadges = yield prisma_1.default.userBadge.findMany({
            where: { userId: Number(userId) },
            include: {
                badge: true,
            },
            orderBy: { earnedAt: "desc" },
        });
        res.json(userBadges);
    });
}
// Kullanıcıya rozet ver
function awardBadgeToUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, badgeId } = req.body;
        try {
            const existingBadge = yield prisma_1.default.userBadge.findUnique({
                where: {
                    userId_badgeId: {
                        userId: Number(userId),
                        badgeId: Number(badgeId),
                    },
                },
            });
            if (existingBadge) {
                return res
                    .status(409)
                    .json({ error: "Kullanıcı zaten bu rozete sahip." });
            }
            const userBadge = yield prisma_1.default.userBadge.create({
                data: {
                    userId: Number(userId),
                    badgeId: Number(badgeId),
                    earnedAt: new Date(),
                },
                include: {
                    badge: true,
                    user: true,
                },
            });
            // Kullanıcıya rozet kazandığına dair bildirim gönder
            // await createNotification({
            //   userId: Number(userId),
            //   title: "Yeni Rozet Kazandınız! 🏆",
            //   message: `Tebrikler! "${userBadge.badge.name}" rozetini kazandınız!`,
            //   type: "BADGE",
            //   link: `/user/${userId}/badges`,
            //   data: {
            //     action: "badge_earned",
            //     badgeId: Number(badgeId),
            //     badgeName: userBadge.badge.name,
            //   },
            // });
            res.status(201).json(userBadge);
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet verilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcıdan rozet al
function removeBadgeFromUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, badgeId } = req.params;
        try {
            yield prisma_1.default.userBadge.delete({
                where: {
                    userId_badgeId: {
                        userId: Number(userId),
                        badgeId: Number(badgeId),
                    },
                },
            });
            res.json({ message: "Rozet kaldırıldı." });
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet kaldırılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Rozet arama
function searchBadges(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q, type } = req.query;
        const { page = 1, limit = 20 } = req.query;
        try {
            const where = {};
            if (q && typeof q === "string") {
                where.OR = [
                    { name: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                ];
            }
            if (type && typeof type === "string") {
                where.type = type;
            }
            const badges = yield prisma_1.default.badge.findMany({
                where,
                include: {
                    userBadges: {
                        include: { user: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
            const total = yield prisma_1.default.badge.count({ where });
            res.json({
                badges,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet arama başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Rozet istatistikleri
function getBadgeStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const totalBadges = yield prisma_1.default.badge.count();
            const totalAwards = yield prisma_1.default.userBadge.count();
            const mostPopularBadge = yield prisma_1.default.userBadge.groupBy({
                by: ["badgeId"],
                _count: { badgeId: true },
                orderBy: { _count: { badgeId: "desc" } },
                take: 1,
            });
            res.json({
                totalBadges,
                totalAwards,
                mostPopularBadge: mostPopularBadge[0] || null,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet istatistikleri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Rozet ver
function awardBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, badgeId } = req.body;
        try {
            const existingBadge = yield prisma_1.default.userBadge.findUnique({
                where: {
                    userId_badgeId: {
                        userId: Number(userId),
                        badgeId: Number(badgeId),
                    },
                },
            });
            if (existingBadge) {
                return res.status(409).json({ error: "Kullanıcı zaten bu rozete sahip." });
            }
            const userBadge = yield prisma_1.default.userBadge.create({
                data: {
                    userId: Number(userId),
                    badgeId: Number(badgeId),
                },
                include: {
                    user: true,
                    badge: true,
                },
            });
            res.status(201).json(userBadge);
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet verilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Rozet al
function removeBadge(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, badgeId } = req.body;
        try {
            yield prisma_1.default.userBadge.delete({
                where: {
                    userId_badgeId: {
                        userId: Number(userId),
                        badgeId: Number(badgeId),
                    },
                },
            });
            res.json({ message: "Rozet kaldırıldı." });
        }
        catch (err) {
            res.status(500).json({
                error: "Rozet kaldırılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
