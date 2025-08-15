"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isAdmin_1 = require("../../../common/middlewares/isAdmin");
const authMiddleware_1 = require("../../../common/middlewares/authMiddleware");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// Tüm admin route'ları için authentication ve admin role gerekli
router.use(authMiddleware_1.authenticateToken);
router.use((0, isAdmin_1.isRole)("ADMIN"));
// Kullanıcı yönetimi
router.get("/users/with-online-status", adminController_1.getAllUsersWithOnlineStatus);
router.get("/users", adminController_1.getAllUsers);
router.get("/users/:id", adminController_1.getUserById);
router.put("/users/:id/role", adminController_1.updateUserRole);
router.put("/users/:id/status", adminController_1.toggleUserStatus);
router.post("/users/:id/ban", adminController_1.banUser);
router.post("/users/:id/unban", adminController_1.unbanUser);
router.get("/users/search", adminController_1.searchUsers);
// Rapor yönetimi
router.get("/reports", adminController_1.getAllReports);
router.put("/reports/:id/status", adminController_1.updateReportStatus);
// İstatistikler - Gerçek zamanlı güncelleme
router.get("/stats", adminController_1.getAdminStats);
exports.default = router;
