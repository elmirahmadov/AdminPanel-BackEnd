"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRole = isRole;
const prisma_1 = __importDefault(require("../../prisma"));
function isRole(role) {
    return (req, res, next) => {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: "Yetkisiz." });
        }
        prisma_1.default.user
            .findUnique({ where: { id: userId } })
            .then((user) => {
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
