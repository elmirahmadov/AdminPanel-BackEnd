import { Router } from "express";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "../controllers/favoriteController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getFavorites);
router.post("/", authenticateToken, addFavorite);
router.delete("/", authenticateToken, removeFavorite);
router.get("/check/:animeId", authenticateToken, checkFavorite);

export default router;
