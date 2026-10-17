import express from "express";
import {
  submitCustomerInquiry,
  getPublicCompanyBySlug,
  submitCompanyPublicLead,
  assignLead,
  getMyAssignedLeads,
  updateLeadByAgent,
  createManualLead,
  getSourceAnalytics,
  getLeadsList,
  simulateMetaWebhookLead
} from "../controllers/lead.controller.js";
import { verifyToken, requireManager, requireAgent, optionalAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Public Multi-Tenant Lead Routing Endpoints
 * 1. GET /api/leads/public/company/:companySlug -> Company Profile & Dynamic Policy Fields
 * 2. POST /api/leads/public/:companySlug -> Direct Lead Routing to Specific Company
 */
router.get("/public/company/:companySlug", getPublicCompanyBySlug);
router.get("/public/:companySlug", getPublicCompanyBySlug);
router.post("/public/:companySlug", submitCompanyPublicLead);
router.post("/public/submit/:companySlug", submitCompanyPublicLead);
router.post("/submit/:companySlug", submitCompanyPublicLead);

// General Public Fallback Form
router.post("/submit", submitCustomerInquiry);

// 2. Manager Assignment
router.put("/assign/:leadId", verifyToken, requireManager, assignLead);
router.patch("/assign/:leadId", verifyToken, requireManager, assignLead);

// 3. Agent's assigned leads
router.get("/my-leads", verifyToken, requireAgent, getMyAssignedLeads);

// 4. Agent lead status & notes update
router.put("/update/:leadId", verifyToken, requireAgent, updateLeadByAgent);
router.patch("/update/:leadId", verifyToken, requireAgent, updateLeadByAgent);

// Middleware: Only allow Superadmin and Manager (reject Agent)
const allowAdminAndManager = (req, res, next) => {
  if (req.user) {
    const role = (req.user.role || "").toLowerCase();
    if (role === "agent") {
      return res.status(403).json({
        success: false,
        error: "Forbidden. Only Superadmin and Managers can manually create leads."
      });
    }
  }
  next();
};

// 5. General listings, analytics, and helpers
router.get("/source-analytics", getSourceAnalytics);
router.get("/", optionalAuth, getLeadsList);
router.post("/create-manual", optionalAuth, allowAdminAndManager, createManualLead);
router.post("/create", optionalAuth, allowAdminAndManager, createManualLead);
router.post("/", optionalAuth, allowAdminAndManager, createManualLead);
router.post("/simulate-webhook", simulateMetaWebhookLead);

export default router;
