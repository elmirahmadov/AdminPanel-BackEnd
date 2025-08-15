import { Request, Response } from "express";
import prisma from "../../../prisma";

// Tüm animeleri getir
export async function getAllAnimes(req: Request, res: Response) {
  const animes = await prisma.anime.findMany({
    orderBy: { createdAt: "desc" },
    include: { categories: true },
  });
  const response = (animes as any[]).map((anime: any) => ({
    ...anime,
    genres: anime.categories,
  }));
  res.json(response);
}

// ID ile anime getir
export async function getAnimeById(req: Request, res: Response) {
  const { id } = req.params;
  const anime = await prisma.anime.findUnique({
    where: { id: Number(id) },
    include: { categories: true },
  });
  if (!anime) return res.status(404).json({ error: "Anime bulunamadı." });
  res.json({ ...(anime as any), genres: (anime as any).categories });
}

// Anime oluştur
export async function createAnime(req: Request, res: Response) {
  const {
    title,
    slug,
    description,
    releaseYear,
    type,
    status,
    imageUrl,
    bannerUrl,
    studios,
    trailerUrl,
    genres,
    rating,
  } = req.body;
  try {
    // createdById'yi token'dan al
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
    }
    const anime = await prisma.anime.create({
      data: {
        title,
        slug,
        description,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        type,
        status,
        imageUrl,
        bannerUrl,
        studios: studios ? (Array.isArray(studios) ? studios : [studios]) : [],
        trailerUrl,
        createdById: userId,
        // İlişkisel alanlar için ayrı endpointler önerilir
        rating: rating !== undefined ? Number(rating) : undefined,
        // Genres (categories)
        ...(genres !== undefined
          ? {
              categories: {
                connect: (Array.isArray(genres)
                  ? genres
                  : typeof genres === "string"
                  ? String(genres).split(",")
                  : [genres]
                )
                  .map((id: any) => Number(id))
                  .filter((n: any) => !isNaN(n))
                  .map((id: number) => ({ id })),
              },
            }
          : {}),
      },
    });
    res.status(201).json(anime);
  } catch (err) {
    res.status(500).json({
      error: "Anime oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime güncelle
export async function updateAnime(req: Request, res: Response) {
  const { id } = req.params;
  const {
    title,
    slug,
    description,
    releaseYear,
    type,
    status,
    imageUrl,
    bannerUrl,
    studios,
    trailerUrl,
    genres,
    rating,
  } = req.body;
  try {
    const anime = await prisma.anime.update({
      where: { id: Number(id) },
      data: {
        title,
        slug,
        description,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        type,
        status,
        imageUrl,
        bannerUrl,
        studios: studios ? (Array.isArray(studios) ? studios : [studios]) : [],
        trailerUrl,
        // İlişkisel alanlar için ayrı endpointler önerilir
        rating: rating !== undefined ? Number(rating) : undefined,
        // Genres (categories)
        ...(genres !== undefined
          ? {
              categories: {
                set: (Array.isArray(genres)
                  ? genres
                  : typeof genres === "string"
                  ? String(genres).split(",")
                  : [genres]
                )
                  .map((id: any) => Number(id))
                  .filter((n: any) => !isNaN(n))
                  .map((id: number) => ({ id })),
              },
            }
          : {}),
      },
    });
    res.json(anime);
  } catch (err) {
    res.status(500).json({
      error: "Anime güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime sil
export async function deleteAnime(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.anime.delete({ where: { id: Number(id) } });
    res.json({ message: "Anime silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Anime silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime arama ve filtreleme
export async function searchAnimes(req: Request, res: Response) {
  const {
    q,
    description,
    releaseYear,
    type,
    status,
    category,
    tag,
    minRating,
    maxRating,
    sort,
    order,
    page = 1,
    pageSize = 20,
  } = req.query;
  const where: any = {};
  if (q && typeof q === "string")
    where.title = { contains: q, mode: "insensitive" };
  if (description && typeof description === "string")
    where.description = { contains: description, mode: "insensitive" };
  if (releaseYear && !isNaN(Number(releaseYear)))
    where.releaseYear = Number(releaseYear);
  if (type && typeof type === "string") where.type = type;
  if (status && typeof status === "string") where.status = status;
  if (category && typeof category === "string")
    where.categories = { some: { name: { equals: category } } };
  if (tag && typeof tag === "string")
    where.tags = { some: { name: { equals: tag } } };
  try {
    let animes = await prisma.anime.findMany({
      where,
      include: { categories: true },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      orderBy:
        sort && typeof sort === "string"
          ? { [sort]: order === "asc" ? "asc" : "desc" }
          : { createdAt: "desc" },
    });
    // min/max rating filtreleri için js ile filtrele
    if (minRating && !isNaN(Number(minRating))) {
      animes = animes.filter((a: any) => {
        const avg = a.ratings.length
          ? a.ratings.reduce((sum: number, r: any) => sum + r.value, 0) /
            a.ratings.length
          : 0;
        return avg >= Number(minRating);
      });
    }
    if (maxRating && !isNaN(Number(maxRating))) {
      animes = animes.filter((a: any) => {
        const avg = a.ratings.length
          ? a.ratings.reduce((sum: number, r: any) => sum + r.value, 0) /
            a.ratings.length
          : 0;
        return avg <= Number(maxRating);
      });
    }
    const response = (animes as any[]).map((anime: any) => ({
      ...anime,
      genres: anime.categories,
    }));
    res.json(response);
  } catch (err) {
    res.status(500).json({
      error: "Arama sırasında hata oluştu.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Hızlı anime arama (autocomplete/lookup)
export async function lookupAnimes(req: Request, res: Response) {
  const { q, page = 1, limit = 10 } = req.query as any;
  try {
    const where: any = {};
    if (q && typeof q === "string") {
      where.title = { contains: q, mode: "insensitive" };
    }
    const animes = await prisma.anime.findMany({
      where,
      include: {
        seasons: {
          include: {
            episodes: {
              orderBy: { number: "asc" },
              select: {
                id: true,
                title: true,
                number: true,
                duration: true,
                thumbnail: true,
                videoUrl: true,
                viewCount: true,
                createdAt: true,
              },
            },
          },
          orderBy: { number: "asc" },
        },
        categories: true,
      },
      orderBy: { title: "asc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    res.json(animes);
  } catch (err) {
    res.status(500).json({
      error: "Anime arama yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Favori ekle
export async function addFavorite(req: Request, res: Response) {
  const { userId, animeId } = req.body;
  try {
    const favorite = await prisma.favorite.create({
      data: { userId, animeId },
    });
    res.status(201).json(favorite);
  } catch (err) {
    res.status(500).json({
      error: "Favori eklenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Favori çıkar
export async function removeFavorite(req: Request, res: Response) {
  const { userId, animeId } = req.body;
  try {
    await prisma.favorite.deleteMany({ where: { userId, animeId } });
    res.json({ message: "Favori çıkarıldı." });
  } catch (err) {
    res.status(500).json({
      error: "Favori çıkarılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// İzleme listesine ekle
export async function addWatchlist(req: Request, res: Response) {
  const { userId, animeId } = req.body;
  try {
    const watchlist = await prisma.watchlist.create({
      data: { userId, animeId },
    });
    res.status(201).json(watchlist);
  } catch (err) {
    res.status(500).json({
      error: "İzleme listesine eklenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// İzleme listesinden çıkar
export async function removeWatchlist(req: Request, res: Response) {
  const { userId, animeId } = req.body;
  try {
    await prisma.watchlist.deleteMany({ where: { userId, animeId } });
    res.json({ message: "İzleme listesinden çıkarıldı." });
  } catch (err) {
    res.status(500).json({
      error: "İzleme listesinden çıkarılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Puan ver
export async function rateAnime(req: Request, res: Response) {
  const { userId, animeId, value, review } = req.body;
  try {
    const rating = await prisma.rating.upsert({
      where: { userId_animeId: { userId, animeId } },
      update: { value, review },
      create: { userId, animeId, value, review },
    });
    res.json(rating);
  } catch (err) {
    res.status(500).json({
      error: "Puan verme sırasında hata oluştu.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime'yi öne çıkar
export async function setFeatured(req: Request, res: Response) {
  const { id } = req.params;

  try {
    // Kullanıcının admin yetkisi olup olmadığını kontrol et
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }

    // Anime'nin var olup olmadığını kontrol et
    const anime = await prisma.anime.findUnique({
      where: { id: Number(id) },
    });

    if (!anime) {
      return res.status(404).json({ error: "Anime bulunamadı." });
    }

    // Featured durumunu true yap
    const updatedAnime = await prisma.anime.update({
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
  } catch (err) {
    res.status(500).json({
      error: "Anime öne çıkarma durumu güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime'yi öne çıkarmadan çıkar
export async function removeFeatured(req: Request, res: Response) {
  const { id } = req.params;

  try {
    // Kullanıcının admin yetkisi olup olmadığını kontrol et
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
    }

    // Anime'nin var olup olmadığını kontrol et
    const anime = await prisma.anime.findUnique({
      where: { id: Number(id) },
    });

    if (!anime) {
      return res.status(404).json({ error: "Anime bulunamadı." });
    }

    // Featured durumunu false yap
    const updatedAnime = await prisma.anime.update({
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
  } catch (err) {
    res.status(500).json({
      error: "Anime öne çıkarma durumu güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Öne çıkarılan anime'leri getir
export async function getFeaturedAnimes(req: Request, res: Response) {
  try {
    const { limit = 10 } = req.query;

    const featuredAnimes = await prisma.anime.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Öne çıkarılan anime'ler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
