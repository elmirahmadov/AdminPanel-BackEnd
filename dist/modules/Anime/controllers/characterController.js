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
exports.getAllCharacters = getAllCharacters;
exports.getCharacterById = getCharacterById;
exports.getCharactersByAnime = getCharactersByAnime;
exports.createCharacter = createCharacter;
exports.updateCharacter = updateCharacter;
exports.deleteCharacter = deleteCharacter;
exports.searchCharacters = searchCharacters;
exports.getPopularCharacters = getPopularCharacters;
exports.getCharacterStats = getCharacterStats;
exports.getCharacterAnimes = getCharacterAnimes;
exports.addCharacterToAnime = addCharacterToAnime;
exports.removeCharacterFromAnime = removeCharacterFromAnime;
const prisma_1 = __importDefault(require("../../../prisma"));
// Tüm karakterleri getir
function getAllCharacters(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const characters = yield prisma_1.default.character.findMany({
                include: {
                    anime: true,
                },
                orderBy: { name: "asc" },
            });
            res.json(characters);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakterler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Karakter detayını getir
function getCharacterById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const character = yield prisma_1.default.character.findUnique({
                where: { id: Number(id) },
                include: {
                    anime: true,
                },
            });
            if (!character) {
                return res.status(404).json({ error: "Karakter bulunamadı." });
            }
            res.json(character);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakter getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Animeye ait karakterleri getir
function getCharactersByAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { animeId } = req.params;
        try {
            const characters = yield prisma_1.default.character.findMany({
                where: { animeId: Number(animeId) },
                include: {
                    anime: true,
                },
                orderBy: { name: "asc" },
            });
            res.json(characters);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakterler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Karakter oluştur
function createCharacter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { animeId, anime, name, description, imageUrl, voiceActor, role, age } = req.body;
        try {
            // animeId hem `animeId` hem de `anime` alanından gelebilir (UI farklı ad gönderebilir)
            const rawAnimeId = animeId !== null && animeId !== void 0 ? animeId : anime;
            const resolvedAnimeId = rawAnimeId === null || rawAnimeId === "null"
                ? null
                : rawAnimeId !== undefined && String(rawAnimeId).trim() !== ""
                    ? Number(rawAnimeId)
                    : null;
            const character = yield prisma_1.default.character.create({
                data: {
                    animeId: resolvedAnimeId,
                    name,
                    description,
                    imageUrl,
                    voiceActor,
                    role,
                    age: age ? Number(age) : null,
                },
                include: {
                    anime: true,
                },
            });
            res.status(201).json(character);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakter oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Karakter güncelle
function updateCharacter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { name, description, imageUrl, voiceActor, role, age, animeId, anime } = req.body;
        try {
            // animeId güncellemesi: öncelik `animeId`, yoksa `anime`; null veya "null" gönderilirse kaldırılır
            let animeIdToSet = undefined;
            const rawAnimeId = animeId !== null && animeId !== void 0 ? animeId : anime;
            if (rawAnimeId !== undefined) {
                if (rawAnimeId === null || rawAnimeId === "null") {
                    animeIdToSet = null;
                }
                else if (String(rawAnimeId).trim() !== "") {
                    animeIdToSet = Number(rawAnimeId);
                }
            }
            const character = yield prisma_1.default.character.update({
                where: { id: Number(id) },
                data: Object.assign({ name,
                    description,
                    imageUrl,
                    voiceActor,
                    role, age: age ? Number(age) : undefined }, (animeIdToSet !== undefined ? { animeId: animeIdToSet } : {})),
                include: {
                    anime: true,
                },
            });
            res.json(character);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakter güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Karakter sil
function deleteCharacter(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.character.delete({ where: { id: Number(id) } });
            res.json({ message: "Karakter silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Karakter silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Karakter arama
function searchCharacters(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q, animeId, role, voiceActor, minAge, maxAge, anime, animeTitle } = req.query;
        const { page = 1, limit = 20 } = req.query;
        try {
            const where = {};
            if (q && typeof q === "string") {
                where.OR = [
                    { name: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                    { voiceActor: { contains: q, mode: "insensitive" } },
                ];
            }
            if (animeId && !isNaN(Number(animeId))) {
                where.animeId = Number(animeId);
            }
            // Anime ismine göre arama (title contains)
            const animeNameParam = typeof anime === "string" && anime.trim().length > 0
                ? anime
                : typeof animeTitle === "string" && animeTitle.trim().length > 0
                    ? animeTitle
                    : undefined;
            if (animeNameParam) {
                where.anime = {
                    is: {
                        title: { contains: String(animeNameParam), mode: "insensitive" },
                    },
                };
            }
            if (role && typeof role === "string") {
                where.role = role;
            }
            if (voiceActor && typeof voiceActor === "string") {
                where.voiceActor = { contains: voiceActor, mode: "insensitive" };
            }
            if (minAge && !isNaN(Number(minAge))) {
                where.age = Object.assign(Object.assign({}, (where.age || {})), { gte: Number(minAge) });
            }
            if (maxAge && !isNaN(Number(maxAge))) {
                where.age = Object.assign(Object.assign({}, (where.age || {})), { lte: Number(maxAge) });
            }
            const characters = yield prisma_1.default.character.findMany({
                where,
                include: {
                    anime: true,
                },
                orderBy: { name: "asc" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
            res.json(characters);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakter arama yapılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// En popüler karakterler
function getPopularCharacters(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { limit = 10 } = req.query;
        try {
            const characters = yield prisma_1.default.character.findMany({
                include: {
                    anime: {
                        include: {
                            categories: true,
                        },
                    },
                },
                orderBy: { name: "asc" },
                take: Number(limit),
            });
            res.json(characters);
        }
        catch (err) {
            res.status(500).json({
                error: "Popüler karakterler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Karakter istatistikleri
function getCharacterStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { animeId } = req.query;
        try {
            const where = {};
            if (animeId && !isNaN(Number(animeId))) {
                where.animeId = Number(animeId);
            }
            const totalCharacters = yield prisma_1.default.character.count({ where });
            const totalFavorites = 0;
            const avgFavoritesPerCharacter = totalCharacters > 0 ? totalFavorites / totalCharacters : 0;
            res.json({
                totalCharacters,
                totalFavorites,
                averageFavoritesPerCharacter: Math.round(avgFavoritesPerCharacter * 100) / 100,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Karakter istatistikleri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Animeye ait karakterleri getir
function getCharacterAnimes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { animeId } = req.params;
        try {
            const characters = yield prisma_1.default.character.findMany({
                where: { animeId: Number(animeId) },
                include: {
                    anime: {
                        include: {
                            categories: true,
                        },
                    },
                },
                orderBy: { name: "asc" },
            });
            res.json(characters);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakterler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Animeye karakter ekle
function addCharacterToAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { animeId, characterId } = req.params;
        try {
            const character = yield prisma_1.default.character.update({
                where: { id: Number(characterId) },
                data: { animeId: Number(animeId) },
                include: {
                    anime: true,
                },
            });
            res.json(character);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakter animeye eklenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Anime'den karakter çıkar
function removeCharacterFromAnime(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { animeId, characterId } = req.params;
        try {
            const character = yield prisma_1.default.character.update({
                where: { id: Number(characterId) },
                data: { animeId: null },
                include: {
                    anime: true,
                },
            });
            res.json(character);
        }
        catch (err) {
            res.status(500).json({
                error: "Karakter anime'den çıkarılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
