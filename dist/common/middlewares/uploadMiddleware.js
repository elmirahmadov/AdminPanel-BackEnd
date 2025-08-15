"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }[c] || c))
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        var _a;
        let dest = "uploads/other";
        // Anime upload
        if (req.baseUrl.includes("/anime")) {
            let animeName = req.body.title || req.body.animeTitle || "unknown";
            if (req.body.animeName)
                animeName = req.body.animeName;
            if (req.body.anime)
                animeName = req.body.anime;
            // Güncellemede title yoksa params'tan alınabilir
            if (!animeName && req.params && req.params.id && req.body.animeTitleDb) {
                animeName = req.body.animeTitleDb;
            }
            const slug = slugify(animeName);
            dest = `uploads/anime/${slug}`;
        }
        // User upload
        else if (req.baseUrl.includes("/user")) {
            let userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || req.body.userId || req.params.userId || "unknown";
            dest = `uploads/user/${userId}`;
        }
        // Klasör yoksa oluştur
        if (!fs_1.default.existsSync(dest)) {
            fs_1.default.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("Sadece resim dosyaları yüklenebilir."));
    }
};
const upload = (0, multer_1.default)({ storage, fileFilter });
exports.default = upload;
