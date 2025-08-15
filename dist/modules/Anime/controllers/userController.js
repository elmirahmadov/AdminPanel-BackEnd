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
exports.getAllUsers = getAllUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.followUser = followUser;
exports.unfollowUser = unfollowUser;
exports.getFollowers = getFollowers;
exports.getFollowing = getFollowing;
exports.getUserActivities = getUserActivities;
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.getUserStats = getUserStats;
exports.getUserFavorites = getUserFavorites;
exports.getUserWatchlist = getUserWatchlist;
exports.getUserRatings = getUserRatings;
exports.getUserComments = getUserComments;
const prisma_1 = __importDefault(require("../../../prisma"));
// Tüm kullanıcıları getir
function getAllUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield prisma_1.default.user.findMany({
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
    });
}
// Kullanıcıyı ID ile getir
function getUserById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const user = yield prisma_1.default.user.findUnique({
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
        if (!user)
            return res.status(404).json({ error: "Kullanıcı bulunamadı." });
        res.json(user);
    });
}
// Kullanıcı oluştur
function createUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, email, password, profileImage, bio, role, status } = req.body;
        try {
            const user = yield prisma_1.default.user.create({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı güncelle
function updateUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { username, email, profileImage, bio, role, status } = req.body;
        try {
            const user = yield prisma_1.default.user.update({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı sil
function deleteUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.user.delete({ where: { id: Number(id) } });
            res.json({ message: "Kullanıcı silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Takip et
function followUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { followerId, followingId } = req.body;
        try {
            // Önce kullanıcıların var olup olmadığını kontrol et
            const [follower, following] = yield Promise.all([
                prisma_1.default.user.findUnique({ where: { id: followerId } }),
                prisma_1.default.user.findUnique({ where: { id: followingId } }),
            ]);
            if (!follower || !following) {
                return res.status(404).json({ error: "Kullanıcı bulunamadı." });
            }
            // Zaten takip ediliyor mu kontrol et
            const existingFollow = yield prisma_1.default.userFollow.findUnique({
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
            const follow = yield prisma_1.default.userFollow.create({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Takip işlemi başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Takipten çık
function unfollowUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { followerId, followingId } = req.body;
        try {
            yield prisma_1.default.userFollow.deleteMany({ where: { followerId, followingId } });
            res.json({ message: "Takipten çıkıldı." });
        }
        catch (err) {
            res.status(500).json({
                error: "Takipten çıkılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Takipçi listesi
function getFollowers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const followers = yield prisma_1.default.userFollow.findMany({
            where: { followingId: Number(userId) },
            include: { follower: true },
        });
        res.json(followers.map((f) => f.follower));
    });
}
// Takip edilenler listesi
function getFollowing(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const following = yield prisma_1.default.userFollow.findMany({
            where: { followerId: Number(userId) },
            include: { following: true },
        });
        res.json(following.map((f) => f.following));
    });
}
// Kullanıcı aktiviteleri
function getUserActivities(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        const activities = yield prisma_1.default.userActivity.findMany({
            where: { userId: Number(userId) },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        res.json(activities);
    });
}
// Kullanıcı profilini getir
function getUserProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const user = yield prisma_1.default.user.findUnique({
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
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı profili getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı profilini güncelle
function updateUserProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (Number(id) !== userId) {
            return res
                .status(403)
                .json({ error: "Kendi profilinizi güncelleyebilirsiniz." });
        }
        const { username, bio, profileImage } = req.body;
        try {
            const user = yield prisma_1.default.user.update({
                where: { id: Number(id) },
                data: {
                    username,
                    bio,
                    profileImage,
                },
            });
            res.json(user);
        }
        catch (err) {
            res.status(500).json({
                error: "Profil güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı istatistikleri
function getUserStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const [favoritesCount, watchlistCount, ratingsCount, commentsCount] = yield Promise.all([
                prisma_1.default.favorite.count({ where: { userId: Number(id) } }),
                prisma_1.default.watchlist.count({ where: { userId: Number(id) } }),
                prisma_1.default.rating.count({ where: { userId: Number(id) } }),
                prisma_1.default.comment.count({ where: { userId: Number(id) } }),
            ]);
            res.json({
                favoritesCount,
                watchlistCount,
                ratingsCount,
                commentsCount,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı istatistikleri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı favorileri
function getUserFavorites(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const favorites = yield prisma_1.default.favorite.findMany({
                where: { userId: Number(id) },
                include: {
                    anime: true,
                },
            });
            res.json(favorites);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı favorileri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı watchlist'i
function getUserWatchlist(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const watchlist = yield prisma_1.default.watchlist.findMany({
                where: { userId: Number(id) },
                include: {
                    anime: true,
                },
            });
            res.json(watchlist);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı watchlist'i getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı rating'leri
function getUserRatings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const ratings = yield prisma_1.default.rating.findMany({
                where: { userId: Number(id) },
                include: {
                    anime: true,
                },
            });
            res.json(ratings);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı rating'leri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı yorumları
function getUserComments(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const comments = yield prisma_1.default.comment.findMany({
                where: { userId: Number(id) },
                include: {
                    anime: true,
                    episode: true,
                },
            });
            res.json(comments);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı yorumları getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
