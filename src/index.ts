import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./modules/Auth/routes/auth";
import animeRouter from "./modules/Anime/routes/anime";
import seasonRouter from "./modules/Anime/routes/season";
import episodeRouter from "./modules/Anime/routes/episode";
import genreRouter from "./modules/Anime/routes/genre";
import favoriteRouter from "./modules/Anime/routes/favorite";
import commentRouter from "./modules/Anime/routes/comment";
import userRouter from "./modules/Anime/routes/user";
import characterRouter from "./modules/Anime/routes/character";
import adminRouter from "./modules/Anime/routes/admin";
import forumRouter from "./modules/Anime/routes/forum";
import badgeRouter from "./modules/Anime/routes/badge";
import taskRouter from "./modules/Anime/routes/task";
import notificationRouter from "./modules/Anime/routes/notification";
import { errorHandler } from "./common/middlewares/errorHandler";
import rateLimit from "express-rate-limit";
import logger from "./common/utils/logger";
import prisma from "./prisma";

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 60, // Her IP için 60 istek/dakika
  message: { error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." },
});

app.use(limiter);

// İstek loglama middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// Hata loglama error middleware'i global errorHandler içinde yapılacak

app.set("prisma", prisma);

const PORT = process.env.PORT || 5000;

// CORS ayarları - Geliştirme ortamında daha esnek
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["http://localhost:5173", "http://localhost:3000"]
      : true, // Geliştirme ortamında tüm origin'lere izin ver
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// JSON body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api/auth", authRouter);
app.use("/api/anime", animeRouter);
app.use("/api/season", seasonRouter);
app.use("/api/episode", episodeRouter);
app.use("/api/genre", genreRouter);
app.use("/api/favorite", favoriteRouter);
app.use("/api/comment", commentRouter);
app.use("/api/user", userRouter);
app.use("/api/character", characterRouter);
app.use("/api/admin", adminRouter);
app.use("/api/forums", forumRouter);
app.use("/api/badge", badgeRouter);
app.use("/api/task", taskRouter);
app.use("/api/notification", notificationRouter);
app.use(errorHandler);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
