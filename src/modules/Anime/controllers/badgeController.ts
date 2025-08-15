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

// Kullanıcıya rozet ver
export async function awardBadgeToUser(req: Request, res: Response) {
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
        earnedAt: new Date(),
      },
      include: {
        badge: true,
        user: true,
      },
    });

    // Kullanıcıya rozet kazandığına dair bildirim gönder
    // await createNotification({
    //   userId: Number(userId),
    //   title: "Yeni Rozet Kazandınız! 🏆",
    //   message: `Tebrikler! "${userBadge.badge.name}" rozetini kazandınız!`,
    //   type: "BADGE",
    //   link: `/user/${userId}/badges`,
    //   data: {
    //     action: "badge_earned",
    //     badgeId: Number(badgeId),
    //     badgeName: userBadge.badge.name,
    //   },
    // });

    res.status(201).json(userBadge);
  } catch (err) {
    res.status(500).json({
      error: "Rozet verilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcıdan rozet al
export async function removeBadgeFromUser(req: Request, res: Response) {
  const { userId, badgeId } = req.params;
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

// Rozet arama
export async function searchBadges(req: Request, res: Response) {
  const { q, type } = req.query;
  const { page = 1, limit = 20 } = req.query;
  try {
    const where: any = {};

    if (q && typeof q === "string") {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    if (type && typeof type === "string") {
      where.type = type;
    }

    const badges = await prisma.badge.findMany({
      where,
      include: {
        userBadges: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.badge.count({ where });

    res.json({
      badges,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Rozet arama başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
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
      return res.status(409).json({ error: "Kullanıcı zaten bu rozete sahip." });
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
