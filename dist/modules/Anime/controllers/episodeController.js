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
exports.getAllEpisodes = getAllEpisodes;
exports.getEpisodesBySeason = getEpisodesBySeason;
exports.getEpisodeById = getEpisodeById;
exports.createEpisode = createEpisode;
exports.updateEpisode = updateEpisode;
exports.deleteEpisode = deleteEpisode;
const prisma_1 = __importDefault(require("../../../prisma"));
// Tüm bölümleri getir
function getAllEpisodes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const episodes = yield prisma_1.default.episode.findMany({
                include: {
                    season: {
                        include: {
                            anime: true,
                        },
                    },
                    comments: {
                        include: { user: true },
                    },
                },
                orderBy: { number: "asc" },
            });
            res.json(episodes);
        }
        catch (err) {
            res.status(500).json({
                error: "Bölümler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Sezona ait bölümleri getir
function getEpisodesBySeason(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { seasonId, animeId } = req.params;
        try {
            // Önce sezonun var olup olmadığını ve doğru anime'ye ait olduğunu kontrol et
            const season = yield prisma_1.default.season.findUnique({
                where: { id: Number(seasonId) },
                include: { anime: true },
            });
            if (!season) {
                return res.status(404).json({
                    error: "Sezon bulunamadı.",
                    seasonId: Number(seasonId),
                });
            }
            // Eğer animeId parametresi varsa, sezonun o anime'ye ait olduğunu kontrol et
            if (animeId && Number(animeId) !== season.animeId) {
                return res.status(400).json({
                    error: "Bu sezon bu anime'ye ait değil.",
                    providedAnimeId: Number(animeId),
                    actualAnimeId: season.animeId,
                    seasonId: Number(seasonId),
                });
            }
            const episodes = yield prisma_1.default.episode.findMany({
                where: { seasonId: Number(seasonId) },
                include: {
                    comments: {
                        include: { user: true },
                    },
                },
                orderBy: { number: "asc" },
            });
            res.json(episodes);
        }
        catch (err) {
            res.status(500).json({
                error: "Bölümler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Bölüm detayını getir
function getEpisodeById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const episode = yield prisma_1.default.episode.findUnique({
                where: { id: Number(id) },
                include: {
                    comments: {
                        include: { user: true },
                    },
                },
            });
            if (!episode) {
                return res.status(404).json({ error: "Bölüm bulunamadı." });
            }
            res.json(episode);
        }
        catch (err) {
            res.status(500).json({
                error: "Bölüm getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Bölüm oluştur
function createEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { seasonId, animeId } = req.params;
        const { title, slug, number, description, releaseDate, duration, thumbnail, videoUrl, } = req.body;
        try {
            // Önce sezonun var olup olmadığını kontrol et
            const season = yield prisma_1.default.season.findUnique({
                where: { id: Number(seasonId) },
                include: { anime: true },
            });
            if (!season) {
                return res.status(404).json({
                    error: "Sezon bulunamadı.",
                    seasonId: Number(seasonId),
                });
            }
            // Eğer animeId parametresi varsa, sezonun o anime'ye ait olduğunu kontrol et
            if (animeId && Number(animeId) !== season.animeId) {
                return res.status(400).json({
                    error: "Bu sezon bu anime'ye ait değil.",
                    providedAnimeId: Number(animeId),
                    actualAnimeId: season.animeId,
                    seasonId: Number(seasonId),
                });
            }
            // Eğer number belirtilmişse onu kullan, yoksa en yüksek numarayı bul ve +1 ekle
            let episodeNumber;
            if (number !== undefined && number !== null) {
                // Belirtilen numaranın kullanımda olup olmadığını kontrol et
                const existingEpisode = yield prisma_1.default.episode.findFirst({
                    where: {
                        seasonId: Number(seasonId),
                        number: Number(number),
                    },
                });
                if (existingEpisode) {
                    return res.status(400).json({
                        error: "Bu bölüm numarası zaten kullanımda.",
                        existingEpisode: existingEpisode,
                    });
                }
                episodeNumber = Number(number);
            }
            else {
                // En yüksek bölüm numarasını bul ve +1 ekle
                const maxEpisode = yield prisma_1.default.episode.findFirst({
                    where: { seasonId: Number(seasonId) },
                    orderBy: { number: "desc" },
                });
                episodeNumber = maxEpisode ? maxEpisode.number + 1 : 1;
            }
            // Slug oluştur (eğer verilmemişse)
            const episodeSlug = slug ||
                `${season.anime.slug}-sezon-${season.number}-bolum-${episodeNumber}`;
            const episode = yield prisma_1.default.episode.create({
                data: {
                    seasonId: Number(seasonId),
                    animeId: season.animeId,
                    title,
                    slug: episodeSlug,
                    number: episodeNumber,
                    description,
                    releaseDate: releaseDate ? new Date(releaseDate) : null,
                    duration: duration ? Number(duration) : null,
                    thumbnail,
                    videoUrl,
                },
                include: {
                    comments: {
                        include: { user: true },
                    },
                },
            });
            res.status(201).json(episode);
        }
        catch (err) {
            res.status(500).json({
                error: "Bölüm oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Bölüm güncelle
function updateEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { title, slug, number, description, releaseDate, duration, thumbnail, videoUrl, } = req.body;
        try {
            // Önce mevcut bölümü bul
            const existingEpisode = yield prisma_1.default.episode.findUnique({
                where: { id: Number(id) },
                include: { season: { include: { anime: true } } },
            });
            if (!existingEpisode) {
                return res.status(404).json({ error: "Bölüm bulunamadı." });
            }
            // Eğer number değiştirilecekse, unique constraint kontrolü yap
            let episodeNumber = existingEpisode.number;
            if (number !== undefined &&
                number !== null &&
                Number(number) !== existingEpisode.number) {
                const duplicateEpisode = yield prisma_1.default.episode.findFirst({
                    where: {
                        seasonId: existingEpisode.seasonId,
                        number: Number(number),
                        id: { not: Number(id) }, // Kendisi hariç
                    },
                });
                if (duplicateEpisode) {
                    return res.status(400).json({
                        error: "Bu bölüm numarası zaten kullanımda.",
                        duplicateEpisode: duplicateEpisode,
                    });
                }
                episodeNumber = Number(number);
            }
            // Slug oluştur (eğer verilmemişse)
            const episodeSlug = slug ||
                `${existingEpisode.season.anime.slug}-sezon-${existingEpisode.season.number}-bolum-${episodeNumber}`;
            const episode = yield prisma_1.default.episode.update({
                where: { id: Number(id) },
                data: {
                    title,
                    slug: episodeSlug,
                    number: episodeNumber,
                    description,
                    releaseDate: releaseDate ? new Date(releaseDate) : undefined,
                    duration: duration ? Number(duration) : undefined,
                    thumbnail,
                    videoUrl,
                },
                include: {
                    comments: {
                        include: { user: true },
                    },
                },
            });
            res.json(episode);
        }
        catch (err) {
            res.status(500).json({
                error: "Bölüm güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Bölüm sil
function deleteEpisode(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.episode.delete({ where: { id: Number(id) } });
            res.json({ message: "Bölüm silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Bölüm silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
