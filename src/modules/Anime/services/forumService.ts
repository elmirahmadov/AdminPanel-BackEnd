import { PrismaClient } from '@prisma/client';
import { Forum, ForumTopic, ForumPost, UserForumActivity, ModerationQueue } from '@prisma/client';

const prisma = new PrismaClient();

export interface ForumCreateDto {
  title: string;
  description?: string;
  category: string;
  rules?: string;
  icon?: string;
  order?: number;
  createdBy: number;
  moderators?: number[];
}

export interface ForumUpdateDto {
  title?: string;
  description?: string;
  category?: string;
  rules?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
  moderators?: number[];
}

export interface TopicCreateDto {
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  tags?: string[];
  forumId?: string;
  categoryId: number;
}

export interface TopicUpdateDto {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface ReplyCreateDto {
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  parentReplyId?: number;
}

export interface ReplyUpdateDto {
  content: string;
  editedBy: string;
}

export interface ForumWithStats extends Forum {
  topicCount: number;
  postCount: number;
  lastTopic?: ForumTopic;
  userCount: number;
}

export interface TopicWithReplies extends ForumTopic {
  replies: ForumPost[];
  author: {
    id: number;
    username: string;
    profileImage?: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface ForumSearchQuery {
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TopicSearchQuery {
  forumId?: string;
  categoryId?: number;
  authorId?: number;
  search?: string;
  status?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export class ForumService {
  // Forum oluşturma
  async createForum(data: ForumCreateDto): Promise<Forum> {
    const forum = await prisma.forum.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        rules: data.rules,
        icon: data.icon,
        order: data.order || 0,
        createdBy: data.createdBy,
        moderators: data.moderators || [],
      },
    });

    return forum;
  }

  // Forum güncelleme
  async updateForum(id: string, data: ForumUpdateDto): Promise<Forum> {
    const forum = await prisma.forum.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        rules: data.rules,
        icon: data.icon,
        order: data.order,
        isActive: data.isActive,
        moderators: data.moderators,
        updatedAt: new Date(),
      },
    });

