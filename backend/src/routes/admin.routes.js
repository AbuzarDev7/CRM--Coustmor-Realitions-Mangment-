import { Router } from "express";
import {
  getDashboardStats,
  getAdminOverview,
  getStaffList,
  addStaffMember,
  deleteStaffMember,
  addManager,
  getManagers,
  deleteManager,
  getActivities,
  addActivity,
  getNotifications,
  markNotificationsRead,
  getLeads,
  createLead,
  getDeals,
  createDeal,
  exportCsvReport
} from "../controllers/admin.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Apply optional auth to allow session extraction
router.use(optionalAuth);

// Analytics & KPI stats
router.get("/overview", getAdminOverview);
router.get("/dashboard/stats", getDashboardStats);

// Staff Management
router.get("/staff", getStaffList);
router.post("/staff", addStaffMember);
router.delete("/staff/:id", deleteStaffMember);

// Super Admin: Managers Management
router.get("/managers", getManagers);
router.post("/managers", addManager);
router.post("/add-manager", addManager);
router.delete("/managers/:id", deleteManager);

// Activity Timeline
router.get("/activities", getActivities);
router.post("/activities", addActivity);

// Notifications
router.get("/notifications", getNotifications);
router.patch("/notifications/mark-read", markNotificationsRead);

// Leads & Deals Pipeline
router.get("/leads", getLeads);
router.post("/leads", createLead);
router.get("/deals", getDeals);
router.post("/deals", createDeal);

// CSV Export
router.get("/export-csv", exportCsvReport);

export default router;
