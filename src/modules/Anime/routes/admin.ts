import { Router } from "express";
import { isRole } from "../../../common/middlewares/isAdmin";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import {
  getAllUsers,
  getAllUsersWithOnlineStatus,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  banUser,
  unbanUser,
  getAllReports,
  updateReportStatus,
  getAdminStats,
  searchUsers,
} from "../controllers/adminController";

const router = Router();

// Tüm admin route'ları için authentication ve admin role gerekli
router.use(authenticateToken);
router.use(isRole("ADMIN"));

// Kullanıcı yönetimi
router.get("/users/with-online-status", getAllUsersWithOnlineStatus);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/status", toggleUserStatus);
router.post("/users/:id/ban", banUser);
router.post("/users/:id/unban", unbanUser);
router.get("/users/search", searchUsers);

// Rapor yönetimi
router.get("/reports", getAllReports);
router.put("/reports/:id/status", updateReportStatus);

// İstatistikler - Gerçek zamanlı güncelleme
router.get("/stats", getAdminStats);

export default router;
