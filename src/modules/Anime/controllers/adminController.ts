import { Request, Response } from "express";
import prisma from "../../../prisma";
import { getNotificationService } from "../../../notifications/notification.service";
import logger from "../../../common/utils/logger";

// Tüm kullanıcıları getir (admin) - Sadece online olanları
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      include: {
        badges: {
          include: { badge: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reports: true,
        banHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcılar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tüm kullanıcıları getir (admin) - Online durumu ile birlikte
export async function getAllUsersWithOnlineStatus(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      include: {
        badges: {
          include: { badge: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reports: true,
        banHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Online durumunu ekle (WebSocket kaldırıldığı için hepsi false)
    const usersWithOnlineStatus = users.map((user: any) => ({
      ...user,
      isOnline: false,
      lastSeen: user.updatedAt,
    }));

    res.json(usersWithOnlineStatus);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcılar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı detayını getir (admin)
export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        badges: {
          include: { badge: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
        reports: true,
        banHistory: {
          orderBy: { createdAt: "desc" },
        },
        favorites: {
          include: { anime: true },
        },
        watchlist: {
          include: { anime: true },
        },
        ratings: {
          include: { anime: true },
        },
        comments: {
          include: { anime: true, episode: true },
        },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı rolünü güncelle (admin)
export async function updateUserRole(req: Request, res: Response) {
  const { id } = req.params;
  const { role } = req.body;
  const adminId = (req as any).user?.userId;

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      include: {
        badges: {
          include: { badge: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reports: true,
        banHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Kullanıcıya notification gönder
    const notificationService = getNotificationService();
    await notificationService.sendNotification({
      type: "SYSTEM",
      title: "Rol Güncellendi",
      message: `Rolünüz ${role} olarak güncellendi.`,
      userId: Number(id),
      data: { previousRole: user.role, newRole: role },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı rolü güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcıyı devre dışı bırak/etkinleştir (admin)
export async function toggleUserStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  const adminId = (req as any).user?.userId;

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        badges: {
          include: { badge: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reports: true,
        banHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Kullanıcıya notification gönder
    const notificationService = getNotificationService();
    await notificationService.sendNotification({
      type: "SYSTEM",
      title:
        status === "BANNED"
          ? "Hesabınız Devre Dışı Bırakıldı"
          : "Hesabınız Etkinleştirildi",
      message:
        status === "BANNED"
          ? "Hesabınız admin tarafından devre dışı bırakıldı."
          : "Hesabınız admin tarafından etkinleştirildi.",
      userId: Number(id),
      data: {
        status,
        updatedBy: adminId,
      },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı durumu güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcıyı banla (admin)
export async function banUser(req: Request, res: Response) {
  const { id } = req.params;
  const { reason, duration } = req.body;
  const adminId = (req as any).user?.userId;

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        status: "BANNED",
        banHistory: {
          create: {
            reason,
            bannedById: adminId,
            expiresAt: duration
              ? new Date(Date.now() + duration * 60 * 60 * 1000)
              : null,
          },
        },
      },
      include: {
        badges: {
          include: { badge: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reports: true,
        banHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Kullanıcıya notification gönder
    const notificationService = getNotificationService();
    await notificationService.sendNotification({
      type: "SYSTEM",
      title: "Hesabınız Devre Dışı Bırakıldı",
      message: `Hesabınız ${reason} nedeniyle devre dışı bırakıldı.${
        duration ? ` Süre: ${duration} saat` : ""
      }`,
      userId: Number(id),
      data: {
        reason,
        duration,
        bannedBy: adminId,
      },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı banlanamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcının banını kaldır (admin)
export async function unbanUser(req: Request, res: Response) {
  const { id } = req.params;
  const adminId = (req as any).user?.userId;

  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status: "ACTIVE" },
      include: {
        badges: {
          include: { badge: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        reports: true,
        banHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Kullanıcıya notification gönder
    const notificationService = getNotificationService();
    await notificationService.sendNotification({
      type: "SYSTEM",
      title: "Hesabınız Etkinleştirildi",
      message: "Hesabınız admin tarafından etkinleştirildi.",
      userId: Number(id),
      data: {
        unbannedBy: adminId,
      },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcının banı kaldırılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tüm raporları getir (admin)
export async function getAllReports(req: Request, res: Response) {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reportedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        handledBy: {
          select: {
            id: true,
            username: true,
          },
        },
        anime: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        forumPost: {
          select: {
            id: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({
      error: "Raporlar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Rapor durumunu güncelle (admin)
export async function updateReportStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status, handledById } = req.body;

  try {
    const report = await prisma.report.update({
      where: { id: Number(id) },
      data: {
        status,
        handledById: Number(handledById),
        handledAt: new Date(),
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        handledBy: {
          select: {
            id: true,
            username: true,
          },
        },
        anime: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        forumPost: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({
      error: "Rapor durumu güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Admin istatistiklerini getir - Gerçek zamanlı güncelleme
export async function getAdminStats(req: Request, res: Response) {
  try {
    const [
      totalUsers,
      bannedUsers,
      totalAnimes,
      totalComments,
      totalReports,
      pendingReports,
      totalViews,
    ] = await Promise.all([
      prisma.user.count(), // Toplam kayıtlı kullanıcı
      prisma.user.count({ where: { status: "BANNED" } }), // Banlanmış kullanıcılar
      prisma.anime.count(),
      prisma.comment.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.view.count(),
    ]);

    const stats = {
      totalUsers, // Toplam kayıtlı kullanıcı sayısı
      activeUsers: 0, // WebSocket kaldırıldığı için 0
      bannedUsers, // Banlanmış kullanıcılar
      onlineUsers: 0, // WebSocket kaldırıldığı için 0
      totalAnimes,
      totalComments,
      totalReports,
      pendingReports,
      totalViews,
      lastUpdated: new Date(),
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({
      error: "İstatistikler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı arama (admin)
export async function searchUsers(req: Request, res: Response) {
  const { query, role, status } = req.query;

  try {
    const where: any = {};

    if (query) {
      where.OR = [
        { username: { contains: query as string, mode: "insensitive" } },
        { email: { contains: query as string, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        badges: {
          include: { badge: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        reports: true,
        banHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı arama başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
