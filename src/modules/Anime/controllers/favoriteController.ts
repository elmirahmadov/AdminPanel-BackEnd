import { Request, Response } from "express";
import prisma from "../../../prisma";

// Kullanıcının favori animelerini getir
export async function getFavorites(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: Number(userId) },
      include: {
        anime: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({
      error: "Favoriler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime favorilere ekle
export async function addFavorite(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  const { animeId } = req.body;
  if (!animeId || isNaN(Number(animeId))) {
    return res.status(400).json({ error: "Geçerli bir animeId gereklidir." });
  }
  try {
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: Number(userId),
        animeId: Number(animeId),
      },
    });

    if (existingFavorite) {
      return res.status(409).json({ error: "Zaten favorilerde." });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: Number(userId),
        animeId: Number(animeId),
      },
      include: {
        anime: true,
      },
    });

    res.status(201).json(favorite);
  } catch (err) {
    res.status(500).json({
      error: "Favorilere eklenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Favorilerden çıkar
export async function removeFavorite(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  const { animeId } = req.body;
  if (!animeId || isNaN(Number(animeId))) {
    return res.status(400).json({ error: "Geçerli bir animeId gereklidir." });
  }
  try {
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: Number(userId),
        animeId: Number(animeId),
      },
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favori bulunamadı." });
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });
    res.json({ message: "Favorilerden çıkarıldı." });
  } catch (err) {
    res.status(500).json({
      error: "Favorilerden çıkarılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Anime favori durumunu kontrol et
export async function checkFavorite(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  const { animeId } = req.params;
  try {
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: Number(userId),
        animeId: Number(animeId),
      },
    });

    res.json({ isFavorite: !!favorite });
  } catch (err) {
    res.status(500).json({
      error: "Favori durumu kontrol edilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Favori istatistikleri
export async function getFavoriteStats(req: Request, res: Response) {
  const { userId } = req.params;
  try {
    const animeCount = await prisma.favorite.count({
      where: {
        userId: Number(userId),
        // schema gereği animeId zorunlu olduğundan doğrudan sayılabilir
      },
    });

    res.json({
      totalFavorites: animeCount,
      animeFavorites: animeCount,
    });
  } catch (err) {
    res.status(500).json({
      error: "Favori istatistikleri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
