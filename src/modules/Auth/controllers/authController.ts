import { Request, Response } from "express";
import prisma from "../../../prisma";
import bcrypt from "bcrypt";
import { generateToken } from "../../../common/utils/jwt";
import logger from "../../../common/utils/logger";

// Kullanıcı kaydı
export async function register(req: Request, res: Response) {
  const { email, password, username, bio } = req.body;

  try {
    // Email ve username kontrolü
    const existingUser = await prisma.user.findFirst({
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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcı oluşturma
    const user = await prisma.user.create({
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
    const token = generateToken({ userId: user.id });

    // Kullanıcı aktivitesi kaydetme
    await prisma.userActivity.create({
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
  } catch (err) {
    res.status(500).json({
      error: "Kayıt işlemi başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı girişi
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
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
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Geçersiz email veya şifre." });
    }

    // JWT token oluşturma
    const token = generateToken({ userId: user.id });

    // Son giriş zamanını güncelle
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Kullanıcı aktivitesi kaydetme
    await prisma.userActivity.create({
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
  } catch (err) {
    res.status(500).json({
      error: "Giriş işlemi başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Kullanıcı çıkışı
export async function logout(req: Request, res: Response) {
  try {
    // Kullanıcı aktivitesi kaydetme (eğer userId varsa)
    const userId = (req as any).user?.userId;
    if (userId) {
      await prisma.userActivity.create({
        data: {
          userId: userId,
          type: "LOGIN",
          details: { action: "logout" },
        },
      });
    }

    res.json({ message: "Çıkış başarılı." });
  } catch (err) {
    res.status(500).json({
      error: "Çıkış işlemi başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Token doğrulama
export async function verifyAuth(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Geçersiz token." });
    }

    const user = await prisma.user.findUnique({
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
  } catch (err) {
    res.status(500).json({
      error: "Token doğrulama başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Şifre sıfırlama isteği
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res
        .status(404)
        .json({ error: "Bu email adresi ile kayıtlı kullanıcı bulunamadı." });
    }

    // Reset token oluştur (gerçek uygulamada email gönderilir)
    const resetToken = generateToken(
      { userId: user.id, type: "password_reset" },
      "1h"
    );

    // Token'ı veritabanına kaydet
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 saat
      },
    });

    // Kullanıcı aktivitesi kaydetme
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        type: "LOGIN",
        details: { action: "password_reset_request" },
      },
    });

    res.json({
      message: "Şifre sıfırlama bağlantısı email adresinize gönderildi.",
    });
  } catch (err) {
    res.status(500).json({
      error: "Şifre sıfırlama işlemi başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Şifre sıfırlama
export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;

  try {
    const decoded = (await Promise.resolve().then(() => {
      const { verifyToken } = require("../../../common/utils/jwt");
      return verifyToken(token) as any;
    })) as any;

    if (decoded.type !== "password_reset") {
      return res.status(401).json({ error: "Geçersiz token." });
    }

    const user = await prisma.user.findFirst({
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
      },
    });

    // Kullanıcı aktivitesi kaydetme
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        type: "LOGIN",
        details: { action: "password_reset" },
      },
    });

    res.json({ message: "Şifre başarıyla sıfırlandı." });
  } catch (err) {
    res.status(500).json({
      error: "Şifre sıfırlama işlemi başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}

// Profil güncelleme
export async function updateProfile(req: Request, res: Response) {
  const { username, bio } = req.body;
  const userId = (req as any).user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Kimlik doğrulama gerekli." });
  }

  try {
    // Username kontrolü (eğer değiştiriliyorsa)
    if (username) {
      const existingUser = await prisma.user.findFirst({
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

    const user = await prisma.user.update({
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
    await prisma.userActivity.create({
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
  } catch (err) {
    res.status(500).json({
      error: "Profil güncelleme başarısız.",
      detail: err instanceof Error ? err.message : err,
    });
  }
}
