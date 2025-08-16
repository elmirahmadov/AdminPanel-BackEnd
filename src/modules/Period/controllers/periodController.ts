import { Request, Response } from "express";
import prisma from "../../../prisma";

// Tüm dönemleri listele (anime sayısı ve bölüm sayısı ile)
export async function getAllPeriods(req: Request, res: Response) {
  try {
    const periods = await prisma.period.findMany({
      orderBy: { order: "asc" },
      include: {
        animes: {
          include: {
            episodes: true,
            seasons: {
              include: {
                episodes: true,
              },
            },
          },
        },
        _count: {
          select: { animes: true },
        },
      },
    });

    // Her dönem için anime sayısı ve toplam bölüm sayısını hesapla
    const periodsWithStats = periods.map((period: any) => {
      const animeCount = period._count.animes;

      // Toplam bölüm sayısını hesapla (sadece sezonlara bağlı bölümler)
      let totalEpisodeCount = 0;
      period.animes.forEach((anime: any) => {
        // Sadece sezonlara bağlı bölümleri say
        anime.seasons.forEach((season: any) => {
          totalEpisodeCount += season.episodes.length;
        });
      });

      return {
        id: period.id,
        name: period.name,
        slug: period.slug,
        description: period.description,
        startYear: period.startYear,
        endYear: period.endYear,
        imageUrl: period.imageUrl,
        order: period.order,
        createdAt: period.createdAt,
        updatedAt: period.updatedAt,
        animeCount,
        episodeCount: totalEpisodeCount,
      };
    });

    res.json(periodsWithStats);
  } catch (error) {
    res.status(500).json({ error: "Dönemler listelenirken hata oluştu." });
  }
}

// Belirli dönemi getir (anime listesi ile)
export async function getPeriodById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const period = await prisma.period.findUnique({
      where: { id: Number(id) },
      include: {
        animes: {
          include: {
            categories: true,
            episodes: true,
            seasons: {
              include: {
                episodes: true,
              },
            },
          },
        },
        _count: {
          select: { animes: true },
        },
      },
    });

    if (!period) {
      return res.status(404).json({ error: "Dönem bulunamadı." });
    }

    // Anime sayısı ve toplam bölüm sayısını hesapla
    const animeCount = period._count.animes;
    let totalEpisodeCount = 0;

    period.animes.forEach((anime) => {
      // Sadece sezonlara bağlı bölümleri say
      anime.seasons.forEach((season) => {
        totalEpisodeCount += season.episodes.length;
      });
    });

    const response = {
      ...period,
      animeCount,
      episodeCount: totalEpisodeCount,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Dönem getirilirken hata oluştu." });
  }
}

// Yeni dönem oluştur
export async function createPeriod(req: Request, res: Response) {
  try {
    const { name, year, season, description } = req.body;

    // Upload edilen dosyayı kontrol et
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageUrl = files?.image?.[0]?.filename || null;

    // Slug oluştur (name + year + season)
    const slug = `${name
      .toLowerCase()
      .replace(/\s+/g, "-")}-${year}-${season.toLowerCase()}`;

    // Slug benzersizlik kontrolü
    const existingPeriod = await prisma.period.findUnique({
      where: { slug },
    });

    if (existingPeriod) {
      return res.status(400).json({ error: "Bu dönem zaten mevcut." });
    }

    // Mevcut en yüksek order'ı bul
    const maxOrder = await prisma.period.aggregate({
      _max: { order: true },
    });
    const order = (maxOrder._max.order || 0) + 1;

    const period = await prisma.period.create({
      data: {
        name,
        slug,
        description,
        startYear: year ? Number(year) : null,
        endYear: year ? Number(year) : null,
        imageUrl,
        order,
      },
    });

    res.status(201).json(period);
  } catch (error) {
    console.error("Period creation error:", error);
    res.status(500).json({ error: "Dönem oluşturulurken hata oluştu." });
  }
}

