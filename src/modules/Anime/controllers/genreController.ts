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
