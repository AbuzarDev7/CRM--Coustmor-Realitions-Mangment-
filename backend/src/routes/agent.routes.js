import { Router } from "express";
import {
  getAgentDashboard,
  updateLeadStatus,
  updateDealStage,
  submitDiscountApproval,
  logMeetingNotes
} from "../controllers/agent.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Allow optional auth to identify agent from session
router.use(optionalAuth);

// Agent Dashboard metrics, tasks, and personal pipeline
router.get("/dashboard", getAgentDashboard);

// Inline lead status updates
router.patch("/leads/:id/status", updateLeadStatus);

// Personal Kanban deal stage moves
router.patch("/deals/:id/stage", updateDealStage);

// Manager interaction: discount request and meeting notes
router.post("/discount-request", submitDiscountApproval);
router.post("/log-notes", logMeetingNotes);

export default router;
