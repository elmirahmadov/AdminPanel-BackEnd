import { Request, Response } from "express";
import prisma from "../../../prisma";

// Tüm bölümleri getir
export async function getAllEpisodes(req: Request, res: Response) {
  try {
    const episodes = await prisma.episode.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Bölümler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Sezona ait bölümleri getir
export async function getEpisodesBySeason(req: Request, res: Response) {
  const { seasonId, animeId } = req.params;
  try {
    // Önce sezonun var olup olmadığını ve doğru anime'ye ait olduğunu kontrol et
    const season = await prisma.season.findUnique({
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

    const episodes = await prisma.episode.findMany({
      where: { seasonId: Number(seasonId) },
      include: {
        comments: {
          include: { user: true },
        },
      },
      orderBy: { number: "asc" },
    });
    res.json(episodes);
  } catch (err) {
    res.status(500).json({
      error: "Bölümler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime ve sezona ait bölümleri getir
export async function getEpisodesByAnimeAndSeason(req: Request, res: Response) {
  const { animeId, seasonId } = req.params;
  try {
    // Önce sezonun var olup olmadığını ve doğru anime'ye ait olduğunu kontrol et
    const season = await prisma.season.findUnique({
      where: {
        id: Number(seasonId),
        animeId: Number(animeId),
      },
      include: { anime: true },
    });

    if (!season) {
      return res.status(404).json({
        error: "Bu anime'ye ait sezon bulunamadı.",
        animeId: Number(animeId),
        seasonId: Number(seasonId),
      });
    }

    const episodes = await prisma.episode.findMany({
      where: {
        seasonId: Number(seasonId),
        animeId: Number(animeId),
      },
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
  } catch (err) {
    res.status(500).json({
      error: "Bölümler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Bölüm detayını getir
export async function getEpisodeById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const episode = await prisma.episode.findUnique({
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
  } catch (err) {
    res.status(500).json({
      error: "Bölüm getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Bölüm oluştur
export async function createEpisode(req: Request, res: Response) {
  const { animeId, seasonId } = req.params;
  const {
    title,
    slug,
    number,
    description,
    releaseDate,
    duration,
    thumbnail,
    videoUrl,
  } = req.body;

  try {
    // Önce sezonun var olup olmadığını kontrol et
    const season = await prisma.season.findUnique({
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
    let episodeNumber: number;

    if (number !== undefined && number !== null) {
      // Belirtilen numaranın kullanımda olup olmadığını kontrol et
      const existingEpisode = await prisma.episode.findFirst({
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
    } else {
      // En yüksek bölüm numarasını bul ve +1 ekle
      const maxEpisode = await prisma.episode.findFirst({
        where: { seasonId: Number(seasonId) },
        orderBy: { number: "desc" },
      });

      episodeNumber = maxEpisode ? maxEpisode.number + 1 : 1;
    }

    // Slug oluştur (eğer verilmemişse)
    const episodeSlug =
      slug ||
      `${season.anime.slug}-sezon-${season.number}-bolum-${episodeNumber}`;

    const episode = await prisma.episode.create({
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
  } catch (err) {
    res.status(500).json({
      error: "Bölüm oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Bölüm güncelle
export async function updateEpisode(req: Request, res: Response) {
  const { id } = req.params;
  const {
    title,
    slug,
    number,
    description,
    releaseDate,
    duration,
    thumbnail,
    videoUrl,
  } = req.body;

  try {
    // Önce mevcut bölümü bul
    const existingEpisode = await prisma.episode.findUnique({
      where: { id: Number(id) },
      include: { season: { include: { anime: true } } },
    });

    if (!existingEpisode) {
      return res.status(404).json({ error: "Bölüm bulunamadı." });
    }

    // Eğer number değiştirilecekse, unique constraint kontrolü yap
    let episodeNumber = existingEpisode.number;
    if (
      number !== undefined &&
      number !== null &&
      Number(number) !== existingEpisode.number
    ) {
      const duplicateEpisode = await prisma.episode.findFirst({
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
    const episodeSlug =
      slug ||
      `${existingEpisode.season.anime.slug}-sezon-${existingEpisode.season.number}-bolum-${episodeNumber}`;

    const episode = await prisma.episode.update({
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
  } catch (err) {
    res.status(500).json({
      error: "Bölüm güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Bölüm sil
export async function deleteEpisode(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.episode.delete({ where: { id: Number(id) } });
    res.json({ message: "Bölüm silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Bölüm silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
