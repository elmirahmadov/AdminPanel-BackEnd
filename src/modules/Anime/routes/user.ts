import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getUserActivities,
  getUserFavorites,
  getUserWatchlist,
  getUserRatings,
  getUserComments,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from "../controllers/userController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", authenticateToken, updateUser);
router.delete("/:id", authenticateToken, isRole("ADMIN"), deleteUser);
router.get("/:id/profile", getUserProfile);
router.put("/:id/profile", authenticateToken, updateUserProfile);
router.get("/:id/stats", getUserStats);
router.get("/:id/activities", getUserActivities);
router.get("/:id/favorites", getUserFavorites);
router.get("/:id/watchlist", getUserWatchlist);
router.get("/:id/ratings", getUserRatings);
router.get("/:id/comments", getUserComments);
router.post("/:id/follow", authenticateToken, followUser);
router.delete("/:id/follow", authenticateToken, unfollowUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);

export default router;