// Dönem güncelle
export async function updatePeriod(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, slug, description, startYear, endYear, order } = req.body;

    // Upload edilen dosyayı kontrol et
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageUrl = files?.image?.[0]?.filename || null;

    // Dönemin var olup olmadığını kontrol et
    const existingPeriod = await prisma.period.findUnique({
      where: { id: Number(id) },
    });

    if (!existingPeriod) {
      return res.status(404).json({ error: "Dönem bulunamadı." });
    }

    // Slug benzersizlik kontrolü (kendi ID'si hariç)
    if (slug && slug !== existingPeriod.slug) {
      const slugExists = await prisma.period.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return res.status(400).json({ error: "Bu slug zaten kullanılıyor." });
      }
    }

    const period = await prisma.period.update({
      where: { id: Number(id) },
      data: {
        name,
        slug,
        description,
        startYear: startYear ? Number(startYear) : null,
        endYear: endYear ? Number(endYear) : null,
        imageUrl,
        order: order ? Number(order) : existingPeriod.order,
      },
    });

    res.json(period);
  } catch (error) {
    res.status(500).json({ error: "Dönem güncellenirken hata oluştu." });
  }
}

// Dönem sil
export async function deletePeriod(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Dönemin var olup olmadığını kontrol et
    const existingPeriod = await prisma.period.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { animes: true },
        },
      },
    });

    if (!existingPeriod) {
      return res.status(404).json({ error: "Dönem bulunamadı." });
    }

    // Dönemde anime varsa uyarı ver
    if (existingPeriod._count.animes > 0) {
      return res.status(400).json({
        error:
          "Bu dönemde anime bulunduğu için silinemez. Önce animeleri başka bir döneme taşıyın.",
      });
    }

    await prisma.period.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Dönem başarıyla silindi." });
  } catch (error) {
    res.status(500).json({ error: "Dönem silinirken hata oluştu." });
  }
}

// Döneme anime ekle
export async function addAnimeToPeriod(req: Request, res: Response) {
  try {
    const { id, animeId } = req.params;

    // Dönemin var olup olmadığını kontrol et
    const period = await prisma.period.findUnique({
      where: { id: Number(id) },
    });

    if (!period) {
      return res.status(404).json({ error: "Dönem bulunamadı." });
    }

    // Anime'nin var olup olmadığını kontrol et
    const anime = await prisma.anime.findUnique({
      where: { id: Number(animeId) },
    });

    if (!anime) {
      return res.status(404).json({ error: "Anime bulunamadı." });
    }

    // Anime'nin zaten bu dönemde olup olmadığını kontrol et
    if (anime.periodId === Number(id)) {
      return res.status(400).json({ error: "Anime zaten bu dönemde." });
    }

    // Anime'yi döneme ekle
    await prisma.anime.update({
      where: { id: Number(animeId) },
      data: { periodId: Number(id) },
    });

    res.json({ message: "Anime döneme başarıyla eklendi." });
  } catch (error) {
    console.error("Add anime to period error:", error);
    res.status(500).json({ error: "Anime döneme eklenirken hata oluştu." });
  }
}

// Dönemden anime çıkar
export async function removeAnimeFromPeriod(req: Request, res: Response) {
  try {
    const { id, animeId } = req.params;

    // Dönemin var olup olmadığını kontrol et
    const period = await prisma.period.findUnique({
      where: { id: Number(id) },
    });

    if (!period) {
      return res.status(404).json({ error: "Dönem bulunamadı." });
    }

    // Anime'nin var olup olmadığını ve bu dönemde olup olmadığını kontrol et
    const anime = await prisma.anime.findUnique({
      where: { id: Number(animeId) },
    });

    if (!anime) {
      return res.status(404).json({ error: "Anime bulunamadı." });
    }

    if (anime.periodId !== Number(id)) {
      return res.status(400).json({ error: "Anime bu dönemde değil." });
    }

    // Anime'yi dönemden çıkar
    await prisma.anime.update({
      where: { id: Number(animeId) },
      data: { periodId: null },
    });

    res.json({ message: "Anime dönemden başarıyla çıkarıldı." });
  } catch (error) {
    res.status(500).json({ error: "Anime dönemden çıkarılırken hata oluştu." });
  }
}
