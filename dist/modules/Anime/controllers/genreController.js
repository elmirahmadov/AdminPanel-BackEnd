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
exports.getAllGenres = getAllGenres;
exports.getGenreById = getGenreById;
exports.createGenre = createGenre;
exports.updateGenre = updateGenre;
exports.deleteGenre = deleteGenre;
exports.searchGenres = searchGenres;
exports.getGenreStats = getGenreStats;
const prisma_1 = __importDefault(require("../../../prisma"));
function slugify(value) {
    return value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}
// Tüm türleri getir
function getAllGenres(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const genres = yield prisma_1.default.category.findMany({
                include: {
                    animes: {
                        include: {
                            categories: true,
                            seasons: true,
                            ratings: true,
                        },
                    },
                },
                orderBy: { name: "asc" },
            });
            res.json(genres);
        }
        catch (err) {
            res.status(500).json({
                error: "Türler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tür detayını getir
function getGenreById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const genre = yield prisma_1.default.category.findUnique({
                where: { id: Number(id) },
                include: {
                    animes: {
                        include: {
                            categories: true,
                            seasons: true,
                            ratings: true,
                        },
                    },
                },
            });
            if (!genre) {
                return res.status(404).json({ error: "Tür bulunamadı." });
            }
            res.json(genre);
        }
        catch (err) {
            res.status(500).json({
                error: "Tür getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tür oluştur
function createGenre(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, description } = req.body;
        try {
            if (!name || typeof name !== "string") {
                return res.status(400).json({ error: "'name' alanı zorunludur." });
            }
            const genre = yield prisma_1.default.category.create({
                data: {
                    name,
                    slug: slugify(name),
                    description,
                },
            });
            res.status(201).json(genre);
        }
        catch (err) {
            res.status(500).json({
                error: "Tür oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tür güncelle
function updateGenre(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { name, description } = req.body;
        try {
            const data = {};
            if (typeof name === "string" && name.trim().length > 0) {
                data.name = name;
                data.slug = slugify(name);
            }
            if (typeof description === "string") {
                data.description = description;
            }
            const genre = yield prisma_1.default.category.update({
                where: { id: Number(id) },
                data,
            });
            res.json(genre);
        }
        catch (err) {
            res.status(500).json({
                error: "Tür güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tür sil
function deleteGenre(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.category.delete({ where: { id: Number(id) } });
            res.json({ message: "Tür silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Tür silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tür arama
function searchGenres(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q } = req.query;
        const { page = 1, limit = 20 } = req.query;
        try {
            const where = {};
            if (q && typeof q === "string") {
                where.OR = [
                    { name: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                ];
            }
            const genres = yield prisma_1.default.category.findMany({
                where,
                include: {
                    animes: {
                        include: {
                            categories: true,
                            seasons: true,
                            ratings: true,
                        },
                    },
                },
                orderBy: { name: "asc" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
            res.json(genres);
        }
        catch (err) {
            res.status(500).json({
                error: "Tür arama yapılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tür istatistikleri
function getGenreStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const totalGenres = yield prisma_1.default.category.count();
            const genresWithAnimeCount = yield prisma_1.default.category.findMany({
                include: {
                    _count: {
                        select: { animes: true },
                    },
                },
                orderBy: {
                    animes: {
                        _count: "desc",
                    },
                },
            });
            res.json({
                totalGenres,
                genresWithAnimeCount,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Tür istatistikleri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
