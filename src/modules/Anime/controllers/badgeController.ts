import { Request, Response } from "express";
import prisma from "../../../prisma";

// Tüm rozetleri getir
export async function getAllBadges(req: Request, res: Response) {
  const badges = await prisma.badge.findMany({
    include: {
      userBadges: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(badges);
}

// Rozeti ID ile getir
export async function getBadgeById(req: Request, res: Response) {
  const { id } = req.params;
  const badge = await prisma.badge.findUnique({
    where: { id: Number(id) },
    include: {
      userBadges: {
        include: { user: true },
      },
    },
  });
  if (!badge) return res.status(404).json({ error: "Rozet bulunamadı." });
  res.json(badge);
}

// Rozet oluştur
export async function createBadge(req: Request, res: Response) {
  const { name, description, iconUrl, color, type, requirement } = req.body;
  try {
    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        iconUrl,
        type,
        requirement,
      },
    });
    res.status(201).json(badge);
  } catch (err) {
    res.status(500).json({
      error: "Rozet oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Rozet güncelle
export async function updateBadge(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description, iconUrl, color, type, requirement } = req.body;
  try {
    const badge = await prisma.badge.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        iconUrl,
        type,
        requirement,
      },
    });
    res.json(badge);
  } catch (err) {
    res.status(500).json({
      error: "Rozet güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Rozet sil
export async function deleteBadge(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.badge.delete({ where: { id: Number(id) } });
    res.json({ message: "Rozet silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Rozet silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcının rozetlerini getir
export async function getUserBadges(req: Request, res: Response) {
  const { userId } = req.params;
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: Number(userId) },
    include: {
      badge: true,
    },
    orderBy: { earnedAt: "desc" },
  });
  res.json(userBadges);
}

// Rozet istatistikleri
export async function getBadgeStats(req: Request, res: Response) {
  try {
    const totalBadges = await prisma.badge.count();
    const totalAwards = await prisma.userBadge.count();
    const mostPopularBadge = await prisma.userBadge.groupBy({
      by: ["badgeId"],
      _count: { badgeId: true },
      orderBy: { _count: { badgeId: "desc" } },
      take: 1,
    });

    res.json({
      totalBadges,
      totalAwards,
      mostPopularBadge: mostPopularBadge[0] || null,
    });
  } catch (err) {
    res.status(500).json({
      error: "Rozet istatistikleri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Rozet ver
export async function awardBadge(req: Request, res: Response) {
  const { userId, badgeId } = req.body;
  try {
    const existingBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: Number(userId),
          badgeId: Number(badgeId),
        },
      },
    });

    if (existingBadge) {
      return res
        .status(409)
        .json({ error: "Kullanıcı zaten bu rozete sahip." });
    }

    const userBadge = await prisma.userBadge.create({
      data: {
        userId: Number(userId),
        badgeId: Number(badgeId),
      },
      include: {
        user: true,
        badge: true,
      },
    });

    res.status(201).json(userBadge);
  } catch (err) {
    res.status(500).json({
      error: "Rozet verilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Rozet al
export async function removeBadge(req: Request, res: Response) {
  const { userId, badgeId } = req.body;
  try {
    await prisma.userBadge.delete({
      where: {
        userId_badgeId: {
          userId: Number(userId),
          badgeId: Number(badgeId),
        },
      },
    });
    res.json({ message: "Rozet kaldırıldı." });
  } catch (err) {
    res.status(500).json({
      error: "Rozet kaldırılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
