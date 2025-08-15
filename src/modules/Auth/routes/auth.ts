import { Router } from "express";
import {
  register,
  login,
  logout,
  verifyAuth,
  forgotPassword,
  resetPassword,
  updateProfile,
} from "../controllers/authController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify", verifyAuth);

// Protected routes
router.post("/logout", authenticateToken, logout);
router.put("/profile", authenticateToken, updateProfile);

export default router;
