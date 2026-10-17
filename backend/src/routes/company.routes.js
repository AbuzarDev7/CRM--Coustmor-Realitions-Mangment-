import { Router } from "express";
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  createCompanyManager,
  getCompanyManagers,
  updateCompanyStatus,
  updateCompany
} from "../controllers/company.controller.js";
import {
  verifyToken,
  requireSuperAdmin,
  requireCompanyAdmin
} from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all company routes with JWT verification
router.use(verifyToken);

// 1. Superadmin: Global Company provisioning, update & status
router.post("/", requireSuperAdmin, createCompany);
router.get("/", requireSuperAdmin, getAllCompanies);
router.put("/:id", requireSuperAdmin, updateCompany);
router.patch("/:id", requireSuperAdmin, updateCompany);
router.patch("/:id/status", requireSuperAdmin, updateCompanyStatus);

// 2. Company Admin / Superadmin: Specific Company & Manager Management
router.post("/managers", requireCompanyAdmin, createCompanyManager);
router.get("/:id", requireCompanyAdmin, getCompanyById);
router.get("/:id/managers", requireCompanyAdmin, getCompanyManagers);

export default router;
