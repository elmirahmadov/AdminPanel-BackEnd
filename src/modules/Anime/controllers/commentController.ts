import { Request, Response } from "express";
import prisma from "../../../prisma";
// Bildirimler notification.service üstünden yönetiliyor; doğrudan controller export'u yok

// Yorum detayını getir
export async function getCommentById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
        anime: true,
        season: true,
        episode: true,
        parent: true,
        replies: {
          include: {
            user: true,
          },
        },
        reports: true,
      },
    });

    if (!comment) {
      return res.status(404).json({ error: "Yorum bulunamadı." });
    }

    res.json(comment);
  } catch (err) {
    res.status(500).json({
      error: "Yorum getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Yorumları animeye göre getir
export async function getCommentsByAnime(req: Request, res: Response) {
  try {
    const { animeId } = req.params;
    const { page = 1, limit = 20, status = "APPROVED" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Sadece onaylanmış yorumları getir (client-side için)
    const where: any = {
      animeId: Number(animeId),
      parentId: null, // Sadece ana yorumlar
      status: status === "ALL" ? undefined : status,
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          replies: {
            where: { status: "APPROVED" }, // Sadece onaylanmış yanıtlar
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.comment.count({ where }),
    ]);

    res.json({
      comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Anime yorumları getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Yorumları bölüme göre getir
export async function getCommentsByEpisode(req: Request, res: Response) {
  try {
    const { episodeId } = req.params;
    const { page = 1, limit = 20, status = "APPROVED" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Sadece onaylanmış yorumları getir (client-side için)
    const where: any = {
      episodeId: Number(episodeId),
      parentId: null, // Sadece ana yorumlar
      status: status === "ALL" ? undefined : status,
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
          replies: {
            where: { status: "APPROVED" }, // Sadece onaylanmış yanıtlar
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.comment.count({ where }),
    ]);

    res.json({
      comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Bölüm yorumları getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Yorum oluştur
export async function createComment(req: Request, res: Response) {
  const { animeId, seasonId, episodeId, content, parentId, isSpoiler } =
    req.body;

  // userId'yi token'dan al
  const userId = (req as any).user?.userId;
  if (!userId) {
    return res.status(401).json({
      error: "Kullanıcı kimliği bulunamadı.",
    });
  }

  try {
    // Validation: En az animeId olmalı
    if (!animeId) {
      return res.status(400).json({
        error: "Anime ID gerekli.",
      });
    }

    // Eğer episodeId verilmişse, seasonId da olmalı
    if (episodeId && !seasonId) {
      return res.status(400).json({
        error: "Bölüm yorumu için sezon ID gerekli.",
      });
    }

    // Eğer seasonId verilmişse, o sezonun anime'ye ait olduğunu kontrol et
    if (seasonId) {
      const season = await prisma.season.findUnique({
        where: {
          id: Number(seasonId),
          animeId: Number(animeId),
        },
      });

      if (!season) {
        return res.status(400).json({
          error: "Bu sezon bu anime'ye ait değil.",
        });
      }

      // Eğer episodeId verilmişse, o bölümün sezona ait olduğunu kontrol et
      if (episodeId) {
        const episode = await prisma.episode.findUnique({
          where: {
            id: Number(episodeId),
            seasonId: Number(seasonId),
            animeId: Number(animeId),
          },
        });

        if (!episode) {
          return res.status(400).json({
            error: "Bu bölüm bu sezona ait değil.",
          });
        }
      }
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        animeId: Number(animeId),
        seasonId: seasonId ? Number(seasonId) : null,
        episodeId: episodeId ? Number(episodeId) : null,
        content,
        parentId,
        isSpoiler: !!isSpoiler,
      },
      include: {
        user: true,
        replies: true,
        anime: true,
        season: true,
        episode: true,
        parent: true,
      },
    });

    // Eğer bu bir yanıtsa, orijinal yorum sahibine bildirim gönder
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { user: true },
      });

      if (parentComment && parentComment.userId !== userId) {
        // Bildirim gönderimi notification servisinden yapılabilir (opsiyonel)
      }
    } else {
      // Eğer bu yeni bir yorumsa ve anime sahibi varsa, anime sahibine bildirim gönder
      if (animeId) {
        const anime = await prisma.anime.findUnique({
          where: { id: animeId },
          include: { createdBy: true },
        });

        if (anime && anime.createdById !== userId) {
          // Bildirim gönderimi notification servisinden yapılabilir (opsiyonel)
        }
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({
      error: "Yorum oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Yorum güncelle
export async function updateComment(req: Request, res: Response) {
  const { id } = req.params;
  const { content, isSpoiler } = req.body;
  try {
    const comment = await prisma.comment.update({
      where: { id: Number(id) },
      data: {
        content,
        isSpoiler: !!isSpoiler,
        isEdited: true,
      },
      include: { user: true, replies: true },
    });
    res.json(comment);
  } catch (err) {
    res.status(500).json({
      error: "Yorum güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Yorum sil
export async function deleteComment(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: Number(id) },
    });

    if (!comment) {
      return res.status(404).json({ error: "Yorum bulunamadı." });
    }

    await prisma.comment.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Yorum başarıyla silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Yorum silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Yorum yönetimi (admin ve moderatör için)
export async function getAllComments(req: Request, res: Response) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      reported,
      animeId,
      userId,
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (status) where.status = status;
    if (reported === "true") where.reports = { some: {} };
    if (animeId) where.animeId = Number(animeId);
    if (userId) where.userId = Number(userId);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              status: true,
            },
          },
          anime: {
            select: {
              id: true,
              title: true,
            },
          },
          season: {
            select: {
              id: true,
              name: true,
            },
          },
          episode: {
            select: {
              id: true,
              title: true,
              number: true,
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  role: true,
                },
              },
            },
          },
          reports: {
            include: {
              reportedBy: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.comment.count({ where }),
    ]);

    res.json({
      comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Yorumlar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Yorumlarda arama yap (admin ve moderatör için)
export async function searchComments(req: Request, res: Response) {
  try {
    const { q, page = 1, limit = 20, status, animeId, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!q) {
      return res.status(400).json({ error: "Arama terimi gerekli." });
    }

    const where: any = {
      OR: [
        { content: { contains: String(q), mode: "insensitive" } },
        { user: { username: { contains: String(q), mode: "insensitive" } } },
        { anime: { title: { contains: String(q), mode: "insensitive" } } },
      ],
    };

    if (status) where.status = status;
    if (animeId) where.animeId = Number(animeId);
    if (userId) where.userId = Number(userId);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              status: true,
            },
          },
          anime: {
            select: {
              id: true,
              title: true,
            },
          },
          reports: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.comment.count({ where }),
    ]);

    res.json({
      comments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      searchTerm: q,
    });
  } catch (err) {
    res.status(500).json({
      error: "Yorum araması yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Yorum moderasyonu (admin ve moderatör için)
export async function moderateComment(req: Request, res: Response) {
  const { id } = req.params;
  const { action, reason, moderationNote } = req.body;

  try {
    let comment;

    switch (action) {
      case "APPROVE":
        comment = await prisma.comment.update({
          where: { id: Number(id) },
          data: {
            status: "APPROVED",
            moderationNote: moderationNote || null,
            moderatedAt: new Date(),
            moderatedBy: (req as any).user.id,
          },
        });
        break;

      case "REJECT":
        comment = await prisma.comment.update({
          where: { id: Number(id) },
          data: {
            status: "REJECTED",
            moderationNote: moderationNote || null,
            moderatedAt: new Date(),
            moderatedBy: (req as any).user.id,
          },
        });
        break;

      case "HIDE":
        comment = await prisma.comment.update({
          where: { id: Number(id) },
          data: {
            status: "HIDDEN",
            moderationNote: moderationNote || null,
            moderatedAt: new Date(),
            moderatedBy: (req as any).user.id,
          },
        });
        break;

      default:
        return res.status(400).json({ error: "Geçersiz moderasyon aksiyonu." });
    }

    res.json({
      message: `Yorum ${action.toLowerCase()} edildi.`,
      comment,
    });
  } catch (err) {
    res.status(500).json({
      error: "Yorum moderasyonu yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
