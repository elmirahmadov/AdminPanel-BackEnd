import { Router } from "express";
import {
  getAllCharacters,
  getCharacterById,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  searchCharacters,
  getCharacterAnimes,
  addCharacterToAnime,
  removeCharacterFromAnime,
} from "../controllers/characterController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

router.get("/", getAllCharacters);
router.get("/search", searchCharacters);
router.get("/:id", getCharacterById);
router.get("/anime/:animeId", getCharacterAnimes);
router.post("/anime/:animeId/add/:characterId", addCharacterToAnime);
router.delete("/anime/:animeId/remove/:characterId", removeCharacterFromAnime);
router.post("/", authenticateToken, isRole("ADMIN"), createCharacter);
router.put("/:id", authenticateToken, isRole("ADMIN"), updateCharacter);
router.delete("/:id", authenticateToken, isRole("ADMIN"), deleteCharacter);

export default router;
