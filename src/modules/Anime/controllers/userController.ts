import { Request, Response } from "express";
import prisma from "../../../prisma";

// Tüm kullanıcıları getir
export async function getAllUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    include: {
      badges: { include: { badge: true } },
      tasks: { include: { task: true } },
      favorites: true,
      watchlist: true,
      ratings: true,
      activities: true,
      banHistory: true,
      notifications: true,
      reports: true,
      handledReports: true,
      reportedUser: true,
      forumTopics: true,
      forumPosts: true,
      createdAnimes: true,
      approvedAnimes: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
}

// Kullanıcıyı ID ile getir
export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: {
      badges: { include: { badge: true } },
      tasks: { include: { task: true } },
      favorites: true,
      watchlist: true,
      ratings: true,
      activities: true,
      banHistory: true,
      notifications: true,
      reports: true,
      handledReports: true,
      reportedUser: true,
      forumTopics: true,
      forumPosts: true,
      createdAnimes: true,
      approvedAnimes: true,
    },
  });
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  res.json(user);
}

// Kullanıcı oluştur
export async function createUser(req: Request, res: Response) {
  const { username, email, password, profileImage, bio, role, status } =
    req.body;
  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password,
        profileImage,
        bio,
        role,
        status,
      },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı güncelle
export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { username, email, profileImage, bio, role, status } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        username,
        email,
        profileImage,
        bio,
        role,
        status,
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı sil
export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: "Kullanıcı silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Takip et
export async function followUser(req: Request, res: Response) {
  const { followerId, followingId } = req.body;
  try {
    // Önce kullanıcıların var olup olmadığını kontrol et
    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { id: followerId } }),
      prisma.user.findUnique({ where: { id: followingId } }),
    ]);

    if (!follower || !following) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    // Zaten takip ediliyor mu kontrol et
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return res.status(409).json({ error: "Zaten takip ediliyor." });
    }

    const follow = await prisma.userFollow.create({
      data: { followerId, followingId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        following: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    // Takip edilen kullanıcıya bildirim gönder
    // await createNotification({
    //   userId: followingId,
    //   title: "Yeni Takipçi",
    //   message: `${follower.username} sizi takip etmeye başladı!`,
    //   type: "USER",
    //   senderId: followerId,
    //   link: `/user/${followerId}`,
    //   data: {
    //     action: "follow",
    //     followerId,
    //     followerUsername: follower.username,
    //   },
    // });

    res.status(201).json(follow);
  } catch (err) {
    res.status(500).json({
      error: "Takip işlemi başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Takipten çık
export async function unfollowUser(req: Request, res: Response) {
  const { followerId, followingId } = req.body;
  try {
    await prisma.userFollow.deleteMany({ where: { followerId, followingId } });
    res.json({ message: "Takipten çıkıldı." });
  } catch (err) {
    res.status(500).json({
      error: "Takipten çıkılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Takipçi listesi
export async function getFollowers(req: Request, res: Response) {
  const { userId } = req.params;
  const followers = await prisma.userFollow.findMany({
    where: { followingId: Number(userId) },
    include: { follower: true },
  });
  res.json(followers.map((f: any) => f.follower));
}

// Takip edilenler listesi
export async function getFollowing(req: Request, res: Response) {
  const { userId } = req.params;
  const following = await prisma.userFollow.findMany({
    where: { followerId: Number(userId) },
    include: { following: true },
  });
  res.json(following.map((f: any) => f.following));
}

// Kullanıcı aktiviteleri
export async function getUserActivities(req: Request, res: Response) {
  const { userId } = req.params;
  const activities = await prisma.userActivity.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(activities);
}

// Kullanıcı profilini getir
export async function getUserProfile(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: {
        badges: { include: { badge: true } },
        tasks: { include: { task: true } },
        favorites: true,
        watchlist: true,
        ratings: true,
        activities: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı profili getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı profilini güncelle
export async function updateUserProfile(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user?.userId;

  if (Number(id) !== userId) {
    return res
      .status(403)
      .json({ error: "Kendi profilinizi güncelleyebilirsiniz." });
  }

  const { username, bio, profileImage } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        username,
        bio,
        profileImage,
      },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({
      error: "Profil güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı istatistikleri
export async function getUserStats(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const [favoritesCount, watchlistCount, ratingsCount, commentsCount] =
      await Promise.all([
        prisma.favorite.count({ where: { userId: Number(id) } }),
        prisma.watchlist.count({ where: { userId: Number(id) } }),
        prisma.rating.count({ where: { userId: Number(id) } }),
        prisma.comment.count({ where: { userId: Number(id) } }),
      ]);

    res.json({
      favoritesCount,
      watchlistCount,
      ratingsCount,
      commentsCount,
    });
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı istatistikleri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı favorileri
export async function getUserFavorites(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: Number(id) },
      include: {
        anime: true,
      },
    });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı favorileri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı watchlist'i
export async function getUserWatchlist(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: Number(id) },
      include: {
        anime: true,
      },
    });
    res.json(watchlist);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı watchlist'i getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı rating'leri
export async function getUserRatings(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const ratings = await prisma.rating.findMany({
      where: { userId: Number(id) },
      include: {
        anime: true,
      },
    });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı rating'leri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı yorumları
export async function getUserComments(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { userId: Number(id) },
      include: {
        anime: true,
        episode: true,
      },
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı yorumları getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
