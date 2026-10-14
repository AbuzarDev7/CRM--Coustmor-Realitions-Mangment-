import express from "express";
import {
  createManualLead,
  getSourceAnalytics,
  getLeadsList,
  simulateMetaWebhookLead
} from "../controllers/lead.controller.js";

const router = express.Router();

/**
 * Lead Ingestion & Analytics Endpoints
 * POST /api/leads/create            -> Manual lead entry fallback
 * GET  /api/leads/source-analytics  -> Social media channel aggregation with MongoDB $group
 * GET  /api/leads                   -> List leads with optional search & filter
 * POST /api/leads/simulate-webhook  -> Simulation utility for instant UI demonstration
 */
router.post("/create", createManualLead);
router.get("/source-analytics", getSourceAnalytics);
router.get("/", getLeadsList);
router.post("/simulate-webhook", simulateMetaWebhookLead);

export default router;
