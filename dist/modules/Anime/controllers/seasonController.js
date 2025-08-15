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
exports.getAllSeasons = getAllSeasons;
exports.debugAnimeSeasons = debugAnimeSeasons;
exports.getSeasonsByAnime = getSeasonsByAnime;
exports.getSeasonById = getSeasonById;
exports.createSeason = createSeason;
exports.updateSeason = updateSeason;
exports.deleteSeason = deleteSeason;
exports.searchSeasons = searchSeasons;
exports.getSeasonStats = getSeasonStats;
const prisma_1 = __importDefault(require("../../../prisma"));
// Tüm sezonları getir
function getAllSeasons(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const seasons = yield prisma_1.default.season.findMany({
                include: {
                    anime: {
                        include: {
                            categories: true,
                            tags: true,
                        },
                    },
                    episodes: {
                        orderBy: { number: "asc" },
                    },
                },
                orderBy: { number: "asc" },
            });
            res.json(seasons);
        }
        catch (err) {
            res.status(500).json({
                error: "Sezonlar getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Debug: Anime ve sezon kontrolü
function debugAnimeSeasons(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { animeId } = req.params;
        try {
            // Önce anime'nin var olup olmadığını kontrol et
            const anime = yield prisma_1.default.anime.findUnique({
                where: { id: Number(animeId) },
                include: {
                    seasons: true,
                },
            });
            if (!anime) {
                return res.status(404).json({
                    error: "Anime bulunamadı.",
                    animeId: Number(animeId),
                });
            }
            // Sezonları ayrıca kontrol et
            const seasons = yield prisma_1.default.season.findMany({
                where: { animeId: Number(animeId) },
            });
            res.json({
                anime: {
                    id: anime.id,
                    title: anime.title,
                    slug: anime.slug,
                },
                seasonsCount: seasons.length,
                seasons: seasons,
                message: seasons.length === 0
                    ? "Bu anime'nin henüz sezonu yok."
                    : "Sezonlar bulundu.",
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Debug kontrolü başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Animeye ait sezonları getir
function getSeasonsByAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            // Önce anime'nin var olup olmadığını kontrol et
            const anime = yield prisma_1.default.anime.findUnique({
                where: { id: Number(id) },
            });
            if (!anime) {
                return res.status(404).json({
                    error: "Anime bulunamadı.",
                    animeId: Number(id),
                });
            }
            const seasons = yield prisma_1.default.season.findMany({
                where: { animeId: Number(id) },
                include: {
                    episodes: {
                        orderBy: { number: "asc" },
                    },
                },
                orderBy: { number: "asc" },
            });
            res.json({
                anime: {
                    id: anime.id,
                    title: anime.title,
                    slug: anime.slug,
                },
                seasons: seasons,
                count: seasons.length,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Sezonlar getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Sezon detayını getir
function getSeasonById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const season = yield prisma_1.default.season.findUnique({
                where: { id: Number(id) },
                include: {
                    anime: {
                        include: {
                            categories: true,
                            tags: true,
                            seasons: true,
                        },
                    },
                    episodes: {
                        orderBy: { number: "asc" },
                    },
                },
            });
            if (!season) {
                return res.status(404).json({ error: "Sezon bulunamadı." });
            }
            res.json(season);
        }
        catch (err) {
            res.status(500).json({
                error: "Sezon getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Sezon oluştur
function createSeason(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { name, slug, releaseYear, episodeCount, number } = req.body;
        try {
            // Eğer number belirtilmişse onu kullan, yoksa en yüksek numarayı bul ve +1 ekle
            let seasonNumber;
            if (number !== undefined && number !== null) {
                // Belirtilen numaranın kullanımda olup olmadığını kontrol et
                const existingSeason = yield prisma_1.default.season.findFirst({
                    where: {
                        animeId: Number(id),
                        number: Number(number),
                    },
                });
                if (existingSeason) {
                    return res.status(400).json({
                        error: "Bu sezon numarası zaten kullanımda.",
                        existingSeason: existingSeason,
                    });
                }
                seasonNumber = Number(number);
            }
            else {
                // En yüksek sezon numarasını bul ve +1 ekle
                const maxSeason = yield prisma_1.default.season.findFirst({
                    where: { animeId: Number(id) },
                    orderBy: { number: "desc" },
                });
                seasonNumber = maxSeason ? maxSeason.number + 1 : 1;
            }
            const season = yield prisma_1.default.season.create({
                data: {
                    animeId: Number(id),
                    name,
                    slug,
                    number: seasonNumber,
                    releaseYear: releaseYear ? Number(releaseYear) : null,
                    episodeCount: episodeCount ? Number(episodeCount) : 0,
                },
                include: {
                    episodes: true,
                },
            });
            res.status(201).json(season);
        }
        catch (err) {
            res.status(500).json({
                error: "Sezon oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Sezon güncelle
function updateSeason(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, seasonId } = req.params;
        const { name, slug, number, releaseYear, episodeCount } = req.body;
        try {
            const season = yield prisma_1.default.season.update({
                where: { id: Number(seasonId) },
                data: {
                    name,
                    slug,
                    number: number ? Number(number) : undefined,
                    releaseYear: releaseYear ? Number(releaseYear) : undefined,
                    episodeCount: episodeCount ? Number(episodeCount) : undefined,
                },
                include: {
                    episodes: true,
                },
            });
            res.json(season);
        }
        catch (err) {
            res.status(500).json({
                error: "Sezon güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Sezon sil
function deleteSeason(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, seasonId } = req.params;
        try {
            yield prisma_1.default.season.delete({ where: { id: Number(seasonId) } });
            res.json({ message: "Sezon silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Sezon silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Sezon arama
function searchSeasons(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q, animeId, minYear, maxYear, minNumber, maxNumber } = req.query;
        const { page = 1, limit = 20 } = req.query;
        try {
            const where = {};
            if (q && typeof q === "string") {
                where.OR = [
                    { name: { contains: q, mode: "insensitive" } },
                    { slug: { contains: q, mode: "insensitive" } },
                ];
            }
            if (animeId && !isNaN(Number(animeId))) {
                where.animeId = Number(animeId);
            }
            if (minYear && !isNaN(Number(minYear))) {
                where.releaseYear = Object.assign(Object.assign({}, (where.releaseYear || {})), { gte: Number(minYear) });
            }
            if (maxYear && !isNaN(Number(maxYear))) {
                where.releaseYear = Object.assign(Object.assign({}, (where.releaseYear || {})), { lte: Number(maxYear) });
            }
            if (minNumber && !isNaN(Number(minNumber))) {
                where.number = Object.assign(Object.assign({}, (where.number || {})), { gte: Number(minNumber) });
            }
            if (maxNumber && !isNaN(Number(maxNumber))) {
                where.number = Object.assign(Object.assign({}, (where.number || {})), { lte: Number(maxNumber) });
            }
            const seasons = yield prisma_1.default.season.findMany({
                where,
                include: {
                    anime: {
                        include: {
                            categories: true,
                            tags: true,
                        },
                    },
                    episodes: {
                        orderBy: { number: "asc" },
                    },
                },
                orderBy: { number: "asc" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
            res.json(seasons);
        }
        catch (err) {
            res.status(500).json({
                error: "Sezon arama yapılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Sezon istatistikleri
function getSeasonStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { animeId } = req.query;
        try {
            const where = {};
            if (animeId && !isNaN(Number(animeId))) {
                where.animeId = Number(animeId);
            }
            const totalSeasons = yield prisma_1.default.season.count({ where });
            const totalEpisodes = yield prisma_1.default.episode.count({
                where: {
                    season: where,
                },
            });
            const avgEpisodesPerSeason = totalSeasons > 0 ? totalEpisodes / totalSeasons : 0;
            res.json({
                totalSeasons,
                totalEpisodes,
                averageEpisodesPerSeason: Math.round(avgEpisodesPerSeason * 100) / 100,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Sezon istatistikleri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
