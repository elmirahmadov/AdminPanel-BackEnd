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
exports.getCommentById = getCommentById;
exports.getCommentsByAnime = getCommentsByAnime;
exports.getCommentsByEpisode = getCommentsByEpisode;
exports.createComment = createComment;
exports.updateComment = updateComment;
exports.deleteComment = deleteComment;
exports.reportComment = reportComment;
exports.getAllComments = getAllComments;
exports.searchComments = searchComments;
exports.moderateComment = moderateComment;
exports.getCommentReports = getCommentReports;
const prisma_1 = __importDefault(require("../../../prisma"));
// Bildirimler notification.service üstünden yönetiliyor; doğrudan controller export'u yok
// Yorum detayını getir
function getCommentById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const comment = yield prisma_1.default.comment.findUnique({
                where: { id: Number(id) },
                include: {
                    user: true,
                    anime: true,
                    season: true,
                    episode: true,
                    parent: true,
                    replies: {
                        include: {
                            user: true,
                        },
                    },
                    reports: true,
                },
            });
            if (!comment) {
                return res.status(404).json({ error: "Yorum bulunamadı." });
            }
            res.json(comment);
        }
        catch (err) {
            res.status(500).json({
                error: "Yorum getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorumları animeye göre getir
function getCommentsByAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { animeId } = req.params;
            const { page = 1, limit = 20, status = "APPROVED" } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            // Sadece onaylanmış yorumları getir (client-side için)
            const where = {
                animeId: Number(animeId),
                parentId: null, // Sadece ana yorumlar
                status: status === "ALL" ? undefined : status,
            };
            const [comments, total] = yield Promise.all([
                prisma_1.default.comment.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                role: true,
                            },
                        },
                        replies: {
                            where: { status: "APPROVED" }, // Sadece onaylanmış yanıtlar
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        role: true,
                                    },
                                },
                            },
                            orderBy: { createdAt: "asc" },
                        },
                        _count: {
                            select: {
                                replies: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: Number(limit),
                }),
                prisma_1.default.comment.count({ where }),
            ]);
            res.json({
                comments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Anime yorumları getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorumları bölüme göre getir
function getCommentsByEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { episodeId } = req.params;
            const { page = 1, limit = 20, status = "APPROVED" } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            // Sadece onaylanmış yorumları getir (client-side için)
            const where = {
                episodeId: Number(episodeId),
                parentId: null, // Sadece ana yorumlar
                status: status === "ALL" ? undefined : status,
            };
            const [comments, total] = yield Promise.all([
                prisma_1.default.comment.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                role: true,
                            },
                        },
                        replies: {
                            where: { status: "APPROVED" }, // Sadece onaylanmış yanıtlar
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        role: true,
                                    },
                                },
                            },
                            orderBy: { createdAt: "asc" },
                        },
                        _count: {
                            select: {
                                replies: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: Number(limit),
                }),
                prisma_1.default.comment.count({ where }),
            ]);
            res.json({
                comments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Bölüm yorumları getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorum oluştur
function createComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, animeId, seasonId, episodeId, content, parentId, isSpoiler } = req.body;
        try {
            const comment = yield prisma_1.default.comment.create({
                data: {
                    userId,
                    animeId,
                    seasonId,
                    episodeId,
                    content,
                    parentId,
                    isSpoiler: !!isSpoiler,
                },
                include: {
                    user: true,
                    replies: true,
                    anime: true,
                    season: true,
                    episode: true,
                    parent: true,
                },
            });
            // Eğer bu bir yanıtsa, orijinal yorum sahibine bildirim gönder
            if (parentId) {
                const parentComment = yield prisma_1.default.comment.findUnique({
                    where: { id: parentId },
                    include: { user: true },
                });
                if (parentComment && parentComment.userId !== userId) {
                    // Bildirim gönderimi notification servisinden yapılabilir (opsiyonel)
                }
            }
            else {
                // Eğer bu yeni bir yorumsa ve anime sahibi varsa, anime sahibine bildirim gönder
                if (animeId) {
                    const anime = yield prisma_1.default.anime.findUnique({
                        where: { id: animeId },
                        include: { createdBy: true },
                    });
                    if (anime && anime.createdById !== userId) {
                        // Bildirim gönderimi notification servisinden yapılabilir (opsiyonel)
                    }
                }
            }
            res.status(201).json(comment);
        }
        catch (err) {
            res.status(500).json({
                error: "Yorum oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorum güncelle
function updateComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { content, isSpoiler } = req.body;
        try {
            const comment = yield prisma_1.default.comment.update({
                where: { id: Number(id) },
                data: {
                    content,
                    isSpoiler: !!isSpoiler,
                    isEdited: true,
                },
                include: { user: true, replies: true },
            });
            res.json(comment);
        }
        catch (err) {
            res.status(500).json({
                error: "Yorum güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorum sil
function deleteComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.comment.delete({ where: { id: Number(id) } });
            res.json({ message: "Yorum silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Yorum silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorum raporla
function reportComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, commentId, reason, details } = req.body;
        try {
            const report = yield prisma_1.default.report.create({
                data: {
                    type: "COMMENT",
                    status: "PENDING",
                    reason,
                    details,
                    reportedById: userId,
                    commentId,
                },
            });
            res.status(201).json(report);
        }
        catch (err) {
            res.status(500).json({
                error: "Yorum raporlanamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tüm yorumları getir (admin ve moderatör için)
function getAllComments(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { page = 1, limit = 20, status, reported, animeId, userId, } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (status)
                where.status = status;
            if (reported === "true")
                where.reports = { some: {} };
            if (animeId)
                where.animeId = Number(animeId);
            if (userId)
                where.userId = Number(userId);
            const [comments, total] = yield Promise.all([
                prisma_1.default.comment.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                role: true,
                                status: true,
                            },
                        },
                        anime: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        season: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        episode: {
                            select: {
                                id: true,
                                title: true,
                                number: true,
                            },
                        },
                        parent: {
                            select: {
                                id: true,
                                content: true,
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                    },
                                },
                            },
                        },
                        replies: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        role: true,
                                    },
                                },
                            },
                        },
                        reports: {
                            include: {
                                reportedBy: {
                                    select: {
                                        id: true,
                                        username: true,
                                    },
                                },
                            },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: Number(limit),
                }),
                prisma_1.default.comment.count({ where }),
            ]);
            res.json({
                comments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Yorumlar getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorumlarda arama yap (admin ve moderatör için)
function searchComments(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { q, page = 1, limit = 20, status, animeId, userId } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            if (!q) {
                return res.status(400).json({ error: "Arama terimi gerekli." });
            }
            const where = {
                OR: [
                    { content: { contains: String(q), mode: "insensitive" } },
                    { user: { username: { contains: String(q), mode: "insensitive" } } },
                    { anime: { title: { contains: String(q), mode: "insensitive" } } },
                ],
            };
            if (status)
                where.status = status;
            if (animeId)
                where.animeId = Number(animeId);
            if (userId)
                where.userId = Number(userId);
            const [comments, total] = yield Promise.all([
                prisma_1.default.comment.findMany({
                    where,
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                role: true,
                                status: true,
                            },
                        },
                        anime: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        reports: true,
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: Number(limit),
                }),
                prisma_1.default.comment.count({ where }),
            ]);
            res.json({
                comments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
                searchTerm: q,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Yorum araması yapılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorum moderasyonu (admin ve moderatör için)
function moderateComment(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { action, reason, moderationNote } = req.body;
        try {
            let comment;
            switch (action) {
                case "APPROVE":
                    comment = yield prisma_1.default.comment.update({
                        where: { id: Number(id) },
                        data: {
                            status: "APPROVED",
                            moderationNote: moderationNote || null,
                            moderatedAt: new Date(),
                            moderatedBy: req.user.id,
                        },
                    });
                    break;
                case "REJECT":
                    comment = yield prisma_1.default.comment.update({
                        where: { id: Number(id) },
                        data: {
                            status: "REJECTED",
                            moderationNote: moderationNote || null,
                            moderatedAt: new Date(),
                            moderatedBy: req.user.id,
                        },
                    });
                    break;
                case "HIDE":
                    comment = yield prisma_1.default.comment.update({
                        where: { id: Number(id) },
                        data: {
                            status: "HIDDEN",
                            moderationNote: moderationNote || null,
                            moderatedAt: new Date(),
                            moderatedBy: req.user.id,
                        },
                    });
                    break;
                default:
                    return res.status(400).json({ error: "Geçersiz moderasyon aksiyonu." });
            }
            res.json({
                message: `Yorum ${action.toLowerCase()} edildi.`,
                comment,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Yorum moderasyonu yapılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Yorum raporlarını getir (admin ve moderatör için)
function getCommentReports(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = { type: "COMMENT" };
            if (status)
                where.status = status;
            const [reports, total] = yield Promise.all([
                prisma_1.default.report.findMany({
                    where,
                    include: {
                        comment: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        role: true,
                                    },
                                },
                                anime: {
                                    select: {
                                        id: true,
                                        title: true,
                                    },
                                },
                            },
                        },
                        reportedBy: {
                            select: {
                                id: true,
                                username: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: Number(limit),
                }),
                prisma_1.default.report.count({ where }),
            ]);
            res.json({
                reports,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit)),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Yorum raporları getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
