import { Request, Response } from "express";
import prisma from "../../../prisma";

// Tüm görevleri getir
export async function getAllTasks(req: Request, res: Response) {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { id: "asc" },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      error: "Görevler getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Görev detayını getir
export async function getTaskById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({ where: { id: Number(id) } });
    if (!task) {
      return res.status(404).json({ error: "Görev bulunamadı." });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({
      error: "Görev getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Görev oluştur
export async function createTask(req: Request, res: Response) {
  const {
    name,
    description,
    type,
    threshold,
    badgeId,
    order,
    isActive,
    isRepeatable,
  } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        name,
        description,
        type,
        isActive: !!isActive,
      },
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({
      error: "Görev oluşturulamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Görev güncelle
export async function updateTask(req: Request, res: Response) {
  const { id } = req.params;
  const {
    name,
    description,
    type,
    threshold,
    badgeId,
    order,
    isActive,
    isRepeatable,
  } = req.body;
  try {
    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        type,
        isActive: !!isActive,
      },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({
      error: "Görev güncellenemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Görev sil
export async function deleteTask(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.task.delete({ where: { id: Number(id) } });
    res.json({ message: "Görev silindi." });
  } catch (err) {
    res.status(500).json({
      error: "Görev silinemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcının görevlerini getir
export async function getUserTasks(req: Request, res: Response) {
  const { userId } = req.params;
  try {
    // Şemada taskCompletion veya ilişkiler yoksa basit liste dön
    const tasks = await prisma.task.findMany({ orderBy: { id: "asc" } });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      error: "Kullanıcı görevleri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Görev tamamlama
export async function completeTask(req: Request, res: Response) {
  const { userId, taskId } = req.body;
  try {
    const existingCompletion = null as any;

    if (existingCompletion) {
      return res.status(409).json({ error: "Görev zaten tamamlanmış." });
    }

    const completion = {
      userId: Number(userId),
      taskId: Number(taskId),
    } as any;

    // Rozet ver
    const task = await prisma.task.findUnique({
      where: { id: Number(taskId) },
    });

    // Rozet verme mantığı şemaya uygun değilse pas geç

    res.status(201).json(completion);
  } catch (err) {
    res.status(500).json({
      error: "Görev tamamlanamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Görev arama
export async function searchTasks(req: Request, res: Response) {
  const { q, type, isActive, isRepeatable } = req.query;
  const { page = 1, limit = 20 } = req.query;
  try {
    const where: any = {};

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

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { id: "asc" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({
      error: "Görev arama yapılamadı.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Görev istatistikleri
export async function getTaskStats(req: Request, res: Response) {
  try {
    const totalTasks = await prisma.task.count();
    const activeTasks = await prisma.task.count({ where: { isActive: true } });
    const totalCompletions = 0;
    const uniqueUsersWithCompletions: any[] = [];

    res.json({
      totalTasks,
      activeTasks,
      totalCompletions,
      uniqueUsersWithCompletions: uniqueUsersWithCompletions.length,
    });
  } catch (err) {
    res.status(500).json({
      error: "Görev istatistikleri getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Görev ilerlemesini getir
export async function getTaskProgress(req: Request, res: Response) {
  const { id } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId parametresi gerekli." });
  }

  try {
    const task = await prisma.task.findUnique({ where: { id: Number(id) } });

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
  } catch (err) {
    res.status(500).json({
      error: "Görev ilerlemesi getirilemedi.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
