"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../../../common/middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Public routes
router.post("/register", authController_1.register);
router.post("/login", authController_1.login);
router.post("/forgot-password", authController_1.forgotPassword);
router.post("/reset-password", authController_1.resetPassword);
router.post("/verify", authController_1.verifyAuth);
// Protected routes
router.post("/logout", authMiddleware_1.authenticateToken, authController_1.logout);
router.put("/profile", authMiddleware_1.authenticateToken, authController_1.updateProfile);
exports.default = router;
