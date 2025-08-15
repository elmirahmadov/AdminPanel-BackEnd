import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import fs from "fs";

interface AuthRequest extends Request {
  user?: any;
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(
      /[çğıöşü]/g,
      (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }[c] || c)
    )
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const storage = multer.diskStorage({
  destination: function (
    req: AuthRequest,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    let dest = "uploads/other";
    // Anime upload
    if (req.baseUrl.includes("/anime")) {
      let animeName = req.body.title || req.body.animeTitle || "unknown";
      if (req.body.animeName) animeName = req.body.animeName;
      if (req.body.anime) animeName = req.body.anime;
      // Güncellemede title yoksa params'tan alınabilir
      if (!animeName && req.params && req.params.id && req.body.animeTitleDb) {
        animeName = req.body.animeTitleDb;
      }
      const slug = slugify(animeName);
      dest = `uploads/anime/${slug}`;
    }
    // User upload
    else if (req.baseUrl.includes("/user")) {
      let userId =
        req.user?.userId || req.body.userId || req.params.userId || "unknown";
      dest = `uploads/user/${userId}`;
    }
    // Klasör yoksa oluştur
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Sadece resim dosyaları yüklenebilir."));
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
