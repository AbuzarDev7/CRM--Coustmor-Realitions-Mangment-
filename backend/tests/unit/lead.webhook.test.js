import { jest } from "@jest/globals";

// Mock Mongoose models before importing controllers
const mockLead = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn()
};

const mockActivity = {
  create: jest.fn()
};

const mockNotification = {
  create: jest.fn()
};

jest.unstable_mockModule("../../src/models/lead.model.js", () => ({
  default: mockLead,
  Lead: mockLead
}));

jest.unstable_mockModule("../../src/models/activity.model.js", () => ({
  default: mockActivity
}));

jest.unstable_mockModule("../../src/models/notification.model.js", () => ({
  default: mockNotification
}));

// Import controllers after mocks are defined
const { verifyMetaWebhook, handleMetaWebhook } = await import(
  "../../src/controllers/webhook.controller.js"
);

const {
  createManualLead,
  getSourceAnalytics,
  getLeadsList
} = await import("../../src/controllers/lead.controller.js");

describe("Lead Ingestion & Analytics Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.META_VERIFY_TOKEN = "crm_meta_webhook_secret_token";

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe("Meta Webhook Hub Challenge Verification (GET /api/webhooks/meta)", () => {
    it("should verify successfully and return challenge string when tokens match", () => {
      req = {
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "crm_meta_webhook_secret_token",
          "hub.challenge": "1158201239"
        }
      };

      verifyMetaWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith("1158201239");
    });

    it("should return 403 Forbidden when verify_token does not match", () => {
      req = {
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "wrong_token",
          "hub.challenge": "1158201239"
        }
      };

      verifyMetaWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Verification token mismatch" })
      );
    });
  });

  describe("Meta Webhook Leadgen Ingestion (POST /api/webhooks/meta)", () => {
    it("should process leadgen change event and persist lead into MongoDB", async () => {
      req = {
        body: {
          object: "page",
          entry: [
            {
              id: "page_12345",
              changes: [
                {
                  field: "leadgen",
                  value: {
                    leadgen_id: "leadgen_889900",
                    form_id: "form_5544",
                    ad_id: "ad_1122",
                    field_data: [
                      { name: "full_name", values: ["Carlos Rodriguez"] },
                      { name: "email", values: ["carlos.r@solutions.com"] },
                      { name: "phone_number", values: ["+14155557890"] },
                      { name: "company_name", values: ["Rodriguez Tech"] }
                    ]
                  }
                }
              ]
            }
          ]
        }
      };

      mockLead.findOne.mockResolvedValue(null); // not already ingested
      mockLead.create.mockResolvedValue({
        _id: "mock_lead_id_1",
        name: "Carlos Rodriguez",
        email: "carlos.r@solutions.com",
        phone: "+14155557890",
        company: "Rodriguez Tech",
        source: "Facebook",
        status: "New"
      });
      mockActivity.create.mockResolvedValue({});
      mockNotification.create.mockResolvedValue({});

      await handleMetaWebhook(req, res);

      expect(mockLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Carlos Rodriguez",
          email: "carlos.r@solutions.com",
          phone: "+14155557890",
          company: "Rodriguez Tech",
          source: "Facebook",
          status: "New"
        })
      );
      expect(mockActivity.create).toHaveBeenCalled();
      expect(mockNotification.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1
        })
      );
    });

    it("should handle Instagram leadgen events and tag source as Instagram", async () => {
      req = {
        body: {
          object: "instagram",
          entry: [
            {
              id: "insta_page_99",
              changes: [
                {
                  field: "leadgen",
                  value: {
                    leadgen_id: "insta_lead_4433",
                    field_data: [
                      { name: "name", values: ["Emily Chen"] },
                      { name: "email", values: ["emily.c@insta.io"] }
                    ]
                  }
                }
              ]
            }
          ]
        }
      };

      mockLead.findOne.mockResolvedValue(null);
      mockLead.create.mockResolvedValue({
        _id: "mock_lead_id_2",
        name: "Emily Chen",
        email: "emily.c@insta.io",
        source: "Instagram",
        status: "New"
      });
      mockActivity.create.mockResolvedValue({});
      mockNotification.create.mockResolvedValue({});

      await handleMetaWebhook(req, res);

      expect(mockLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Emily Chen",
          email: "emily.c@insta.io",
          source: "Instagram",
          status: "New"
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Manual Lead Entry Fallback (POST /api/leads/create)", () => {
    it("should return 400 if customer name is missing", async () => {
      req = {
        body: {
          email: "test@example.com"
        }
      };

      await createManualLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Customer name is required" })
      );
    });

    it("should return 400 if customer email is missing", async () => {
      req = {
        body: {
          name: "John Doe"
        }
      };

      await createManualLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Customer email address is required" })
      );
    });

    it("should create lead with specified source tag (e.g. LinkedIn) and return 201", async () => {
      req = {
        body: {
          name: "David Kim",
          email: "david@vertex.com",
          phone: "+1 650 555 4321",
          company: "Vertex Inc",
          source: "LinkedIn",
          estimatedValue: 12000,
          notes: "Met at conference"
        },
        user: { name: "Admin" }
      };

      const mockCreated = {
        _id: "lead_123",
        name: "David Kim",
        email: "david@vertex.com",
        source: "LinkedIn",
        status: "New",
        estimatedValue: 12000
      };

      mockLead.create.mockResolvedValue(mockCreated);
      mockActivity.create.mockResolvedValue({});
      mockNotification.create.mockResolvedValue({});

      await createManualLead(req, res);

      expect(mockLead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "David Kim",
          email: "david@vertex.com",
          source: "LinkedIn",
          estimatedValue: 12000
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          lead: mockCreated
        })
      );
    });
  });

  describe("Social Media Channel Analytics (GET /api/leads/source-analytics)", () => {
    it("should aggregate leads by source and calculate conversion rates using MongoDB $group", async () => {
      const mockAggResult = [
        { source: "Facebook", totalLeads: 50, closedWonCount: 15, totalValue: 75000, conversionRate: 30 },
        { source: "Instagram", totalLeads: 30, closedWonCount: 6, totalValue: 36000, conversionRate: 20 },
        { source: "LinkedIn", totalLeads: 20, closedWonCount: 8, totalValue: 80000, conversionRate: 40 }
      ];

      mockLead.aggregate.mockResolvedValue(mockAggResult);

      req = {};

      await getSourceAnalytics(req, res);

      expect(mockLead.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          sources: expect.arrayContaining([
            expect.objectContaining({ name: "Facebook", value: 50, conversionRate: 30 }),
            expect.objectContaining({ name: "Instagram", value: 30, conversionRate: 20 })
          ]),
          summary: expect.objectContaining({
            totalLeads: 100,
            closedWonCount: 29,
            overallConversionRate: 29,
            topSource: "Facebook"
          })
        })
      );
    });
  });
});
