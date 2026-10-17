import { Router } from "express";
import {
  getManagerOverview,
  getManagerDashboard,
  getManagerAgents,
  addSalesAgentOrStaff,
  deleteSalesAgentOrStaff,
  assignLeadToAgent,
  handleApprovalAction
} from "../controllers/manager.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(optionalAuth);

// 1. Manager Real-time Overview & Dashboard
router.get("/overview", getManagerOverview);
router.get("/dashboard", getManagerDashboard);

// 2. Sales Agents Management (Manager permission)
router.get("/agents", getManagerAgents);
router.post("/agents", addSalesAgentOrStaff);
router.delete("/agents/:id", deleteSalesAgentOrStaff);

// 3. Lead Assignment Queue
router.put("/leads/:leadId/assign", assignLeadToAgent);
router.patch("/leads/:leadId/assign", assignLeadToAgent);

// 4. Notifications & Approval Action
router.post("/notifications/:id/approval", handleApprovalAction);
router.patch("/notifications/:id/approval", handleApprovalAction);

export default router;
