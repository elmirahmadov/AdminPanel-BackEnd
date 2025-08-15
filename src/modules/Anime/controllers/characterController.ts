import { Request, Response } from "express";
import prisma from "../../../prisma";

// Tüm karakterleri getir
export async function getAllCharacters(req: Request, res: Response) {
  try {
    const characters = await (prisma as any).character.findMany({
      include: {
        anime: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(characters);
  } catch (err) {
    res.status(500).json({
      error: "Karakterler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Karakter detayını getir
export async function getCharacterById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const character = await (prisma as any).character.findUnique({
      where: { id: Number(id) },
      include: {
        anime: true,
      },
    });
    if (!character) {
      return res.status(404).json({ error: "Karakter bulunamadı." });
    }
    res.json(character);
  } catch (err) {
    res.status(500).json({
      error: "Karakter getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Animeye ait karakterleri getir
export async function getCharactersByAnime(req: Request, res: Response) {
  const { animeId } = req.params;
  try {
    const characters = await (prisma as any).character.findMany({
      where: { animeId: Number(animeId) },
      include: {
        anime: true,
      },
      orderBy: { name: "asc" },
    });
    res.json(characters);
  } catch (err) {
    res.status(500).json({
      error: "Karakterler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Karakter oluştur
export async function createCharacter(req: Request, res: Response) {
  const { animeId, anime, name, description, imageUrl, voiceActor, role, age } =
    req.body as any;
  try {
    // animeId hem `animeId` hem de `anime` alanından gelebilir (UI farklı ad gönderebilir)
    const rawAnimeId = animeId ?? anime;
    const resolvedAnimeId =
      rawAnimeId === null || rawAnimeId === "null"
        ? null
        : rawAnimeId !== undefined && String(rawAnimeId).trim() !== ""
        ? Number(rawAnimeId)
        : null;

    const character = await (prisma as any).character.create({
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
  } catch (err) {
    res.status(500).json({
      error: "Karakter oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Karakter güncelle
export async function updateCharacter(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, imageUrl, voiceActor, role, age, animeId, anime } =
    req.body as any;
  try {
    // animeId güncellemesi: öncelik `animeId`, yoksa `anime`; null veya "null" gönderilirse kaldırılır
    let animeIdToSet: number | null | undefined = undefined;
    const rawAnimeId = animeId ?? anime;
    if (rawAnimeId !== undefined) {
      if (rawAnimeId === null || rawAnimeId === "null") {
        animeIdToSet = null;
      } else if (String(rawAnimeId).trim() !== "") {
        animeIdToSet = Number(rawAnimeId);
      }
    }
    const character = await (prisma as any).character.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        imageUrl,
        voiceActor,
        role,
        age: age ? Number(age) : undefined,
        ...(animeIdToSet !== undefined ? { animeId: animeIdToSet } : {}),
      },
      include: {
        anime: true,
      },
    });
    res.json(character);
  } catch (err) {
    res.status(500).json({
      error: "Karakter güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Karakter sil
export async function deleteCharacter(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await (prisma as any).character.delete({ where: { id: Number(id) } });
    res.json({ message: "Karakter silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Karakter silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Karakter arama
export async function searchCharacters(req: Request, res: Response) {
  const { q, animeId, role, voiceActor, minAge, maxAge, anime, animeTitle } =
    req.query;
  const { page = 1, limit = 20 } = req.query;
  try {
    const where: any = {};

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
    const animeNameParam =
      typeof anime === "string" && anime.trim().length > 0
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
      where.age = { ...(where.age || {}), gte: Number(minAge) };
    }

    if (maxAge && !isNaN(Number(maxAge))) {
      where.age = { ...(where.age || {}), lte: Number(maxAge) };
    }

    const characters = await (prisma as any).character.findMany({
      where,
      include: {
        anime: true,
      },
      orderBy: { name: "asc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    res.json(characters);
  } catch (err) {
    res.status(500).json({
      error: "Karakter arama yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// En popüler karakterler
export async function getPopularCharacters(req: Request, res: Response) {
  const { limit = 10 } = req.query;
  try {
    const characters = await (prisma as any).character.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Popüler karakterler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Karakter istatistikleri
export async function getCharacterStats(req: Request, res: Response) {
  const { animeId } = req.query;
  try {
    const where: any = {};

    if (animeId && !isNaN(Number(animeId))) {
      where.animeId = Number(animeId);
    }

    const totalCharacters = await (prisma as any).character.count({ where });
    const totalFavorites = 0;
    const avgFavoritesPerCharacter =
      totalCharacters > 0 ? totalFavorites / totalCharacters : 0;

    res.json({
      totalCharacters,
      totalFavorites,
      averageFavoritesPerCharacter:
        Math.round(avgFavoritesPerCharacter * 100) / 100,
    });
  } catch (err) {
    res.status(500).json({
      error: "Karakter istatistikleri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Animeye ait karakterleri getir
export async function getCharacterAnimes(req: Request, res: Response) {
  const { animeId } = req.params;
  try {
    const characters = await (prisma as any).character.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Karakterler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Animeye karakter ekle
export async function addCharacterToAnime(req: Request, res: Response) {
  const { animeId, characterId } = req.params;
  try {
    const character = await (prisma as any).character.update({
      where: { id: Number(characterId) },
      data: { animeId: Number(animeId) },
      include: {
        anime: true,
      },
    });
    res.json(character);
  } catch (err) {
    res.status(500).json({
      error: "Karakter animeye eklenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime'den karakter çıkar
export async function removeCharacterFromAnime(req: Request, res: Response) {
  const { animeId, characterId } = req.params;
  try {
    const character = await (prisma as any).character.update({
      where: { id: Number(characterId) },
      data: { animeId: null },
      include: {
        anime: true,
      },
    });
    res.json(character);
  } catch (err) {
    res.status(500).json({
      error: "Karakter anime'den çıkarılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