    return forum;
  }

  // Forum silme
  async deleteForum(id: string): Promise<void> {
    await prisma.forum.delete({
      where: { id },
    });
  }

  // Forum detayı ve istatistikleri
  async getForumWithStats(id: string): Promise<ForumWithStats | null> {
    const forum = await prisma.forum.findUnique({
      where: { id },
      include: {
        topics: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
        },
        userRoles: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!forum) return null;

    const userCount = forum.userRoles.length;
    const lastTopic = forum.topics[0];

    return {
      ...forum,
      lastTopic,
      userCount,
    };
  }

  // Forum arama
  async searchForums(query: ForumSearchQuery): Promise<Forum[]> {
    const { category, isActive, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const forums = await prisma.forum.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    });

    return forums;
  }

  // Tüm forumları listele
  async getAllForums(): Promise<Forum[]> {
    return await prisma.forum.findMany({
      where: { isActive: true },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Forum kategorilerini getir
  async getForumCategories(): Promise<any[]> {
    return await prisma.forumCategory.findMany({
      where: { parentId: null },
      include: {
        subcategories: true,
        _count: {
          select: {
            topics: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }
}

export class TopicService {
  // Konu oluşturma
  async createTopic(forumId: string, data: TopicCreateDto): Promise<ForumTopic> {
    const topic = await prisma.forumTopic.create({
      data: {
        title: data.title,
        content: data.content,
        userId: data.authorId,
        categoryId: data.categoryId,
        forumId: data.forumId,
        tags: data.tags || [],
        slug: this.generateSlug(data.title),
      },
    });

    // Forum istatistiklerini güncelle
    if (data.forumId) {
      await prisma.forum.update({
        where: { id: data.forumId },
        data: {
          topicCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });
    }

    return topic;
  }

  // Konu güncelleme
  async updateTopic(id: number, data: TopicUpdateDto): Promise<ForumTopic> {
    const topic = await prisma.forumTopic.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags,
        updatedAt: new Date(),
      },
    });

    return topic;
  }

  // Konu silme
  async deleteTopic(id: number): Promise<void> {
    const topic = await prisma.forumTopic.findUnique({
      where: { id },
      select: { forumId: true },
    });

    await prisma.forumTopic.delete({
      where: { id },
    });

    // Forum istatistiklerini güncelle
    if (topic?.forumId) {
      await prisma.forum.update({
        where: { id: topic.forumId },
        data: {
          topicCount: { decrement: 1 },
          updatedAt: new Date(),
        },
      });
    }
  }

  // Konu ve yanıtları
  async getTopicWithReplies(id: number, page: number = 1): Promise<TopicWithReplies | null> {
    const limit = 20;
    const skip = (page - 1) * limit;

    const topic = await prisma.forumTopic.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        posts: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!topic) return null;

    // Görüntülenme sayısını artır
    await prisma.forumTopic.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return topic as TopicWithReplies;
  }

  // Konu arama
  async searchTopics(query: TopicSearchQuery): Promise<ForumTopic[]> {
    const { forumId, categoryId, authorId, search, status, tags, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (forumId) where.forumId = forumId;
    if (categoryId) where.categoryId = categoryId;
    if (authorId) where.userId = authorId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const topics = await prisma.forumTopic.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { isSticky: 'desc' },
        { lastReplyAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return topics;
  }

  // Konu sabitleme
  async pinTopic(id: number): Promise<void> {
    await prisma.forumTopic.update({
      where: { id },
      data: { isPinned: true },
    });
  }

  // Konu kilitleme
  async lockTopic(id: number): Promise<void> {
    await prisma.forumTopic.update({
      where: { id },
      data: { isLocked: true },
    });
  }

  // Konu yapışkan yapma
  async stickyTopic(id: number): Promise<void> {
    await prisma.forumTopic.update({
      where: { id },
      data: { isSticky: true },
    });
  }

  // Slug oluşturma
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}

export class ReplyService {
  // Yanıt oluşturma
  async createReply(topicId: number, data: ReplyCreateDto): Promise<ForumPost> {
    const reply = await prisma.forumPost.create({
      data: {
        content: data.content,
        topicId,
        userId: data.authorId,
        parentReplyId: data.parentReplyId,
      },
    });

    // Konu istatistiklerini güncelle
    await prisma.forumTopic.update({
      where: { id: topicId },
      data: {
        postCount: { increment: 1 },
        lastReplyAt: new Date(),
        lastReplyBy: data.authorName,
      },
    });

    // Forum istatistiklerini güncelle
    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId },
      select: { forumId: true },
    });

    if (topic?.forumId) {
      await prisma.forum.update({
        where: { id: topic.forumId },
        data: {
          postCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });
    }

    return reply;
  }

  // Yanıt güncelleme
  async updateReply(id: number, data: ReplyUpdateDto): Promise<ForumPost> {
    const reply = await prisma.forumPost.update({
      where: { id },
      data: {
        content: data.content,
        isEdited: true,
        editedAt: new Date(),
        editedBy: data.editedBy,
        updatedAt: new Date(),
      },
    });

    return reply;
  }

  // Yanıt silme
  async deleteReply(id: number): Promise<void> {
    const reply = await prisma.forumPost.findUnique({
      where: { id },
      select: { topicId: true },
    });

    await prisma.forumPost.delete({
      where: { id },
    });

    // Konu istatistiklerini güncelle
    if (reply?.topicId) {
      await prisma.forumTopic.update({
        where: { id: reply.topicId },
        data: {
          postCount: { decrement: 1 },
        },
      });
    }
  }

  // Konudaki yanıtlar
  async getRepliesByTopic(topicId: number, page: number = 1): Promise<ForumPost[]> {
    const limit = 20;
    const skip = (page - 1) * limit;

    const replies = await prisma.forumPost.findMany({
      where: {
        topicId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    return replies;
  }

  // Yanıt beğenme
  async likeReply(id: number, userId: number): Promise<void> {
    await prisma.forumPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
  }

  // Yanıt beğenmeme
  async dislikeReply(id: number, userId: number): Promise<void> {
    await prisma.forumPost.update({
      where: { id },
      data: { dislikes: { increment: 1 } },
    });
  }
}

export class ModerationService {
  // Konu moderasyonu
  async moderateTopic(id: number, action: string, moderatorId: number, note?: string): Promise<void> {
    const updateData: any = {
      moderatedAt: new Date(),
    };

    switch (action) {
      case 'APPROVE':
        updateData.status = 'ACTIVE';
        break;
      case 'REJECT':
        updateData.status = 'MODERATED';
        break;
      case 'DELETE':
        updateData.status = 'DELETED';
        break;
      case 'LOCK':
        updateData.isLocked = true;
        break;
      case 'UNLOCK':
        updateData.isLocked = false;
        break;
    }

    await prisma.forumTopic.update({
      where: { id },
      data: updateData,
    });
  }

  // Yanıt moderasyonu
  async moderateReply(id: number, action: string, moderatorId: number, note?: string): Promise<void> {
    const updateData: any = {
      moderatedAt: new Date(),
    };

    switch (action) {
      case 'APPROVE':
        updateData.status = 'ACTIVE';
        break;
      case 'REJECT':
        updateData.status = 'MODERATED';
        break;
      case 'DELETE':
        updateData.status = 'DELETED';
        break;
    }

    await prisma.forumPost.update({
      where: { id },
      data: updateData,
    });
  }

  // Kullanıcı yasaklama
  async banUser(forumId: string, userId: number, reason: string, expiresAt?: Date): Promise<void> {
    await prisma.userForumActivity.upsert({
      where: {
        userId_forumId: {
          userId,
          forumId,
        },
      },
      update: {
        isBanned: true,
        banReason: reason,
        banExpiresAt: expiresAt,
      },
      create: {
        userId,
        forumId,
        isBanned: true,
        banReason: reason,
        banExpiresAt: expiresAt,
      },
    });
  }

  // Kullanıcı yasak kaldırma
  async unbanUser(forumId: string, userId: number): Promise<void> {
    await prisma.userForumActivity.update({
      where: {
        userId_forumId: {
          userId,
          forumId,
        },
      },
      data: {
        isBanned: false,
        banReason: null,
        banExpiresAt: null,
      },
    });
  }

  // Moderatör ekleme
  async addModerator(forumId: string, userId: number, grantedBy: string): Promise<void> {
    await prisma.forumUserRole.upsert({
      where: {
        userId_forumId: {
          userId,
          forumId,
        },
      },
      update: {
        role: 'moderator',
        permissions: ['READ', 'WRITE', 'MODERATE'],
        grantedAt: new Date(),
        grantedBy,
      },
      create: {
        userId,
        forumId,
        role: 'moderator',
        permissions: ['READ', 'WRITE', 'MODERATE'],
        grantedBy,
      },
    });
  }

  // Moderatör çıkarma
  async removeModerator(forumId: string, userId: number): Promise<void> {
    await prisma.forumUserRole.update({
      where: {
        userId_forumId: {
          userId,
          forumId,
        },
      },
      data: {
        role: 'user',
        permissions: ['READ', 'WRITE'],
      },
    });
  }

  // Moderasyon kuyruğunu getir
  async getModerationQueue(forumId?: string, status?: string): Promise<ModerationQueue[]> {
    const where: any = {};
    if (forumId) where.forumId = forumId;
    if (status) where.status = status;

    return await prisma.moderationQueue.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        forum: true,
        topic: true,
        post: true,
      },
    });
  }
}
