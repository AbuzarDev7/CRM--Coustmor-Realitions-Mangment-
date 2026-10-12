import { Router } from "express";
import {
  getManagerDashboard,
  getManagerAgents,
  addSalesAgentOrStaff,
  deleteSalesAgentOrStaff
} from "../controllers/manager.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply optionalAuth to bind manager session details
router.use(optionalAuth);

// Manager Dashboard (Strictly essential metrics & team overview)
router.get("/dashboard", getManagerDashboard);

// Sales Agents and Staff Management (Manager permission)
router.get("/agents", getManagerAgents);
router.post("/agents", addSalesAgentOrStaff);
router.delete("/agents/:id", deleteSalesAgentOrStaff);

export default router;
