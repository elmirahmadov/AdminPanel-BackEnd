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
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.verifyAuth = verifyAuth;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.updateProfile = updateProfile;
const prisma_1 = __importDefault(require("../../../prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../../../common/utils/jwt");
// Kullanıcı kaydı
function register(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password, username, bio } = req.body;
        try {
            // Email ve username kontrolü
            const existingUser = yield prisma_1.default.user.findFirst({
                where: {
                    OR: [{ email }, { username }],
                },
            });
            if (existingUser) {
                return res
                    .status(409)
                    .json({ error: "Email veya kullanıcı adı zaten kullanımda." });
            }
            // Şifre hashleme
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            // Kullanıcı oluşturma
            const user = yield prisma_1.default.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    username,
                    bio,
                    role: "USER",
                    status: "ACTIVE",
                },
            });
            // JWT token oluşturma
            const token = (0, jwt_1.generateToken)({ userId: user.id });
            // Kullanıcı aktivitesi kaydetme
            yield prisma_1.default.userActivity.create({
                data: {
                    userId: user.id,
                    type: "LOGIN",
                    details: { action: "register" },
                },
            });
            res.status(201).json({
                message: "Kullanıcı başarıyla oluşturuldu.",
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                },
                token,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Kayıt işlemi başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı girişi
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, password } = req.body;
        try {
            // Kullanıcıyı bul
            const user = yield prisma_1.default.user.findUnique({
                where: { email },
                include: {
                    badges: {
                        include: { badge: true },
                    },
                },
            });
            if (!user) {
                return res.status(401).json({ error: "Geçersiz email veya şifre." });
            }
            if (user.status === "BANNED") {
                return res
                    .status(401)
                    .json({ error: "Hesabınız devre dışı bırakılmış." });
            }
            // Şifre kontrolü
            const isValidPassword = yield bcrypt_1.default.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: "Geçersiz email veya şifre." });
            }
            // JWT token oluşturma
            const token = (0, jwt_1.generateToken)({ userId: user.id });
            // Son giriş zamanını güncelle
            yield prisma_1.default.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });
            // Kullanıcı aktivitesi kaydetme
            yield prisma_1.default.userActivity.create({
                data: {
                    userId: user.id,
                    type: "LOGIN",
                    details: { action: "login" },
                },
            });
            res.json({
                message: "Giriş başarılı.",
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    profileImage: user.profileImage,
                    bio: user.bio,
                    badges: user.badges.map((ub) => ({
                        id: ub.badge.id,
                        name: ub.badge.name,
                        type: ub.badge.type,
                        iconUrl: ub.badge.iconUrl,
                    })),
                },
                token,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Giriş işlemi başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcı çıkışı
function logout(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Kullanıcı aktivitesi kaydetme (eğer userId varsa)
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (userId) {
                yield prisma_1.default.userActivity.create({
                    data: {
                        userId: userId,
                        type: "LOGIN",
                        details: { action: "logout" },
                    },
                });
            }
            res.json({ message: "Çıkış başarılı." });
        }
        catch (err) {
            res.status(500).json({
                error: "Çıkış işlemi başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Token doğrulama
function verifyAuth(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!userId) {
                return res.status(401).json({ error: "Geçersiz token." });
            }
            const user = yield prisma_1.default.user.findUnique({
                where: { id: userId },
                include: {
                    badges: {
                        include: { badge: true },
                    },
                },
            });
            if (!user || user.status === "BANNED") {
                return res
                    .status(401)
                    .json({ error: "Kullanıcı bulunamadı veya devre dışı." });
            }
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    profileImage: user.profileImage,
                    bio: user.bio,
                    badges: user.badges.map((ub) => ({
                        id: ub.badge.id,
                        name: ub.badge.name,
                        type: ub.badge.type,
                        iconUrl: ub.badge.iconUrl,
                    })),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Token doğrulama başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Şifre sıfırlama isteği
function forgotPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email } = req.body;
        try {
            const user = yield prisma_1.default.user.findUnique({
                where: { email },
            });
            if (!user) {
                return res
                    .status(404)
                    .json({ error: "Bu email adresi ile kayıtlı kullanıcı bulunamadı." });
            }
            // Reset token oluştur (gerçek uygulamada email gönderilir)
            const resetToken = (0, jwt_1.generateToken)({ userId: user.id, type: "password_reset" }, "1h");
            // Token'ı veritabanına kaydet
            yield prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: resetToken,
                    passwordResetExpires: new Date(Date.now() + 3600000), // 1 saat
                },
            });
            // Kullanıcı aktivitesi kaydetme
            yield prisma_1.default.userActivity.create({
                data: {
                    userId: user.id,
                    type: "LOGIN",
                    details: { action: "password_reset_request" },
                },
            });
            res.json({
                message: "Şifre sıfırlama bağlantısı email adresinize gönderildi.",
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Şifre sıfırlama işlemi başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Şifre sıfırlama
function resetPassword(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { token, newPassword } = req.body;
        try {
            const decoded = (yield Promise.resolve().then(() => {
                const { verifyToken } = require("../../../common/utils/jwt");
                return verifyToken(token);
            }));
            if (decoded.type !== "password_reset") {
                return res.status(401).json({ error: "Geçersiz token." });
            }
            const user = yield prisma_1.default.user.findFirst({
                where: {
                    id: decoded.userId,
                    passwordResetToken: token,
                    passwordResetExpires: {
                        gt: new Date(),
                    },
                },
            });
            if (!user) {
                return res
                    .status(400)
                    .json({ error: "Geçersiz veya süresi dolmuş token." });
            }
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
            yield prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                    passwordChangedAt: new Date(),
                },
            });
            // Kullanıcı aktivitesi kaydetme
            yield prisma_1.default.userActivity.create({
                data: {
                    userId: user.id,
                    type: "LOGIN",
                    details: { action: "password_reset" },
                },
            });
            res.json({ message: "Şifre başarıyla sıfırlandı." });
        }
        catch (err) {
            res.status(500).json({
                error: "Şifre sıfırlama işlemi başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Profil güncelleme
function updateProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { username, bio } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
        }
        try {
            // Username kontrolü (eğer değiştiriliyorsa)
            if (username) {
                const existingUser = yield prisma_1.default.user.findFirst({
                    where: {
                        username,
                        NOT: { id: userId },
                    },
                });
                if (existingUser) {
                    return res
                        .status(409)
                        .json({ error: "Bu kullanıcı adı zaten kullanımda." });
                }
            }
            const user = yield prisma_1.default.user.update({
                where: { id: userId },
                data: {
                    username: username || undefined,
                    bio: bio || undefined,
                },
                include: {
                    badges: {
                        include: { badge: true },
                    },
                },
            });
            // Kullanıcı aktivitesi kaydetme
            yield prisma_1.default.userActivity.create({
                data: {
                    userId: userId,
                    type: "LOGIN",
                    details: { action: "profile_update" },
                },
            });
            res.json({
                message: "Profil başarıyla güncellendi.",
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    profileImage: user.profileImage,
                    bio: user.bio,
                    badges: user.badges.map((ub) => ({
                        id: ub.badge.id,
                        name: ub.badge.name,
                        type: ub.badge.type,
                        iconUrl: ub.badge.iconUrl,
                    })),
                },
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Profil güncelleme başarısız.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
