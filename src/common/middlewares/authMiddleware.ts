import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token gerekli." });
  try {
    const decoded = verifyToken(token) as any;
    req.user = decoded as { userId: number; role: string };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Geçersiz token." });
  }
}
