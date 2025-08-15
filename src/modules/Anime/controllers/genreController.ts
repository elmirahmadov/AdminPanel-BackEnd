import { Request, Response } from "express";
import prisma from "../../../prisma";

function slugify(value: string): string {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Tüm türleri getir
export async function getAllGenres(req: Request, res: Response) {
  try {
    const genres = await prisma.category.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Türler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tür detayını getir
export async function getGenreById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const genre = await prisma.category.findUnique({
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
  } catch (err) {
    res.status(500).json({
      error: "Tür getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tür oluştur
export async function createGenre(req: Request, res: Response) {
  const { name, description } = req.body;
  try {
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "'name' alanı zorunludur." });
    }
    const genre = await prisma.category.create({
      data: {
        name,
        slug: slugify(name),
        description,
      },
    });
    res.status(201).json(genre);
  } catch (err) {
    res.status(500).json({
      error: "Tür oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tür güncelle
export async function updateGenre(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const data: { name?: string; slug?: string; description?: string } = {};
    if (typeof name === "string" && name.trim().length > 0) {
      data.name = name;
      data.slug = slugify(name);
    }
    if (typeof description === "string") {
      data.description = description;
    }

    const genre = await prisma.category.update({
      where: { id: Number(id) },
      data,
    });
    res.json(genre);
  } catch (err) {
    res.status(500).json({
      error: "Tür güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tür sil
export async function deleteGenre(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.category.delete({ where: { id: Number(id) } });
    res.json({ message: "Tür silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Tür silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tür arama
export async function searchGenres(req: Request, res: Response) {
  const { q } = req.query;
  const { page = 1, limit = 20 } = req.query;
  try {
    const where: any = {};

    if (q && typeof q === "string") {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const genres = await prisma.category.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Tür arama yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tür istatistikleri
export async function getGenreStats(req: Request, res: Response) {
  try {
    const totalGenres = await prisma.category.count();
    const genresWithAnimeCount = await prisma.category.findMany({
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
  } catch (err) {
    res.status(500).json({
      error: "Tür istatistikleri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
