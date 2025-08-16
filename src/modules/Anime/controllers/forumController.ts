import { Request, Response } from "express";
import prisma from "../../../prisma";
import {
  ForumService,
  TopicService,
  ReplyService,
  ModerationService,
  ForumCreateDto,
  TopicCreateDto,
  ReplyCreateDto,
} from "../services/forumService";

const forumService = new ForumService();
const topicService = new TopicService();
const replyService = new ReplyService();
const moderationService = new ModerationService();

// Notification işlemleri service üzerinden yönetilir

// ===== YENİ FORUM YÖNETİMİ FONKSİYONLARI =====

// Forum oluştur
export async function createForum(req: Request, res: Response) {
  try {
    const data: ForumCreateDto = {
      ...req.body,
      createdBy: (req as any).user?.userId || 1,
    };

    const forum = await forumService.createForum(data);
    res.status(201).json(forum);
  } catch (err) {
    res.status(500).json({
      error: "Forum oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum güncelle
export async function updateForum(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const forum = await forumService.updateForum(id, req.body);
    res.json(forum);
  } catch (err) {
    res.status(500).json({
      error: "Forum güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum sil
export async function deleteForum(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await forumService.deleteForum(id);
    res.json({ message: "Forum silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Forum silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum detayı ve istatistikleri
export async function getForumWithStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const forum = await forumService.getForumWithStats(id);

    if (!forum) {
      return res.status(404).json({ error: "Forum bulunamadı." });
    }

    res.json(forum);
  } catch (err) {
    res.status(500).json({
      error: "Forum detayları getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum arama
export async function searchForums(req: Request, res: Response) {
  try {
    const forums = await forumService.searchForums(req.query);
    res.json(forums);
  } catch (err) {
    res.status(500).json({
      error: "Forum arama yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tüm forumları listele (sadece aktif olanlar - client için)
export async function getAllForums(req: Request, res: Response) {
  try {
    const forums = await prisma.forum.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.json(forums);
  } catch (err) {
    res.status(500).json({
      error: "Forumlar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Admin için tüm forumları listele (aktif + pasif)
export async function getAllForumsAdmin(req: Request, res: Response) {
  try {
    const forums = await prisma.forum.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    res.json(forums);
  } catch (err) {
    res.status(500).json({
      error: "Forumlar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// ===== YENİ KONU YÖNETİMİ FONKSİYONLARI =====

// Konu oluştur (yeni servis ile)
export async function createTopicWithService(req: Request, res: Response) {
  try {
    const data: TopicCreateDto = {
      ...req.body,
      authorId: (req as any).user?.userId || 1,
      authorName: (req as any).user?.username || "Anonim",
    };

    const topic = await topicService.createTopic(req.body.forumId, data);
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({
      error: "Konu oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu güncelle (yeni servis ile)
export async function updateTopicWithService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const topic = await topicService.updateTopic(Number(id), req.body);
    res.json(topic);
  } catch (err) {
    res.status(500).json({
      error: "Konu güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu sil (yeni servis ile)
export async function deleteTopicWithService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await topicService.deleteTopic(Number(id));
    res.json({ message: "Konu silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Konu silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu ve yanıtları (yeni servis ile)
export async function getTopicWithReplies(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    const topic = await topicService.getTopicWithReplies(
      Number(id),
      Number(page)
    );

    if (!topic) {
      return res.status(404).json({ error: "Konu bulunamadı." });
    }

    res.json(topic);
  } catch (err) {
    res.status(500).json({
      error: "Konu detayları getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// ===== MEVCUT FONKSİYONLAR (KORUNACAK) =====

// Tüm forum kategorilerini getir
export async function getAllForumCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.forumCategory.findMany({
      include: {
        topics: {
          include: {
            user: true,
            posts: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({
      error: "Forum kategorileri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kategoriye ait konuları getir
export async function getTopicsByCategory(req: Request, res: Response) {
  const { categoryId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  try {
    const topics = await prisma.forumTopic.findMany({
      where: { categoryId: Number(categoryId) },
      include: {
        user: true,
        posts: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    res.json(topics);
  } catch (err) {
    res.status(500).json({
      error: "Konular getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu oluştur
export async function createTopic(req: Request, res: Response) {
  const { userId, categoryId, title, content, isPinned, isLocked } = req.body;
  try {
    const slug = String(title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    const topic = await prisma.forumTopic.create({
      data: {
        userId: Number(userId),
        categoryId: Number(categoryId),
        title,
        slug,
        content,
        isPinned: !!isPinned,
        isLocked: !!isLocked,
      },
      include: {
        user: true,
        category: true,
      },
    });

    // İlk postu oluştur
    await prisma.forumPost.create({
      data: {
        userId: Number(userId),
        topicId: topic.id,
        content,
      },
    });

    // Opsiyonel: kategori yöneticilerine bildirim gönderimi ayrı servis ile yapılabilir

    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({
      error: "Konu oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu güncelle
export async function updateTopic(req: Request, res: Response) {
  const { id } = req.params;
  const { title, isPinned, isLocked } = req.body;
  try {
    const topic = await prisma.forumTopic.update({
      where: { id: Number(id) },
      data: {
        title,
        isPinned: !!isPinned,
        isLocked: !!isLocked,
      },
      include: {
        user: true,
        category: true,
      },
    });
    res.json(topic);
  } catch (err) {
    res.status(500).json({
      error: "Konu güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu sil
export async function deleteTopic(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.forumTopic.delete({ where: { id: Number(id) } });
    res.json({ message: "Konu silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Konu silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konuya ait postları getir
export async function getPostsByTopic(req: Request, res: Response) {
  const { topicId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  try {
    const posts = await prisma.forumPost.findMany({
      where: { topicId: Number(topicId) },
      include: {
        user: true,
        topic: true,
        reports: true,
      },
      orderBy: { createdAt: "asc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({
      error: "Postlar getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Post oluştur
export async function createPost(req: Request, res: Response) {
  const { userId, topicId, content } = req.body;
  try {
    const post = await prisma.forumPost.create({
      data: {
        userId: Number(userId),
        topicId: Number(topicId),
        content,
      },
      include: {
        user: true,
        topic: {
          include: {
            user: true,
          },
        },
      },
    });

    // Konu sahibine bildirim gönder (eğer post sahibi konu sahibi değilse)
    if (post.topic.userId !== Number(userId)) {
      // Bildirim gönderimi notification servisi ile yapılabilir (opsiyonel)
    }

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({
      error: "Post oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Post güncelle
export async function updatePost(req: Request, res: Response) {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const post = await prisma.forumPost.update({
      where: { id: Number(id) },
      data: {
        content,
        isEdited: true,
      },
      include: {
        user: true,
        topic: true,
      },
    });
    res.json(post);
  } catch (err) {
    res.status(500).json({
      error: "Post güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Post sil
export async function deletePost(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.forumPost.delete({ where: { id: Number(id) } });
    res.json({ message: "Post silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Post silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum arama
export async function searchForum(req: Request, res: Response) {
  const { q, categoryId, userId, type = "all" } = req.query;
  const { page = 1, limit = 20 } = req.query;
  try {
    let results: any = {};

    if (type === "all" || type === "topics") {
      const topics = await prisma.forumTopic.findMany({
        where: {
          title: { contains: q as string, mode: "insensitive" },
          categoryId: categoryId ? Number(categoryId) : undefined,
          userId: userId ? Number(userId) : undefined,
        },
        include: {
          user: true,
          category: true,
          posts: { include: { user: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });
      results.topics = topics;
    }

    if (type === "all" || type === "posts") {
      const posts = await prisma.forumPost.findMany({
        where: {
          content: { contains: q as string, mode: "insensitive" },
          userId: userId ? Number(userId) : undefined,
        },
        include: {
          user: true,
          topic: { include: { category: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });
      results.posts = posts;
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({
      error: "Forum arama yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum kategorisi detayını getir
export async function getForumCategoryById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const category = await prisma.forumCategory.findUnique({
      where: { id: Number(id) },
      include: {
        topics: {
          include: {
            user: true,
            posts: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Forum kategorisi bulunamadı." });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({
      error: "Forum kategorisi getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tüm forum konularını getir
export async function getAllForumTopics(req: Request, res: Response) {
  try {
    const topics = await prisma.forumTopic.findMany({
      include: {
        user: true,
        category: true,
        posts: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(topics);
  } catch (err) {
    res.status(500).json({
      error: "Forum konuları getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum konusu oluştur
export async function createForumTopic(req: Request, res: Response) {
  const { categoryId, forumId, title, content, tags } = req.body;
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  // Forum ID veya Category ID'den en az biri gerekli
  if (!forumId && !categoryId) {
    return res.status(400).json({
      error: "forumId veya categoryId gerekli.",
    });
  }

  try {
    const slug = String(title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Konu oluştur
    const topic = await prisma.forumTopic.create({
      data: {
        userId: Number(userId),
        categoryId: categoryId ? Number(categoryId) : undefined,
        forumId: forumId || undefined,
        title,
        slug,
        content,
        tags: tags || [],
      },
      include: {
        user: true,
        category: true,
        forum: true,
      },
    });

    // İlk post'u oluştur
    const post = await prisma.forumPost.create({
      data: {
        topicId: topic.id,
        userId: Number(userId),
        content,
      },
      include: {
        user: true,
        topic: true,
      },
    });

    res.status(201).json({ topic, post });
  } catch (err) {
    res.status(500).json({
      error: "Forum konusu oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum konusu güncelle
export async function updateForumTopic(req: Request, res: Response) {
  const { id } = req.params;
  const { title } = req.body;
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  try {
    const topic = await prisma.forumTopic.findUnique({
      where: { id: Number(id) },
    });

    if (!topic) {
      return res.status(404).json({ error: "Forum konusu bulunamadı." });
    }

    if (topic.userId !== Number(userId)) {
      return res.status(403).json({ error: "Bu konuyu güncelleyemezsiniz." });
    }

    const updatedTopic = await prisma.forumTopic.update({
      where: { id: Number(id) },
      data: { title },
      include: {
        user: true,
        category: true,
      },
    });

    res.json(updatedTopic);
  } catch (err) {
    res.status(500).json({
      error: "Forum konusu güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum konusu sil
export async function deleteForumTopic(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  try {
    const topic = await prisma.forumTopic.findUnique({
      where: { id: Number(id) },
    });

    if (!topic) {
      return res.status(404).json({ error: "Forum konusu bulunamadı." });
    }

    if (topic.userId !== Number(userId)) {
      return res.status(403).json({ error: "Bu konuyu silemezsiniz." });
    }

    await prisma.forumTopic.delete({ where: { id: Number(id) } });
    res.json({ message: "Forum konusu silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Forum konusu silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Tüm forum post'larını getir
export async function getAllForumPosts(req: Request, res: Response) {
  try {
    const posts = await prisma.forumPost.findMany({
      include: {
        user: true,
        topic: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({
      error: "Forum post'ları getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum post detayını getir
export async function getForumPostById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
        topic: {
          include: { category: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Forum post'u bulunamadı." });
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({
      error: "Forum post'u getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum post oluştur
export async function createForumPost(req: Request, res: Response) {
  const { topicId, content } = req.body;
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  try {
    const post = await prisma.forumPost.create({
      data: {
        topicId: Number(topicId),
        userId: Number(userId),
        content,
      },
      include: {
        user: true,
        topic: {
          include: { category: true },
        },
      },
    });

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({
      error: "Forum post'u oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum post güncelle
export async function updateForumPost(req: Request, res: Response) {
  const { id } = req.params;
  const { content } = req.body;
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: Number(id) },
    });

    if (!post) {
      return res.status(404).json({ error: "Forum post'u bulunamadı." });
    }

    if (post.userId !== Number(userId)) {
      return res.status(403).json({ error: "Bu post'u güncelleyemezsiniz." });
    }

    const updatedPost = await prisma.forumPost.update({
      where: { id: Number(id) },
      data: {
        content,
        isEdited: true,
      },
      include: {
        user: true,
        topic: {
          include: { category: true },
        },
      },
    });

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({
      error: "Forum post'u güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Forum post sil
export async function deleteForumPost(req: Request, res: Response) {
  const { id } = req.params;
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
  }

  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: Number(id) },
    });

    if (!post) {
      return res.status(404).json({ error: "Forum post'u bulunamadı." });
    }

    if (post.userId !== Number(userId)) {
      return res.status(403).json({ error: "Bu post'u silemezsiniz." });
    }

    await prisma.forumPost.delete({ where: { id: Number(id) } });
    res.json({ message: "Forum post'u silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Forum post'u silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Belirli konuyu getir
export async function getForumTopic(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const topic = await prisma.forumTopic.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        category: true,
        forum: true,
        posts: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!topic) {
      return res.status(404).json({ error: "Konu bulunamadı." });
    }

    res.json(topic);
  } catch (err) {
    res.status(500).json({
      error: "Konu getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Admin için tüm konuları listele (detaylı bilgilerle)
export async function getAllForumTopicsAdmin(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, status, categoryId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = Number(categoryId);

    const topics = await prisma.forumTopic.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        category: true,
        forum: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: [
        { isSticky: "desc" },
        { lastReplyAt: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: Number(limit),
    });

    const total = await prisma.forumTopic.count({ where });

    res.json({
      topics,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Konular getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Belirli bir forumun konularını getir
export async function getTopicsByForum(req: Request, res: Response) {
  try {
    const { forumId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { forumId };
    if (status) where.status = status;

    const topics = await prisma.forumTopic.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        category: true,
        forum: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: [
        { isSticky: "desc" },
        { lastReplyAt: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take: Number(limit),
    });

    const total = await prisma.forumTopic.count({ where });

    res.json({
      topics,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({
      error: "Forum konuları getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu sabitle/kaldır
export async function pinTopic(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const topic = await prisma.forumTopic.findUnique({
      where: { id: Number(id) },
    });

    if (!topic) {
      return res.status(404).json({ error: "Konu bulunamadı." });
    }

    const updatedTopic = await prisma.forumTopic.update({
      where: { id: Number(id) },
      data: { isPinned: !topic.isPinned },
    });

    res.json({
      message: updatedTopic.isPinned
        ? "Konu sabitlendi."
        : "Konu sabitlemesi kaldırıldı.",
      topic: updatedTopic,
    });
  } catch (err) {
    res.status(500).json({
      error: "Konu sabitlenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu kilitle/aç
export async function lockTopic(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // ID validasyonu ekle
    if (!id || id === "undefined" || isNaN(Number(id))) {
      return res.status(400).json({
        error: "Geçersiz konu ID'si.",
        receivedId: id,
      });
    }

    const topic = await prisma.forumTopic.findUnique({
      where: { id: Number(id) },
    });

    if (!topic) {
      return res.status(404).json({ error: "Konu bulunamadı." });
    }

    const updatedTopic = await prisma.forumTopic.update({
      where: { id: Number(id) },
      data: { isLocked: !topic.isLocked },
    });

    res.json({
      message: updatedTopic.isLocked
        ? "Konu kilitlendi."
        : "Konu kilidi açıldı.",
      topic: updatedTopic,
    });
  } catch (err) {
    res.status(500).json({
      error: "Konu kilitlenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Konu yapışkan yap/kaldır
export async function stickyTopic(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const topic = await prisma.forumTopic.findUnique({
      where: { id: Number(id) },
    });

    if (!topic) {
      return res.status(404).json({ error: "Konu bulunamadı." });
    }

    const updatedTopic = await prisma.forumTopic.update({
      where: { id: Number(id) },
      data: { isSticky: !topic.isSticky },
    });

    res.json({
      message: updatedTopic.isSticky
        ? "Konu yapışkan yapıldı."
        : "Konu yapışkanlığı kaldırıldı.",
      topic: updatedTopic,
    });
  } catch (err) {
    res.status(500).json({
      error: "Konu yapışkan yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
