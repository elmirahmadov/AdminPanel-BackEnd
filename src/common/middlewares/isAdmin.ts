import { Request, Response, NextFunction } from "express";
import prisma from "../../prisma";

export function isRole(role: "ADMIN" | "MODERATOR") {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Yetkisiz." });
    }

    prisma.user
      .findUnique({ where: { id: userId } })
      .then((user: any) => {
        if (!user || (user.role !== role && user.role !== "ADMIN")) {
          return res
            .status(403)
            .json({ error: "Bu işlemi yapmak için yetkiniz yok." });
        }
        next();
      })
      .catch(() => {
        res.status(500).json({ error: "Kullanıcı bilgisi alınamadı." });
      });
  };
}
