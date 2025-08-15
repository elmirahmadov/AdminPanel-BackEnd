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
exports.getFavorites = getFavorites;
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
exports.checkFavorite = checkFavorite;
exports.getFavoriteStats = getFavoriteStats;
const prisma_1 = __importDefault(require("../../../prisma"));
// Kullanıcının favori animelerini getir
function getFavorites(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        try {
            const favorites = yield prisma_1.default.favorite.findMany({
                where: { userId: Number(userId) },
                include: {
                    anime: true,
                },
                orderBy: { createdAt: "desc" },
            });
            res.json(favorites);
        }
        catch (err) {
            res.status(500).json({
                error: "Favoriler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Anime favorilere ekle
function addFavorite(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        const { animeId } = req.body;
        if (!animeId || isNaN(Number(animeId))) {
            return res.status(400).json({ error: "Geçerli bir animeId gereklidir." });
        }
        try {
            const existingFavorite = yield prisma_1.default.favorite.findFirst({
                where: {
                    userId: Number(userId),
                    animeId: Number(animeId),
                },
            });
            if (existingFavorite) {
                return res.status(409).json({ error: "Zaten favorilerde." });
            }
            const favorite = yield prisma_1.default.favorite.create({
                data: {
                    userId: Number(userId),
                    animeId: Number(animeId),
                },
                include: {
                    anime: true,
                },
            });
            res.status(201).json(favorite);
        }
        catch (err) {
            res.status(500).json({
                error: "Favorilere eklenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Favorilerden çıkar
function removeFavorite(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        const { animeId } = req.body;
        if (!animeId || isNaN(Number(animeId))) {
            return res.status(400).json({ error: "Geçerli bir animeId gereklidir." });
        }
        try {
            const favorite = yield prisma_1.default.favorite.findFirst({
                where: {
                    userId: Number(userId),
                    animeId: Number(animeId),
                },
            });
            if (!favorite) {
                return res.status(404).json({ error: "Favori bulunamadı." });
            }
            yield prisma_1.default.favorite.delete({
                where: { id: favorite.id },
            });
            res.json({ message: "Favorilerden çıkarıldı." });
        }
        catch (err) {
            res.status(500).json({
                error: "Favorilerden çıkarılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Anime favori durumunu kontrol et
function checkFavorite(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        const { animeId } = req.params;
        try {
            const favorite = yield prisma_1.default.favorite.findFirst({
                where: {
                    userId: Number(userId),
                    animeId: Number(animeId),
                },
            });
            res.json({ isFavorite: !!favorite });
        }
        catch (err) {
            res.status(500).json({
                error: "Favori durumu kontrol edilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Favori istatistikleri
function getFavoriteStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            const animeCount = yield prisma_1.default.favorite.count({
                where: {
                    userId: Number(userId),
                    // schema gereği animeId zorunlu olduğundan doğrudan sayılabilir
                },
            });
            res.json({
                totalFavorites: animeCount,
                animeFavorites: animeCount,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Favori istatistikleri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
