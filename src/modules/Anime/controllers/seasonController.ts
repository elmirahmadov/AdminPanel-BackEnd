import { Request, Response } from "express";
import prisma from "../../../prisma";

// Tüm sezonları getir
export async function getAllSeasons(req: Request, res: Response) {
  try {
    const seasons = await prisma.season.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Sezonlar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Debug: Anime ve sezon kontrolü
export async function debugAnimeSeasons(req: Request, res: Response) {
  const { animeId } = req.params;
  try {
    // Önce anime'nin var olup olmadığını kontrol et
    const anime = await prisma.anime.findUnique({
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
    const seasons = await prisma.season.findMany({
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
      message:
        seasons.length === 0
          ? "Bu anime'nin henüz sezonu yok."
          : "Sezonlar bulundu.",
    });
  } catch (err) {
    res.status(500).json({
      error: "Debug kontrolü başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Animeye ait sezonları getir
export async function getSeasonsByAnime(req: Request, res: Response) {
  const { id } = req.params;
  try {
    // Önce anime'nin var olup olmadığını kontrol et
    const anime = await prisma.anime.findUnique({
      where: { id: Number(id) },
    });

    if (!anime) {
      return res.status(404).json({
        error: "Anime bulunamadı.",
        animeId: Number(id),
      });
    }

    const seasons = await prisma.season.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Sezonlar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Sezon detayını getir
export async function getSeasonById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const season = await prisma.season.findUnique({
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
  } catch (err) {
    res.status(500).json({
      error: "Sezon getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Sezon oluştur
export async function createSeason(req: Request, res: Response) {
  const { id } = req.params;
  const { name, slug, releaseYear, episodeCount, number } = req.body;
  try {
    // Eğer number belirtilmişse onu kullan, yoksa en yüksek numarayı bul ve +1 ekle
    let seasonNumber: number;

    if (number !== undefined && number !== null) {
      // Belirtilen numaranın kullanımda olup olmadığını kontrol et
      const existingSeason = await prisma.season.findFirst({
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
    } else {
      // En yüksek sezon numarasını bul ve +1 ekle
      const maxSeason = await prisma.season.findFirst({
        where: { animeId: Number(id) },
        orderBy: { number: "desc" },
      });

      seasonNumber = maxSeason ? maxSeason.number + 1 : 1;
    }

    const season = await prisma.season.create({
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
  } catch (err) {
    res.status(500).json({
      error: "Sezon oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Sezon güncelle
export async function updateSeason(req: Request, res: Response) {
  const { id, seasonId } = req.params;
  const { name, slug, number, releaseYear, episodeCount } = req.body;
  try {
    const season = await prisma.season.update({
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
  } catch (err) {
    res.status(500).json({
      error: "Sezon güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Sezon sil
export async function deleteSeason(req: Request, res: Response) {
  const { id, seasonId } = req.params;
  try {
    await prisma.season.delete({ where: { id: Number(seasonId) } });
    res.json({ message: "Sezon silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Sezon silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
