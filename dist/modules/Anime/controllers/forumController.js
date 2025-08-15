"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllForumCategories = getAllForumCategories;
exports.createForumCategory = createForumCategory;
exports.updateForumCategory = updateForumCategory;
exports.deleteForumCategory = deleteForumCategory;
exports.getTopicsByCategory = getTopicsByCategory;
exports.createTopic = createTopic;
exports.updateTopic = updateTopic;
exports.deleteTopic = deleteTopic;
exports.getPostsByTopic = getPostsByTopic;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.searchForum = searchForum;
exports.getForumCategoryById = getForumCategoryById;
exports.getAllForumTopics = getAllForumTopics;
exports.getForumTopicById = getForumTopicById;
exports.createForumTopic = createForumTopic;
exports.updateForumTopic = updateForumTopic;
exports.deleteForumTopic = deleteForumTopic;
exports.getAllForumPosts = getAllForumPosts;
exports.getForumPostById = getForumPostById;
exports.createForumPost = createForumPost;
exports.updateForumPost = updateForumPost;
exports.deleteForumPost = deleteForumPost;
const prisma_1 = __importDefault(require("../../../prisma"));
// Notification işlemleri service üzerinden yönetilir
// Tüm forum kategorilerini getir
function getAllForumCategories(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const categories = yield prisma_1.default.forumCategory.findMany({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Forum kategorileri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum kategorisi oluştur
function createForumCategory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, description, order } = req.body;
        try {
            const slug = String(name)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");
            const category = yield prisma_1.default.forumCategory.create({
                data: {
                    name,
                    slug,
                    description,
                    order: Number(order),
                },
            });
            res.status(201).json(category);
        }
        catch (err) {
            res.status(500).json({
                error: "Forum kategorisi oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum kategorisi güncelle
function updateForumCategory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { name, description, order } = req.body;
        try {
            const category = yield prisma_1.default.forumCategory.update({
                where: { id: Number(id) },
                data: {
                    name,
                    slug: name
                        ? String(name)
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9\s-]/g, "")
                            .replace(/\s+/g, "-")
                            .replace(/-+/g, "-")
                        : undefined,
                    description,
                    order: Number(order),
                },
            });
            res.json(category);
        }
        catch (err) {
            res.status(500).json({
                error: "Forum kategorisi güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum kategorisi sil
function deleteForumCategory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.forumCategory.delete({ where: { id: Number(id) } });
            res.json({ message: "Forum kategorisi silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Forum kategorisi silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kategoriye ait konuları getir
function getTopicsByCategory(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { categoryId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        try {
            const topics = yield prisma_1.default.forumTopic.findMany({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Konular getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Konu oluştur
function createTopic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, categoryId, title, content, isPinned, isLocked } = req.body;
        try {
            const slug = String(title)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");
            const topic = yield prisma_1.default.forumTopic.create({
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
            yield prisma_1.default.forumPost.create({
                data: {
                    userId: Number(userId),
                    topicId: topic.id,
                    content,
                },
            });
            // Opsiyonel: kategori yöneticilerine bildirim gönderimi ayrı servis ile yapılabilir
            res.status(201).json(topic);
        }
        catch (err) {
            res.status(500).json({
                error: "Konu oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Konu güncelle
function updateTopic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { title, isPinned, isLocked } = req.body;
        try {
            const topic = yield prisma_1.default.forumTopic.update({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Konu güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Konu sil
function deleteTopic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.forumTopic.delete({ where: { id: Number(id) } });
            res.json({ message: "Konu silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Konu silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Konuya ait postları getir
function getPostsByTopic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { topicId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        try {
            const posts = yield prisma_1.default.forumPost.findMany({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Postlar getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Post oluştur
function createPost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, topicId, content } = req.body;
        try {
            const post = yield prisma_1.default.forumPost.create({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Post oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Post güncelle
function updatePost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { content } = req.body;
        try {
            const post = yield prisma_1.default.forumPost.update({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Post güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Post sil
function deletePost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.forumPost.delete({ where: { id: Number(id) } });
            res.json({ message: "Post silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Post silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum arama
function searchForum(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q, categoryId, userId, type = "all" } = req.query;
        const { page = 1, limit = 20 } = req.query;
        try {
            let results = {};
            if (type === "all" || type === "topics") {
                const topics = yield prisma_1.default.forumTopic.findMany({
                    where: {
                        title: { contains: q, mode: "insensitive" },
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
                const posts = yield prisma_1.default.forumPost.findMany({
                    where: {
                        content: { contains: q, mode: "insensitive" },
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
        }
        catch (err) {
            res.status(500).json({
                error: "Forum arama yapılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum kategorisi detayını getir
function getForumCategoryById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const category = yield prisma_1.default.forumCategory.findUnique({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Forum kategorisi getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tüm forum konularını getir
function getAllForumTopics(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const topics = yield prisma_1.default.forumTopic.findMany({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Forum konuları getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum konusu detayını getir
function getForumTopicById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const topic = yield prisma_1.default.forumTopic.findUnique({
                where: { id: Number(id) },
                include: {
                    user: true,
                    category: true,
                    posts: {
                        include: { user: true },
                        orderBy: { createdAt: "asc" },
                    },
                },
            });
            if (!topic) {
                return res.status(404).json({ error: "Forum konusu bulunamadı." });
            }
            res.json(topic);
        }
        catch (err) {
            res.status(500).json({
                error: "Forum konusu getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum konusu oluştur
function createForumTopic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { categoryId, title, content } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        try {
            const slug = String(title)
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");
            const topic = yield prisma_1.default.forumTopic.create({
                data: {
                    categoryId: Number(categoryId),
                    userId: Number(userId),
                    title,
                    slug,
                    content,
                },
                include: {
                    user: true,
                    category: true,
                },
            });
            // İlk post'u oluştur
            const post = yield prisma_1.default.forumPost.create({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Forum konusu oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum konusu güncelle
function updateForumTopic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const { title } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        try {
            const topic = yield prisma_1.default.forumTopic.findUnique({
                where: { id: Number(id) },
            });
            if (!topic) {
                return res.status(404).json({ error: "Forum konusu bulunamadı." });
            }
            if (topic.userId !== Number(userId)) {
                return res.status(403).json({ error: "Bu konuyu güncelleyemezsiniz." });
            }
            const updatedTopic = yield prisma_1.default.forumTopic.update({
                where: { id: Number(id) },
                data: { title },
                include: {
                    user: true,
                    category: true,
                },
            });
            res.json(updatedTopic);
        }
        catch (err) {
            res.status(500).json({
                error: "Forum konusu güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum konusu sil
function deleteForumTopic(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        try {
            const topic = yield prisma_1.default.forumTopic.findUnique({
                where: { id: Number(id) },
            });
            if (!topic) {
                return res.status(404).json({ error: "Forum konusu bulunamadı." });
            }
            if (topic.userId !== Number(userId)) {
                return res.status(403).json({ error: "Bu konuyu silemezsiniz." });
            }
            yield prisma_1.default.forumTopic.delete({ where: { id: Number(id) } });
            res.json({ message: "Forum konusu silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Forum konusu silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Tüm forum post'larını getir
function getAllForumPosts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const posts = yield prisma_1.default.forumPost.findMany({
                include: {
                    user: true,
                    topic: {
                        include: { category: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            res.json(posts);
        }
        catch (err) {
            res.status(500).json({
                error: "Forum post'ları getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum post detayını getir
function getForumPostById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const post = yield prisma_1.default.forumPost.findUnique({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Forum post'u getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum post oluştur
function createForumPost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { topicId, content } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        try {
            const post = yield prisma_1.default.forumPost.create({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Forum post'u oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum post güncelle
function updateForumPost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const { content } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        try {
            const post = yield prisma_1.default.forumPost.findUnique({
                where: { id: Number(id) },
            });
            if (!post) {
                return res.status(404).json({ error: "Forum post'u bulunamadı." });
            }
            if (post.userId !== Number(userId)) {
                return res.status(403).json({ error: "Bu post'u güncelleyemezsiniz." });
            }
            const updatedPost = yield prisma_1.default.forumPost.update({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Forum post'u güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Forum post sil
function deleteForumPost(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kullanıcı kimliği bulunamadı." });
        }
        try {
            const post = yield prisma_1.default.forumPost.findUnique({
                where: { id: Number(id) },
            });
            if (!post) {
                return res.status(404).json({ error: "Forum post'u bulunamadı." });
            }
            if (post.userId !== Number(userId)) {
                return res.status(403).json({ error: "Bu post'u silemezsiniz." });
            }
            yield prisma_1.default.forumPost.delete({ where: { id: Number(id) } });
            res.json({ message: "Forum post'u silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Forum post'u silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
