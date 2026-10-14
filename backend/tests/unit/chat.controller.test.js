import { jest } from "@jest/globals";

// Mock Mongoose models and socket before importing controller
const mockConversation = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn()
};

const mockMessage = {
  find: jest.fn(),
  create: jest.fn()
};

const mockStaff = {
  findOne: jest.fn()
};

const mockIO = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn()
};

const mockGetIO = jest.fn(() => mockIO);

jest.unstable_mockModule("../../src/models/conversation.model.js", () => ({
  default: mockConversation,
  Conversation: mockConversation
}));

jest.unstable_mockModule("../../src/models/message.model.js", () => ({
  default: mockMessage,
  Message: mockMessage
}));

jest.unstable_mockModule("../../src/models/staff.model.js", () => ({
  default: mockStaff,
  Staff: mockStaff
}));

jest.unstable_mockModule("../../src/socket/chat.socket.js", () => ({
  getIO: mockGetIO
}));

// Dynamic import of chat controller after mocks
const {
  initConversation,
  getConversationMessages,
  getAgentQueue,
  submitChatReport,
  getManagerChatReports,
  getFullTranscript,
  sendMessageREST
} = await import("../../src/controllers/chat.controller.js");

describe("Chat Controller Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe("initConversation (POST /api/chat/init)", () => {
    it("should return 400 if customer name or email is missing", async () => {
      req = { body: { customerName: "Alice" } }; // missing customerEmail
      await initConversation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringMatching(/required/i) })
      );
    });

    it("should return existing active conversation and messages if one exists", async () => {
      req = {
        body: {
          customerName: "Alice Smith",
          customerEmail: "alice@example.com"
        }
      };

      const mockExistingConv = {
        _id: "conv_123",
        customerEmail: "alice@example.com",
        status: "active"
      };

      mockConversation.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockExistingConv)
      });

      const mockMsgs = [
        { _id: "m1", text: "Hello", senderRole: "customer" },
        { _id: "m2", text: "Hi Alice, how can I help?", senderRole: "agent" }
      ];

      mockMessage.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockMsgs)
      });

      await initConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation: mockExistingConv,
          messages: mockMsgs,
          isNew: false
        })
      );
    });

    it("should create a new conversation and welcome message if no active session exists", async () => {
      req = {
        body: {
          customerName: "Bob Ross",
          customerEmail: "bob@canvas.com",
          agentName: "Sufyan",
          agentEmail: "sufyan@gmail.com"
        }
      };

      mockConversation.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null)
      });

      const newConv = {
        _id: "conv_456",
        customerName: "Bob Ross",
        customerEmail: "bob@canvas.com",
        agentName: "Sufyan",
        agentEmail: "sufyan@gmail.com",
        status: "active"
      };

      mockConversation.create.mockResolvedValue(newConv);
      const welcomeMsg = { _id: "m_welcome", text: "Hello Bob Ross! I'm Sufyan." };
      mockMessage.create.mockResolvedValue(welcomeMsg);
      mockMessage.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([welcomeMsg])
      });

      await initConversation(req, res);

      expect(mockConversation.create).toHaveBeenCalled();
      expect(mockMessage.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation: newConv,
          messages: [welcomeMsg],
          isNew: true
        })
      );
    });
  });

  describe("getConversationMessages (GET /api/chat/conversations/:id/messages)", () => {
    it("should return 404 if conversation is not found", async () => {
      req = { params: { id: "non_existent" } };
      mockConversation.findById.mockResolvedValue(null);

      await getConversationMessages(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return conversation and messages", async () => {
      req = { params: { id: "conv_789" } };
      const conv = { _id: "conv_789", customerName: "Charlie" };
      const msgs = [{ _id: "m_1", text: "Test msg" }];

      mockConversation.findById.mockResolvedValue(conv);
      mockMessage.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(msgs)
      });

      await getConversationMessages(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation: conv,
          messages: msgs
        })
      );
    });
  });

  describe("getAgentQueue (GET /api/chat/agent/queue)", () => {
    it("should return active chat queue for the agent", async () => {
      req = { query: { agentEmail: "sufyan@gmail.com" }, user: { email: "sufyan@gmail.com" } };
      const activeConvs = [{ _id: "c1", customerName: "Lead 1" }];

      mockConversation.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(activeConvs)
        })
      });

      await getAgentQueue(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
          conversations: activeConvs
        })
      );
    });
  });

  describe("submitChatReport (POST /api/chat/conversations/:id/report)", () => {
    it("should return 400 if summary is missing", async () => {
      req = {
        params: { id: "conv_123" },
        body: { sentiment: "Positive" } // missing summary
      };

      await submitChatReport(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should update conversation to reported_to_manager and save audit data", async () => {
      const conv = {
        _id: "conv_123",
        status: "active",
        report: {},
        save: jest.fn().mockResolvedValue(true)
      };

      req = {
        params: { id: "conv_123" },
        body: {
          summary: "Customer upgraded to Enterprise plan.",
          sentiment: "Positive",
          resolutionStatus: "Resolved",
          agentNotes: "Follow up next quarter for renewal.",
          agentName: "Sufyan"
        },
        user: { name: "Sufyan" }
      };

      mockConversation.findById.mockResolvedValue(conv);
      mockMessage.create.mockResolvedValue({ _id: "sys_msg" });

      await submitChatReport(req, res);

      expect(conv.status).toBe("reported_to_manager");
      expect(conv.report.sentiment).toBe("Positive");
      expect(conv.report.resolutionStatus).toBe("Resolved");
      expect(conv.report.summary).toBe("Customer upgraded to Enterprise plan.");
      expect(conv.save).toHaveBeenCalled();
      expect(mockMessage.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const jsonResponse = res.json.mock.calls[0][0];
      expect(jsonResponse.success).toBe(true);
      expect(jsonResponse.message).toMatch(/report/i);
    });
  });

  describe("getManagerChatReports (GET /api/chat/manager/reports)", () => {
    it("should return reports list and computed KPIs", async () => {
      req = {
        query: {}
      };

      const mockReports = [
        {
          _id: "r1",
          customerName: "Alice",
          report: { sentiment: "Positive", resolutionStatus: "Resolved" }
        },
        {
          _id: "r2",
          customerName: "Bob",
          report: { sentiment: "Negative", resolutionStatus: "Escalated" }
        }
      ];

      mockConversation.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockReports)
      });

      await getManagerChatReports(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
          reports: mockReports,
          kpis: expect.objectContaining({
            totalAudited: 2,
            positiveSentimentRate: 50,
            resolvedRate: 50,
            escalatedCount: 1
          })
        })
      );
    });
  });

  describe("getFullTranscript (GET /api/chat/manager/transcripts/:id)", () => {
    it("should return 404 if conversation does not exist", async () => {
      req = { params: { id: "not_found" } };
      mockConversation.findById.mockResolvedValue(null);

      await getFullTranscript(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return conversation and all chronological messages for manager review", async () => {
      req = { params: { id: "conv_audit_1" } };
      const conv = { _id: "conv_audit_1", customerName: "Test Customer" };
      const messages = [
        { _id: "1", text: "Customer: I need assistance" },
        { _id: "2", text: "Agent: Assisting right away" }
      ];

      mockConversation.findById.mockResolvedValue(conv);
      mockMessage.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(messages)
      });

      await getFullTranscript(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation: conv,
          messages: messages
        })
      );
    });
  });

  describe("sendMessageREST (POST /api/chat/send)", () => {
    it("should return 400 if conversationId or text is missing", async () => {
      req = { body: { conversationId: "c1" } };
      await sendMessageREST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      req = { body: { text: "Hello" } };
      await sendMessageREST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 if conversation is not found", async () => {
      req = { body: { conversationId: "missing_id", text: "Hello" } };
      mockConversation.findById.mockResolvedValue(null);

      await sendMessageREST(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return 400 if conversation is reported and locked", async () => {
      req = { body: { conversationId: "c_locked", text: "Hello" } };
      mockConversation.findById.mockResolvedValue({
        _id: "c_locked",
        status: "reported_to_manager"
      });

      await sendMessageREST(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringMatching(/locked/i) })
      );
    });

    it("should create message, update conversation, emit via socket, and return 201", async () => {
      const conv = {
        _id: "c_active_123",
        status: "active",
        customerEmail: "alice@acme.com",
        agentEmail: "sufyan@gmail.com",
        lastMessage: "",
        lastMessageAt: null,
        messageCount: 1,
        save: jest.fn().mockResolvedValue(true)
      };

      const createdMsg = {
        _id: "m_new_1",
        conversationId: "c_active_123",
        senderRole: "manager",
        senderName: "Haider",
        text: "Direct message from management",
        status: "sent"
      };

      req = {
        body: {
          conversationId: "c_active_123",
          senderRole: "manager",
          senderName: "Haider",
          senderEmail: "haider@gmail.com",
          text: "Direct message from management"
        }
      };

      mockConversation.findById.mockResolvedValue(conv);
      mockMessage.create.mockResolvedValue(createdMsg);

      await sendMessageREST(req, res);

      expect(mockMessage.create).toHaveBeenCalled();
      expect(conv.lastMessage).toBe("Direct message from management");
      expect(conv.save).toHaveBeenCalled();
      expect(mockIO.to).toHaveBeenCalled();
      expect(mockIO.emit).toHaveBeenCalledWith("new_msg", expect.objectContaining({ message: createdMsg }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: createdMsg
        })
      );
    });
  });
});
