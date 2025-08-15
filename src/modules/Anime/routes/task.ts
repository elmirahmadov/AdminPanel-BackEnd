import { Router } from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getUserTasks,
  completeTask,
  getTaskProgress,
} from "../controllers/taskController";
import { authenticateToken } from "../../../common/middlewares/authMiddleware";
import { isRole } from "../../../common/middlewares/isAdmin";

const router = Router();

router.get("/", getAllTasks);
router.get("/:id", getTaskById);
router.post("/", authenticateToken, isRole("ADMIN"), createTask);
router.put("/:id", authenticateToken, isRole("ADMIN"), updateTask);
router.delete("/:id", authenticateToken, isRole("ADMIN"), deleteTask);
router.get("/user/:userId", getUserTasks);
router.post("/:id/complete", authenticateToken, completeTask);
router.get("/:id/progress", getTaskProgress);

export default router;
