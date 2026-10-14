import { jest } from "@jest/globals";

// Mock models before importing controller
jest.unstable_mockModule("../../src/models/staff.model.js", () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {
    findOne: jest.fn(),
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
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/deal.model.js", () => ({
  default: {
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  }
}));

// Dynamic import after mocking
const Staff = (await import("../../src/models/staff.model.js")).default;
const User = (await import("../../src/models/user.model.js")).default;
const Activity = (await import("../../src/models/activity.model.js")).default;

const {
  addStaffMember,
  getStaffList,
  getManagers,
  addManager,
  deleteStaffMember
} = await import("../../src/controllers/admin.controller.js");

describe("Admin Controller Unit Tests", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      body: {},
      params: {},
      user: { email: "admin@onesoft.com", role: "admin" }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe("addStaffMember (Agent Restriction Guard)", () => {
    test("should strictly return 403 Forbidden because admins can only add managers", async () => {
      mockReq.body = { name: "Agent Test", email: "agent@test.com" };

      await addStaffMember(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining("Admins are restricted from creating agents")
        })
      );
      expect(Staff.create).not.toHaveBeenCalled();
    });
  });

  describe("getStaffList", () => {
    test("should query Staff for non-managers and return list", async () => {
      const mockAgents = [
        { name: "Hamza Farooq", role: "Sales Rep", category: "agent" },
        { name: "Zoya Malik", role: "Account Executive", category: "agent" }
      ];
      const sortMock = jest.fn().mockResolvedValue(mockAgents);
      Staff.find.mockReturnValue({ sort: sortMock });

      await getStaffList(mockReq, mockRes);

      expect(Staff.find).toHaveBeenCalledWith({ category: { $ne: "manager" } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        staff: mockAgents
      });
    });

    test("should return 500 when database throws an error", async () => {
      Staff.find.mockImplementation(() => {
        throw new Error("DB Connection Error");
      });

      await getStaffList(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to fetch staff members"
      });
    });
  });

  describe("getManagers", () => {
    test("should query Staff strictly for category: 'manager'", async () => {
      const mockManagers = [
        { name: "Imran Siddiqui", role: "Regional Sales Manager", category: "manager" },
        { name: "Farhan Zaidi", role: "Sales Manager", category: "manager" }
      ];
      const sortMock = jest.fn().mockResolvedValue(mockManagers);
      Staff.find.mockReturnValue({ sort: sortMock });

      await getManagers(mockReq, mockRes);

      expect(Staff.find).toHaveBeenCalledWith({ category: "manager" });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        managers: mockManagers
      });
    });
  });

  describe("addManager", () => {
    test("should return 400 if name or email is missing", async () => {
      mockReq.body = { name: "Farhan" }; // Missing email

      await addManager(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Name and email are required"
      });
    });

    test("should return 400 if manager already exists in Staff collection", async () => {
      mockReq.body = { name: "Existing Manager", email: "existing@onesoft.com" };
      Staff.findOne.mockResolvedValue({ email: "existing@onesoft.com" });

      await addManager(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "A manager or staff with this email already exists"
      });
    });

    test("should create Staff member with category 'manager' and register User login", async () => {
      mockReq.body = {
        name: "New Manager",
        email: "newmgr@onesoft.com",
        role: "Sales Manager",
        monthlyQuota: 120000,
        department: "Enterprise",
        password: "Manager@1234"
      };

      Staff.findOne.mockResolvedValue(null);
      User.findOne.mockResolvedValue(null);

      const createdStaff = {
        _id: "mgr_123",
        name: "New Manager",
        email: "newmgr@onesoft.com",
        role: "Sales Manager",
        category: "manager",
        department: "Enterprise"
      };
      Staff.create.mockResolvedValue(createdStaff);
      User.create.mockResolvedValue({});
      Activity.create.mockResolvedValue({});

      await addManager(mockReq, mockRes);

      expect(Staff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Manager",
          email: "newmgr@onesoft.com",
          category: "manager"
        })
      );
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "newmgr@onesoft.com",
          role: "manager"
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Manager created successfully with Manager Dashboard access"
        })
      );
    });
  });

  describe("deleteStaffMember", () => {
    test("should return 404 if staff member does not exist", async () => {
      mockReq.params.id = "invalid_id";
      Staff.findByIdAndDelete.mockResolvedValue(null);

      await deleteStaffMember(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Staff member not found"
      });
    });

    test("should delete staff member and record audit activity log", async () => {
      mockReq.params.id = "valid_id";
      const deletedProfile = { name: "Agent Sara", email: "sara@onesoft.com" };
      Staff.findByIdAndDelete.mockResolvedValue(deletedProfile);
      Activity.create.mockResolvedValue({});

      await deleteStaffMember(mockReq, mockRes);

      expect(Staff.findByIdAndDelete).toHaveBeenCalledWith("valid_id");
      expect(Activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Staff member removed: Agent Sara"
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Staff member removed successfully"
      });
    });
  });
});
