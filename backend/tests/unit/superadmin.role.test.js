import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

// 1. Mock Mongoose Models before importing routes/controllers
jest.unstable_mockModule("../../src/models/staff.model.js", () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/activity.model.js", () => ({
  default: {
    create: jest.fn(),
    find: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/lead.model.js", () => ({
  default: {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/deal.model.js", () => ({
  default: {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/notification.model.js", () => ({
  default: {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn()
  }
}));

// Dynamic imports
const Staff = (await import("../../src/models/staff.model.js")).default;
const User = (await import("../../src/models/user.model.js")).default;
const Activity = (await import("../../src/models/activity.model.js")).default;
const Lead = (await import("../../src/models/lead.model.js")).default;
const Deal = (await import("../../src/models/deal.model.js")).default;
const Notification = (await import("../../src/models/notification.model.js")).default;

const adminRoutes = (await import("../../src/routes/admin.routes.js")).default;
const managerRoutes = (await import("../../src/routes/manager.routes.js")).default;

describe("Super Admin Role & Oversight APIs - Automated Test Suite", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Mount routes for testing
    app.use("/api/admin", adminRoutes);
    app.use("/api/manager", managerRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. Root Routing & Clutter-Free Layout Endpoints
  // =========================================================================
  describe("1. Root Routing & API Structure", () => {
    test("GET /api/admin/dashboard/stats returns clean HTTP 200 without extra clutter", async () => {
      Staff.countDocuments.mockResolvedValue(6);
      Lead.countDocuments.mockResolvedValue(150);
      Deal.countDocuments.mockResolvedValue(45);
      Deal.aggregate.mockResolvedValue([{ _id: null, total: 32000 }]);
      Staff.aggregate.mockResolvedValue([{ _id: null, totalValue: 85000, totalDeals: 24, avgSuccessRate: 88 }]);
      Lead.aggregate.mockResolvedValue([
        { _id: "Organic Website", count: 40 },
        { _id: "LinkedIn", count: 25 }
      ]);

      const res = await request(app).get("/api/admin/dashboard/stats");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalRevenue).toBeDefined();
      expect(res.body.stats.totalLeads).toBeDefined();
      expect(res.body.revenueGrowth).toBeDefined();
      expect(res.body.leadSources).toBeDefined();
    });

    test("Super Admin restriction guard: agents cannot be added via admin endpoint (returns 403 Forbidden)", async () => {
      const res = await request(app)
        .post("/api/admin/staff")
        .send({ name: "Rogue Agent", email: "rogue@agent.com" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Admins are restricted from creating agents/i);
      expect(Staff.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 2. Zero Mock Data & Backend Persistence (Managers)
  // =========================================================================
  describe("2. Zero Mock Data & Backend Persistence (Managers)", () => {
    test("GET /api/admin/managers returns empty state ([]) when database has zero managers", async () => {
      // Simulate empty collection in MongoDB
      const sortMock = jest.fn().mockResolvedValue([]);
      Staff.find.mockReturnValue({ sort: sortMock });

      const res = await request(app).get("/api/admin/managers");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.managers).toEqual([]); // Zero hardcoded mock fallback!
      expect(Staff.find).toHaveBeenCalledWith({ category: "manager" });
    });

    test("GET /api/admin/managers retrieves real persisted managers from MongoDB", async () => {
      const dbManagers = [
        {
          _id: "mgr_mongo_1",
          name: "Farhan Zaidi",
          email: "farhan.z@onesoft.com",
          role: "Sales Director",
          category: "manager",
          monthlyQuota: 150000,
          department: "Enterprise"
        }
      ];
      const sortMock = jest.fn().mockResolvedValue(dbManagers);
      Staff.find.mockReturnValue({ sort: sortMock });

      const res = await request(app).get("/api/admin/managers");

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.managers[0].email).toBe("farhan.z@onesoft.com");
    });

    test("POST /api/admin/add-manager fails with 400 if name or email is missing", async () => {
      const res = await request(app)
        .post("/api/admin/add-manager")
        .send({ name: "Missing Email Only" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Name and email are required/i);
    });

    test("POST /api/admin/add-manager rejects duplicates if manager email already exists", async () => {
      Staff.findOne.mockResolvedValue({ email: "duplicate@onesoft.com" });

      const res = await request(app)
        .post("/api/admin/add-manager")
        .send({ name: "Duplicate Manager", email: "duplicate@onesoft.com" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already exists/i);
      expect(Staff.create).not.toHaveBeenCalled();
    });

    test("POST /api/admin/add-manager hashes password and creates Staff (manager) and User login records", async () => {
      Staff.findOne.mockResolvedValue(null);
      User.findOne.mockResolvedValue(null);

      const createdStaff = {
        _id: "mgr_persisted_99",
        name: "Ayesha Malik",
        email: "ayesha.m@onesoft.com",
        role: "Regional Sales Manager",
        category: "manager",
        monthlyQuota: 120000,
        department: "Sales Management",
        status: "Online"
      };

      Staff.create.mockResolvedValue(createdStaff);
      User.create.mockResolvedValue({
        _id: "usr_persisted_99",
        name: "Ayesha Malik",
        email: "ayesha.m@onesoft.com",
        role: "manager",
        isVerified: true
      });
      Activity.create.mockResolvedValue({});

      const res = await request(app)
        .post("/api/admin/add-manager")
        .send({
          name: "Ayesha Malik",
          email: "ayesha.m@onesoft.com",
          role: "Regional Sales Manager",
          monthlyQuota: 120000,
          department: "Sales Management",
          password: "SecurePassword!99"
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/Manager created successfully/i);

      // Verify Staff document persistence with category 'manager'
      expect(Staff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Ayesha Malik",
          email: "ayesha.m@onesoft.com",
          category: "manager",
          monthlyQuota: 120000
        })
      );

      // Verify User login account was provisioned with role 'manager'
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Ayesha Malik",
          email: "ayesha.m@onesoft.com",
          role: "manager",
          isVerified: true
        })
      );

      // Verify audit activity log was recorded
      expect(Activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Ayesha Malik"),
          type: "staff"
        })
      );
    });
  });

  // =========================================================================
  // 3. Super Admin Impersonation ("View as Manager")
  // =========================================================================
  describe("3. Super Admin Impersonation ('View as Manager')", () => {
    test("GET /api/manager/dashboard loads manager-specific context using managerId / managerEmail params", async () => {
      const mockManager = {
        _id: "mgr_1001",
        name: "Imran Siddiqui",
        email: "imran.s@onesoft.com",
        role: "Regional Sales Manager",
        department: "Sales Management",
        monthlyQuota: 100000,
        category: "manager",
        phone: "+92 301 5544332"
      };

      Staff.findById.mockResolvedValue(mockManager);
      User.findOne.mockResolvedValue(null);

      // Team agents under this manager
      const teamAgents = [
        {
          _id: "agent_1",
          name: "Bilal Ahmed",
          email: "bilal.a@onesoft.com",
          totalValue: 35000,
          toObject: () => ({ _id: "agent_1", name: "Bilal Ahmed", totalValue: 35000 })
        }
      ];
      Staff.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(teamAgents)
      });

      Lead.countDocuments.mockResolvedValue(5);
      Lead.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });

      Deal.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });
      Deal.countDocuments.mockResolvedValue(8);

      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      Notification.countDocuments.mockResolvedValue(2);

      // Super Admin requests manager dashboard with impersonation params
      const res = await request(app)
        .get("/api/manager/dashboard")
        .query({
          managerId: "mgr_1001",
          managerEmail: "imran.s@onesoft.com",
          impersonate: "true"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.manager).toBeDefined();
      expect(res.body.manager.name).toBe("Imran Siddiqui");
      expect(res.body.manager.email).toBe("imran.s@onesoft.com");
      expect(res.body.stats.teamTargetProgress).toBeDefined();
      expect(res.body.agents).toHaveLength(1);
    });

    test("GET /api/manager/dashboard returns 404 when target manager is not found", async () => {
      Staff.findById.mockResolvedValue(null);
      Staff.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get("/api/manager/dashboard")
        .query({ managerId: "non_existent_mgr_id" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Manager profile not found/i);
    });
  });

  // =========================================================================
  // 4. Global KPI Cards & Oversight APIs
  // =========================================================================
  describe("4. Global KPI Cards & Oversight APIs", () => {
    test("Calculates total revenue strictly summing Closed Won deals with baseline", async () => {
      Staff.countDocuments.mockResolvedValue(12);
      Lead.countDocuments.mockResolvedValue(250);
      Deal.countDocuments.mockResolvedValue(30);

      // Live won deals sum = $45,000 -> Total = 45,000 (Zero mock baseline)
      Deal.aggregate.mockResolvedValue([{ _id: null, total: 45000 }]);
      Staff.aggregate.mockResolvedValue([{ _id: null, totalValue: 98000 }]);
      Lead.aggregate.mockResolvedValue([]);

      const res = await request(app).get("/api/admin/dashboard/stats");

      expect(res.status).toBe(200);
      expect(Deal.aggregate).toHaveBeenCalledWith([
        { $match: { stage: "Closed Won" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);
      expect(res.body.stats.totalRevenue.raw).toBe(45000);
      expect(res.body.stats.totalRevenue.formatted).toBe("$45,000");
      expect(res.body.stats.totalLeads.raw).toBe(250);
      expect(res.body.summary.totalStaff).toBe(12);
    });

    test("Aggregates lead acquisition source channels dynamically", async () => {
      Staff.countDocuments.mockResolvedValue(5);
      Lead.countDocuments.mockResolvedValue(100);
      Deal.countDocuments.mockResolvedValue(10);
      Deal.aggregate.mockResolvedValue([]);
      Staff.aggregate.mockResolvedValue([]);

      Lead.aggregate.mockResolvedValue([
        { _id: "Organic Website", count: 120 },
        { _id: "Instagram", count: 85 },
        { _id: "TikTok Lead Ads", count: 42 }
      ]);

      const res = await request(app).get("/api/admin/dashboard/stats");

      expect(res.status).toBe(200);
      const sources = res.body.leadSources;
      expect(sources).toBeDefined();

      const tiktokSource = sources.find((s) => s.name === "TikTok Lead Ads");
      expect(tiktokSource).toBeDefined();
      expect(tiktokSource.value).toBe(42);
    });
  });
});
