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
exports.getAllAnimes = getAllAnimes;
exports.getAnimeById = getAnimeById;
exports.createAnime = createAnime;
exports.updateAnime = updateAnime;
exports.deleteAnime = deleteAnime;
exports.searchAnimes = searchAnimes;
exports.lookupAnimes = lookupAnimes;
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
exports.addWatchlist = addWatchlist;
exports.removeWatchlist = removeWatchlist;
exports.rateAnime = rateAnime;
exports.setFeatured = setFeatured;
exports.removeFeatured = removeFeatured;
exports.getFeaturedAnimes = getFeaturedAnimes;
const prisma_1 = __importDefault(require("../../../prisma"));
// Tüm animeleri getir
function getAllAnimes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const animes = yield prisma_1.default.anime.findMany({
            orderBy: { createdAt: "desc" },
            include: { categories: true },
        });
        const response = animes.map((anime) => (Object.assign(Object.assign({}, anime), { genres: anime.categories })));
        res.json(response);
    });
}
// ID ile anime getir
function getAnimeById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const anime = yield prisma_1.default.anime.findUnique({
            where: { id: Number(id) },
            include: { categories: true },
        });
        if (!anime)
            return res.status(404).json({ error: "Anime bulunamadı." });
        res.json(Object.assign(Object.assign({}, anime), { genres: anime.categories }));
    });
}
// Anime oluştur
function createAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { title, slug, description, releaseYear, type, status, imageUrl, bannerUrl, studios, trailerUrl, genres, rating, } = req.body;
        try {
            // createdById'yi token'dan al
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
            }
            const anime = yield prisma_1.default.anime.create({
                data: Object.assign({ title,
                    slug,
                    description, releaseYear: releaseYear ? Number(releaseYear) : undefined, type,
                    status,
                    imageUrl,
                    bannerUrl, studios: studios ? (Array.isArray(studios) ? studios : [studios]) : [], trailerUrl, createdById: userId, 
                    // İlişkisel alanlar için ayrı endpointler önerilir
                    rating: rating !== undefined ? Number(rating) : undefined }, (genres !== undefined
                    ? {
                        categories: {
                            connect: (Array.isArray(genres)
                                ? genres
                                : typeof genres === "string"
                                    ? String(genres).split(",")
                                    : [genres])
                                .map((id) => Number(id))
                                .filter((n) => !isNaN(n))
                                .map((id) => ({ id })),
                        },
                    }
                    : {})),
            });
            res.status(201).json(anime);
        }
        catch (err) {
            res.status(500).json({
                error: "Anime oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Anime güncelle
function updateAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { title, slug, description, releaseYear, type, status, imageUrl, bannerUrl, studios, trailerUrl, genres, rating, } = req.body;
        try {
            const anime = yield prisma_1.default.anime.update({
                where: { id: Number(id) },
                data: Object.assign({ title,
                    slug,
                    description, releaseYear: releaseYear ? Number(releaseYear) : undefined, type,
                    status,
                    imageUrl,
                    bannerUrl, studios: studios ? (Array.isArray(studios) ? studios : [studios]) : [], trailerUrl, 
                    // İlişkisel alanlar için ayrı endpointler önerilir
                    rating: rating !== undefined ? Number(rating) : undefined }, (genres !== undefined
                    ? {
                        categories: {
                            set: (Array.isArray(genres)
                                ? genres
                                : typeof genres === "string"
                                    ? String(genres).split(",")
                                    : [genres])
                                .map((id) => Number(id))
                                .filter((n) => !isNaN(n))
                                .map((id) => ({ id })),
                        },
                    }
                    : {})),
            });
            res.json(anime);
        }
        catch (err) {
            res.status(500).json({
                error: "Anime güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Anime sil
function deleteAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.anime.delete({ where: { id: Number(id) } });
            res.json({ message: "Anime silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Anime silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Anime arama ve filtreleme
function searchAnimes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q, description, releaseYear, type, status, category, tag, minRating, maxRating, sort, order, page = 1, pageSize = 20, } = req.query;
        const where = {};
        if (q && typeof q === "string")
            where.title = { contains: q, mode: "insensitive" };
        if (description && typeof description === "string")
            where.description = { contains: description, mode: "insensitive" };
        if (releaseYear && !isNaN(Number(releaseYear)))
            where.releaseYear = Number(releaseYear);
        if (type && typeof type === "string")
            where.type = type;
        if (status && typeof status === "string")
            where.status = status;
        if (category && typeof category === "string")
            where.categories = { some: { name: { equals: category } } };
        if (tag && typeof tag === "string")
            where.tags = { some: { name: { equals: tag } } };
        try {
            let animes = yield prisma_1.default.anime.findMany({
                where,
                include: { categories: true },
                skip: (Number(page) - 1) * Number(pageSize),
                take: Number(pageSize),
                orderBy: sort && typeof sort === "string"
                    ? { [sort]: order === "asc" ? "asc" : "desc" }
                    : { createdAt: "desc" },
            });
            // min/max rating filtreleri için js ile filtrele
            if (minRating && !isNaN(Number(minRating))) {
                animes = animes.filter((a) => {
                    const avg = a.ratings.length
                        ? a.ratings.reduce((sum, r) => sum + r.value, 0) /
                            a.ratings.length
                        : 0;
                    return avg >= Number(minRating);
                });
            }
            if (maxRating && !isNaN(Number(maxRating))) {
                animes = animes.filter((a) => {
                    const avg = a.ratings.length
                        ? a.ratings.reduce((sum, r) => sum + r.value, 0) /
                            a.ratings.length
                        : 0;
                    return avg <= Number(maxRating);
                });
            }
            const response = animes.map((anime) => (Object.assign(Object.assign({}, anime), { genres: anime.categories })));
            res.json(response);
        }
        catch (err) {
            res.status(500).json({
                error: "Arama sırasında hata oluştu.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Hızlı anime arama (autocomplete/lookup)
function lookupAnimes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q, page = 1, limit = 10 } = req.query;
        try {
            const where = {};
            if (q && typeof q === "string") {
                where.title = { contains: q, mode: "insensitive" };
            }
            const animes = yield prisma_1.default.anime.findMany({
                where,
                select: { id: true, title: true, slug: true, imageUrl: true },
                orderBy: { title: "asc" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
            res.json(animes);
        }
        catch (err) {
            res.status(500).json({
                error: "Anime arama yapılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Favori ekle
function addFavorite(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, animeId } = req.body;
        try {
            const favorite = yield prisma_1.default.favorite.create({
                data: { userId, animeId },
            });
            res.status(201).json(favorite);
        }
        catch (err) {
            res.status(500).json({
                error: "Favori eklenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Favori çıkar
function removeFavorite(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, animeId } = req.body;
        try {
            yield prisma_1.default.favorite.deleteMany({ where: { userId, animeId } });
            res.json({ message: "Favori çıkarıldı." });
        }
        catch (err) {
            res.status(500).json({
                error: "Favori çıkarılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// İzleme listesine ekle
function addWatchlist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, animeId } = req.body;
        try {
            const watchlist = yield prisma_1.default.watchlist.create({
                data: { userId, animeId },
            });
            res.status(201).json(watchlist);
        }
        catch (err) {
            res.status(500).json({
                error: "İzleme listesine eklenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// İzleme listesinden çıkar
function removeWatchlist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, animeId } = req.body;
        try {
            yield prisma_1.default.watchlist.deleteMany({ where: { userId, animeId } });
            res.json({ message: "İzleme listesinden çıkarıldı." });
        }
        catch (err) {
            res.status(500).json({
                error: "İzleme listesinden çıkarılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Puan ver
function rateAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, animeId, value, review } = req.body;
        try {
            const rating = yield prisma_1.default.rating.upsert({
                where: { userId_animeId: { userId, animeId } },
                update: { value, review },
                create: { userId, animeId, value, review },
            });
            res.json(rating);
        }
        catch (err) {
            res.status(500).json({
                error: "Puan verme sırasında hata oluştu.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Anime'yi öne çıkar
function setFeatured(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        try {
            // Kullanıcının admin yetkisi olup olmadığını kontrol et
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
            }
            const user = yield prisma_1.default.user.findUnique({
                where: { id: userId },
            });
            if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
                return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
            }
            // Anime'nin var olup olmadığını kontrol et
            const anime = yield prisma_1.default.anime.findUnique({
                where: { id: Number(id) },
            });
            if (!anime) {
                return res.status(404).json({ error: "Anime bulunamadı." });
            }
            // Featured durumunu true yap
            const updatedAnime = yield prisma_1.default.anime.update({
                where: { id: Number(id) },
                data: { featured: true },
                include: {
                    categories: true,
                    tags: true,
                    createdBy: true,
                    approvedBy: true,
                },
            });
            res.json({
                message: "Anime öne çıkarıldı.",
                anime: updatedAnime,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Anime öne çıkarma durumu güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Anime'yi öne çıkarmadan çıkar
function removeFeatured(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        try {
            // Kullanıcının admin yetkisi olup olmadığını kontrol et
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
            }
            const user = yield prisma_1.default.user.findUnique({
                where: { id: userId },
            });
            if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
                return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
            }
            // Anime'nin var olup olmadığını kontrol et
            const anime = yield prisma_1.default.anime.findUnique({
                where: { id: Number(id) },
            });
            if (!anime) {
                return res.status(404).json({ error: "Anime bulunamadı." });
            }
            // Featured durumunu false yap
            const updatedAnime = yield prisma_1.default.anime.update({
                where: { id: Number(id) },
                data: { featured: false },
                include: {
                    categories: true,
                    tags: true,
                    createdBy: true,
                    approvedBy: true,
                },
            });
            res.json({
                message: "Anime öne çıkarma kaldırıldı.",
                anime: updatedAnime,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Anime öne çıkarma durumu güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Öne çıkarılan anime'leri getir
function getFeaturedAnimes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { limit = 10 } = req.query;
            const featuredAnimes = yield prisma_1.default.anime.findMany({
                where: { featured: true },
                include: {
                    categories: true,
                    tags: true,
                    ratings: true,
                    favorites: true,
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            profileImage: true,
                        },
                    },
                },
                orderBy: [
                    { rating: "desc" },
                    { viewCount: "desc" },
                    { createdAt: "desc" },
                ],
                take: Number(limit),
            });
            res.json(featuredAnimes);
        }
        catch (err) {
            res.status(500).json({
                error: "Öne çıkarılan anime'ler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
