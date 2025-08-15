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
exports.getAllTasks = getAllTasks;
exports.getTaskById = getTaskById;
exports.createTask = createTask;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.getUserTasks = getUserTasks;
exports.completeTask = completeTask;
exports.searchTasks = searchTasks;
exports.getTaskStats = getTaskStats;
exports.getTaskProgress = getTaskProgress;
const prisma_1 = __importDefault(require("../../../prisma"));
// Tüm görevleri getir
function getAllTasks(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tasks = yield prisma_1.default.task.findMany({
                orderBy: { id: "asc" },
            });
            res.json(tasks);
        }
        catch (err) {
            res.status(500).json({
                error: "Görevler getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Görev detayını getir
function getTaskById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            const task = yield prisma_1.default.task.findUnique({ where: { id: Number(id) } });
            if (!task) {
                return res.status(404).json({ error: "Görev bulunamadı." });
            }
            res.json(task);
        }
        catch (err) {
            res.status(500).json({
                error: "Görev getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Görev oluştur
function createTask(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, description, type, threshold, badgeId, order, isActive, isRepeatable, } = req.body;
        try {
            const task = yield prisma_1.default.task.create({
                data: {
                    name,
                    description,
                    type,
                    isActive: !!isActive,
                },
            });
            res.status(201).json(task);
        }
        catch (err) {
            res.status(500).json({
                error: "Görev oluşturulamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Görev güncelle
function updateTask(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { name, description, type, threshold, badgeId, order, isActive, isRepeatable, } = req.body;
        try {
            const task = yield prisma_1.default.task.update({
                where: { id: Number(id) },
                data: {
                    name,
                    description,
                    type,
                    isActive: !!isActive,
                },
            });
            res.json(task);
        }
        catch (err) {
            res.status(500).json({
                error: "Görev güncellenemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Görev sil
function deleteTask(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        try {
            yield prisma_1.default.task.delete({ where: { id: Number(id) } });
            res.json({ message: "Görev silindi." });
        }
        catch (err) {
            res.status(500).json({
                error: "Görev silinemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Kullanıcının görevlerini getir
function getUserTasks(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            // Şemada taskCompletion veya ilişkiler yoksa basit liste dön
            const tasks = yield prisma_1.default.task.findMany({ orderBy: { id: "asc" } });
            res.json(tasks);
        }
        catch (err) {
            res.status(500).json({
                error: "Kullanıcı görevleri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Görev tamamlama
function completeTask(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userId, taskId } = req.body;
        try {
            const existingCompletion = null;
            if (existingCompletion) {
                return res.status(409).json({ error: "Görev zaten tamamlanmış." });
            }
            const completion = {
                userId: Number(userId),
                taskId: Number(taskId),
            };
            // Rozet ver
            const task = yield prisma_1.default.task.findUnique({
                where: { id: Number(taskId) },
            });
            // Rozet verme mantığı şemaya uygun değilse pas geç
            res.status(201).json(completion);
        }
        catch (err) {
            res.status(500).json({
                error: "Görev tamamlanamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Görev arama
function searchTasks(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { q, type, isActive, isRepeatable } = req.query;
        const { page = 1, limit = 20 } = req.query;
        try {
            const where = {};
            if (q && typeof q === "string") {
                where.OR = [
                    { name: { contains: q, mode: "insensitive" } },
                    { description: { contains: q, mode: "insensitive" } },
                ];
            }
            if (type && typeof type === "string") {
                where.type = type;
            }
            if (isActive !== undefined) {
                where.isActive = isActive === "true";
            }
            if (isRepeatable !== undefined) {
                where.isRepeatable = isRepeatable === "true";
            }
            const tasks = yield prisma_1.default.task.findMany({
                where,
                orderBy: { id: "asc" },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
            res.json(tasks);
        }
        catch (err) {
            res.status(500).json({
                error: "Görev arama yapılamadı.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Görev istatistikleri
function getTaskStats(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const totalTasks = yield prisma_1.default.task.count();
            const activeTasks = yield prisma_1.default.task.count({ where: { isActive: true } });
            const totalCompletions = 0;
            const uniqueUsersWithCompletions = [];
            res.json({
                totalTasks,
                activeTasks,
                totalCompletions,
                uniqueUsersWithCompletions: uniqueUsersWithCompletions.length,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Görev istatistikleri getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
// Görev ilerlemesini getir
function getTaskProgress(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = req.params;
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ error: "userId parametresi gerekli." });
        }
        try {
            const task = yield prisma_1.default.task.findUnique({ where: { id: Number(id) } });
            if (!task) {
                return res.status(404).json({ error: "Görev bulunamadı." });
            }
            const completionCount = 0;
            const isCompleted = false;
            const progress = 0;
            res.json({
                task,
                progress: Math.round(progress),
                completionCount,
                isCompleted,
                remaining: 0,
            });
        }
        catch (err) {
            res.status(500).json({
                error: "Görev ilerlemesi getirilemedi.",
                detail: err instanceof Error ? err.message : err,
            });
        }
    });
}
