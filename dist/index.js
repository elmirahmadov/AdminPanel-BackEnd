"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./modules/Auth/routes/auth"));
const anime_1 = __importDefault(require("./modules/Anime/routes/anime"));
const season_1 = __importDefault(require("./modules/Anime/routes/season"));
const episode_1 = __importDefault(require("./modules/Anime/routes/episode"));
const genre_1 = __importDefault(require("./modules/Anime/routes/genre"));
const favorite_1 = __importDefault(require("./modules/Anime/routes/favorite"));
const comment_1 = __importDefault(require("./modules/Anime/routes/comment"));
const user_1 = __importDefault(require("./modules/Anime/routes/user"));
const character_1 = __importDefault(require("./modules/Anime/routes/character"));
const admin_1 = __importDefault(require("./modules/Anime/routes/admin"));
const forum_1 = __importDefault(require("./modules/Anime/routes/forum"));
const badge_1 = __importDefault(require("./modules/Anime/routes/badge"));
const task_1 = __importDefault(require("./modules/Anime/routes/task"));
const notification_1 = __importDefault(require("./modules/Anime/routes/notification"));
const errorHandler_1 = require("./common/middlewares/errorHandler");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("./common/utils/logger"));
const prisma_1 = __importDefault(require("./prisma"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 dakika
    max: 60, // Her IP için 60 istek/dakika
    message: { error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." },
});
app.use(limiter);
// İstek loglama middleware
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
    next();
});
// Hata loglama error middleware'i global errorHandler içinde yapılacak
app.set("prisma", prisma_1.default);
const PORT = process.env.PORT || 5000;
// CORS ayarları - Geliştirme ortamında daha esnek
const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? ["http://localhost:5173", "http://localhost:3000"]
        : true, // Geliştirme ortamında tüm origin'lere izin ver
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use((0, cors_1.default)(corsOptions));
// JSON body
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/auth", auth_1.default);
app.use("/api/anime", anime_1.default);
app.use("/api/season", season_1.default);
app.use("/api/episode", episode_1.default);
app.use("/api/genre", genre_1.default);
app.use("/api/favorite", favorite_1.default);
app.use("/api/comment", comment_1.default);
app.use("/api/user", user_1.default);
app.use("/api/character", character_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/forum", forum_1.default);
app.use("/api/badge", badge_1.default);
app.use("/api/task", task_1.default);
app.use("/api/notification", notification_1.default);
app.use(errorHandler_1.errorHandler);
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
