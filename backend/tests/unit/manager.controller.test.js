import { jest } from "@jest/globals";

// Mock models before importing controller
jest.unstable_mockModule("../../src/models/staff.model.js", () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/deal.model.js", () => ({
  default: {
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/lead.model.js", () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/activity.model.js", () => ({
  default: {
    create: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/notification.model.js", () => ({
  default: {
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.unstable_mockModule("../../src/models/user.model.js", () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

// Dynamic import
const Staff = (await import("../../src/models/staff.model.js")).default;
const Lead = (await import("../../src/models/lead.model.js")).default;
const Deal = (await import("../../src/models/deal.model.js")).default;
const Notification = (await import("../../src/models/notification.model.js")).default;
const Activity = (await import("../../src/models/activity.model.js")).default;

const {
  getManagerDashboard,
  assignLeadToAgent,
  handleApprovalAction,
  getManagerAgents,
  addSalesAgentOrStaff
} = await import("../../src/controllers/manager.controller.js");

describe("Manager Controller Unit Tests", () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: { email: "manager@onesoft.com", role: "manager" }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe("getManagerDashboard", () => {
    test("should return 404 if no manager profile is found in database", async () => {
      mockReq.query = { managerId: "nonexistent_id" };
      Staff.findById.mockResolvedValue(null);

      await getManagerDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Manager profile not found in database"
        })
      );
    });

    test("should return manager dashboard data strictly from DB when manager exists", async () => {
      const mockManager = {
        _id: "mgr_123",
        name: "Imran Siddiqui",
        email: "manager@onesoft.com",
        role: "Regional Sales Manager",
        department: "Sales Management",
        monthlyQuota: 100000,
        avatar: "avatar.jpg"
      };

      Staff.findOne.mockResolvedValue(mockManager);

      // Agents query mock
      const mockAgent = {
        _id: "agent_1",
        name: "Hamza Farooq",
        totalValue: 25000,
        toObject: () => ({ _id: "agent_1", name: "Hamza Farooq", totalValue: 25000 })
      };
      Staff.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockAgent])
      });

      Lead.countDocuments.mockResolvedValue(2);
      Lead.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) })
      });

      Deal.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) })
        })
      });
      Deal.countDocuments.mockResolvedValue(5);

      Notification.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) })
      });
      Notification.countDocuments.mockResolvedValue(1);

      await getManagerDashboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          manager: expect.objectContaining({
            name: "Imran Siddiqui",
            email: "manager@onesoft.com"
          }),
          stats: expect.objectContaining({
            teamTargetProgress: expect.any(Object),
            unassignedLeads: expect.any(Object),
            activeTeamDeals: expect.any(Object),
            pendingApprovals: expect.any(Object)
          })
        })
      );
    });
  });

  describe("assignLeadToAgent", () => {
    test("should return 400 if agentId is missing", async () => {
      mockReq.params = { leadId: "lead_1" };
      mockReq.body = {}; // Missing agentId

      await assignLeadToAgent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Agent ID is required"
      });
    });

    test("should return 404 if agent is not found", async () => {
      mockReq.params = { leadId: "lead_1" };
      mockReq.body = { agentId: "agent_999" };
      Staff.findById.mockResolvedValue(null);

      await assignLeadToAgent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Agent not found"
      });
    });

    test("should return 404 if lead is not found", async () => {
      mockReq.params = { leadId: "lead_999" };
      mockReq.body = { agentId: "agent_1" };
      Staff.findById.mockResolvedValue({ _id: "agent_1", name: "Hamza" });
      Lead.findByIdAndUpdate.mockResolvedValue(null);

      await assignLeadToAgent(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Lead not found"
      });
    });

    test("should assign lead to agent and record activity log", async () => {
      mockReq.params = { leadId: "lead_1" };
      mockReq.body = { agentId: "agent_1" };

      const mockAgent = { _id: "agent_1", name: "Hamza Farooq" };
      Staff.findById.mockResolvedValue(mockAgent);

      const mockUpdatedLead = {
        _id: "lead_1",
        name: "Alpha Corp Lead",
        assignedTo: "agent_1",
        status: "Contacted"
      };
      Lead.findByIdAndUpdate.mockResolvedValue(mockUpdatedLead);
      Activity.create.mockResolvedValue({});

      await assignLeadToAgent(mockReq, mockRes);

      expect(Lead.findByIdAndUpdate).toHaveBeenCalledWith(
        "lead_1",
        { assignedTo: "agent_1", status: "Contacted" },
        { new: true }
      );
      expect(Activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Lead Assigned: Alpha Corp Lead"
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Lead assigned to Hamza Farooq",
          lead: mockUpdatedLead
        })
      );
    });
  });

  describe("handleApprovalAction", () => {
    test("should update notification, record activity, and return confirmation", async () => {
      mockReq.params = { id: "notif_1" };
      mockReq.body = { action: "approve", notes: "Approved 10% discount" };

      Notification.findByIdAndUpdate.mockResolvedValue({ _id: "notif_1", isRead: true });
      Activity.create.mockResolvedValue({});

      await handleApprovalAction(mockReq, mockRes);

      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith(
        "notif_1",
        { isRead: true },
        { new: true }
      );
      expect(Activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Approval Request Approved",
          type: "deal"
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Approval request successfully approved!"
        })
      );
    });
  });

  describe("getManagerAgents", () => {
    test("should fetch agents excluding managers", async () => {
      const mockAgents = [
        { name: "Sufyan", role: "Sales Agent", category: "agent" }
      ];
      Staff.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAgents)
      });

      await getManagerAgents(mockReq, mockRes);

      expect(Staff.find).toHaveBeenCalledWith({ category: { $ne: "manager" } });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        agents: mockAgents
      });
    });
  });

  describe("addSalesAgentOrStaff", () => {
    test("should return 400 if name or email is missing", async () => {
      mockReq.body = { name: "Agent Name" }; // Missing email

      await addSalesAgentOrStaff(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Agent Name and Email are required"
      });
    });

    test("should create agent with category 'agent' under manager", async () => {
      mockReq.body = {
        name: "Bilal Agent",
        email: "bilal.agent@onesoft.com",
        role: "Sales Agent",
        category: "agent",
        phone: "+92 300 1234567"
      };

      Staff.findOne.mockResolvedValue(null);
      const createdAgent = {
        _id: "ag_new",
        name: "Bilal Agent",
        email: "bilal.agent@onesoft.com",
        category: "agent"
      };
      Staff.create.mockResolvedValue(createdAgent);
      Activity.create.mockResolvedValue({});

      await addSalesAgentOrStaff(mockReq, mockRes);

      expect(Staff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Bilal Agent",
          email: "bilal.agent@onesoft.com",
          category: "agent",
          managerEmail: "manager@onesoft.com"
        })
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Sales Agent created successfully"
        })
      );
    });
  });
});
