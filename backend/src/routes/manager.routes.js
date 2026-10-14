import { Router } from "express";
import {
  getManagerDashboard,
  getManagerAgents,
  addSalesAgentOrStaff,
  deleteSalesAgentOrStaff,
  assignLeadToAgent,
  handleApprovalAction
} from "../controllers/manager.controller.js";
import { getManagerChatReports, getFullTranscript } from "../controllers/chat.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply optionalAuth to bind manager session details
router.use(optionalAuth);

// Manager Dashboard (Strictly essential metrics & team overview)
router.get("/dashboard", getManagerDashboard);

// Chat Audit Reports and Transcripts
router.get("/chat-reports", getManagerChatReports);
router.get("/reports", getManagerChatReports);
router.get("/transcripts/:id", getFullTranscript);

// Sales Agents and Staff Management (Manager permission)
router.get("/agents", getManagerAgents);
router.post("/agents", addSalesAgentOrStaff);
router.delete("/agents/:id", deleteSalesAgentOrStaff);

// Lead Assignment Queue & Approvals
router.patch("/leads/:leadId/assign", assignLeadToAgent);
router.post("/approvals/:id/action", handleApprovalAction);

export default router;

