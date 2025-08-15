"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const animeController_1 = require("../controllers/animeController");
const authMiddleware_1 = require("../../../common/middlewares/authMiddleware");
const isAdmin_1 = require("../../../common/middlewares/isAdmin");
const uploadMiddleware_1 = __importDefault(require("../../../common/middlewares/uploadMiddleware"));
const router = (0, express_1.Router)();
router.get("/", animeController_1.getAllAnimes);
router.get("/featured", animeController_1.getFeaturedAnimes);
router.get("/search", animeController_1.searchAnimes);
router.get("/lookup", animeController_1.lookupAnimes);
router.get("/:id", animeController_1.getAnimeById);
router.post("/", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("ADMIN"), uploadMiddleware_1.default.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
]), animeController_1.createAnime);
router.put("/:id", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("ADMIN"), uploadMiddleware_1.default.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
]), animeController_1.updateAnime);
router.delete("/:id", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("ADMIN"), animeController_1.deleteAnime);
router.post("/:id/rate", authMiddleware_1.authenticateToken, animeController_1.rateAnime);
router.post("/:id/featured", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("MODERATOR"), animeController_1.setFeatured);
router.delete("/:id/featured", authMiddleware_1.authenticateToken, (0, isAdmin_1.isRole)("MODERATOR"), animeController_1.removeFeatured);
exports.default = router;
