import { Router } from "express";
import {
  getAgentDashboard,
  getMyAssignedLeads as getAgentMyLeads,
  updateLeadStatus
} from "../controllers/agent.controller.js";
import { getMyAssignedLeads, updateLeadByAgent } from "../controllers/lead.controller.js";
import { verifyToken, requireAgent, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// 1. GET /api/agent/my-leads - Fetch strictly assigned leads
router.get("/my-leads", verifyToken, requireAgent, getMyAssignedLeads);

// 2. GET /api/agent/dashboard - Fetch strictly assigned leads & counts
router.get("/dashboard", optionalAuth, getAgentDashboard);

// 3. Lead status & follow-up note update
router.put("/leads/:id", verifyToken, requireAgent, updateLeadByAgent);
router.patch("/leads/:id", verifyToken, requireAgent, updateLeadByAgent);
router.patch("/leads/:id/status", verifyToken, requireAgent, updateLeadStatus);

export default router;
