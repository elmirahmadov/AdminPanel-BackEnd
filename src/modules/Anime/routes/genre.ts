import { Router } from "express";
import {
  getAllGenres,
  getGenreById,
  createGenre,
  updateGenre,
  deleteGenre,
} from "../controllers/genreController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

router.get("/", getAllGenres);
router.get("/:id", getGenreById);
router.post("/", authenticateToken, isRole("ADMIN"), createGenre);
router.put("/:id", authenticateToken, isRole("ADMIN"), updateGenre);
router.delete("/:id", authenticateToken, isRole("ADMIN"), deleteGenre);

export default router;
