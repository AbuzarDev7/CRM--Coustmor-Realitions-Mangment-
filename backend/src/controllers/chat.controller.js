import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Staff from "../models/staff.model.js";
import { getIO } from "../socket/chat.socket.js";

// POST /api/chat/init
// Initialize or resume conversation for customer
export const initConversation = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      agentId,
      agentName,
      agentEmail
    } = req.body;

    if (!customerEmail || !customerName) {
      return res.status(400).json({ error: "Customer name and email are required" });
    }

    const cleanEmail = customerEmail.toLowerCase().trim();

    // 1. Check if there is already an active conversation for this customer
    let conversation = await Conversation.findOne({
      customerEmail: cleanEmail,
      status: "active"
    }).sort({ createdAt: -1 });

    let isNew = false;

    if (!conversation) {
      // Find an agent if none specified
      let resolvedAgentId = agentId || "";
      let resolvedAgentName = agentName || "Sales Advisor";
      let resolvedAgentEmail = agentEmail || "";

      if (!resolvedAgentEmail) {
        const staffAgent = await Staff.findOne({ category: { $ne: "manager" } });
        if (staffAgent) {
          resolvedAgentId = staffAgent._id.toString();
          resolvedAgentName = staffAgent.name;
          resolvedAgentEmail = staffAgent.email;
        }
      }

      conversation = await Conversation.create({
        customerId: customerId || "",
        customerName: customerName.trim(),
        customerEmail: cleanEmail,
        customerPhone: customerPhone || "",
        agentId: resolvedAgentId,
        agentName: resolvedAgentName,
        agentEmail: resolvedAgentEmail,
        status: "active",
        startedAt: new Date(),
        lastMessageAt: new Date(),
        messageCount: 1,
        lastMessage: `Hello ${customerName}! I'm ${resolvedAgentName}, your dedicated CRM account manager. How may I help you today?`
      });

      isNew = true;

      // Create welcome message
      await Message.create({
        conversationId: conversation._id,
        senderRole: "agent",
        senderName: resolvedAgentName,
        senderEmail: resolvedAgentEmail,
        text: `Hello ${customerName}! I'm ${resolvedAgentName}, your dedicated CRM account manager. How may I help you today?`,
        status: "delivered",
        createdAt: new Date()
      });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    const io = getIO();
    if (io) {
      const convIdStr = String(conversation._id);
      const customerEmail = conversation.customerEmail ? conversation.customerEmail.toLowerCase().trim() : "";
      const agentEmail = conversation.agentEmail ? conversation.agentEmail.toLowerCase().trim() : "";

      const targetRooms = [convIdStr, `conversation_${convIdStr}`, "agents_room", "staff_room"];
      if (customerEmail) targetRooms.push(`user_${customerEmail}`);
      if (agentEmail) targetRooms.push(`user_${agentEmail}`);

      io.to(targetRooms).emit("conversation_updated", {
        conversation,
        isNew,
        latestMessage: messages[messages.length - 1] || null
      });

      if (isNew && messages.length > 0) {
        io.to(targetRooms).emit("new_msg", {
          message: messages[0],
          conversation
        });
      }
    }

    return res.status(200).json({
      success: true,
      isNew,
      conversation,
      messages
    });
  } catch (error) {
    console.error("Init Conversation Error:", error);
    return res.status(500).json({ error: "Failed to initialize chat session" });
  }
};

// GET /api/chat/conversations/:id/messages
export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// GET /api/chat/agent/queue
// Active chat queue for the Agent
export const getAgentQueue = async (req, res) => {
  try {
    const agentEmail = req.query.agentEmail || req.user?.email || "";
    const userRole = req.user?.role ? String(req.user.role).toLowerCase() : "";

    let query = {};
    if (userRole === "admin" || userRole === "manager" || userRole === "superadmin") {
      // Admins and Managers have root oversight over all conversations
      query = {};
    } else if (agentEmail) {
      // For agents: show chats assigned to them, unassigned chats, or any active customer chats
      query = {
        $or: [
          { agentEmail: agentEmail.toLowerCase().trim() },
          { agentEmail: "" },
          { agentEmail: { $exists: false } },
          { status: "active" }
        ]
      };
    }

    let conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(50);

    // If no conversations found under specific query, fallback to all active conversations
    if (conversations.length === 0) {
      conversations = await Conversation.find({})
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .limit(50);
    }

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    console.error("Get Agent Queue Error:", error);
    return res.status(500).json({ error: "Failed to load agent chat queue" });
  }
};

// POST /api/chat/conversations/:id/report
// End Chat & Submit Quality Report to Manager
export const submitChatReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      summary,
      sentiment,
      customerSentiment,
      resolutionStatus,
      resolvedStatus,
      agentNotes,
      agentName
    } = req.body;

    if (!summary || !summary.trim()) {
      return res.status(400).json({ error: "A brief conversation summary is required for the manager report" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const submittedBy = agentName || req.user?.name || req.user?.email || conversation.agentName || "Agent";
    const actualSentiment = customerSentiment || sentiment || "Positive";
    const actualResolution = resolvedStatus || resolutionStatus || "Resolved";
    let totalCount = conversation.messageCount || 0;
    if (typeof Message?.countDocuments === "function") {
      try {
        const counted = await Message.countDocuments({ conversationId: conversation._id });
        if (typeof counted === "number") totalCount = counted;
      } catch (e) {
        // fallback
      }
    }

    conversation.status = "reported_to_manager";
    conversation.endedAt = new Date();
    conversation.report = {
      summary: summary.trim(),
      customerSentiment: actualSentiment,
      sentiment: actualSentiment,
      resolvedStatus: actualResolution,
      resolutionStatus: actualResolution,
      totalMessagesCount: totalCount || conversation.messageCount || 0,
      agentNotes: agentNotes ? agentNotes.trim() : "",
      submittedAt: new Date(),
      submittedBy
    };

    await conversation.save();

    // Add a system message in transcript
    const systemMsg = await Message.create({
      conversationId: conversation._id,
      senderRole: "system",
      senderName: "System",
      text: `Chat session was concluded by ${submittedBy}. Quality audit report [${resolutionStatus || "Resolved"} - ${sentiment || "Positive"}] was submitted to Management.`,
      createdAt: new Date()
    });

    // Notify WebSocket subscribers
    const io = getIO();
    if (io) {
      const convIdStr = String(conversation._id);
      const customerEmail = conversation.customerEmail ? conversation.customerEmail.toLowerCase().trim() : "";
      const agentEmail = conversation.agentEmail ? conversation.agentEmail.toLowerCase().trim() : "";

      const targetRooms = [convIdStr, `conversation_${convIdStr}`, "agents_room", "staff_room"];
      if (customerEmail) targetRooms.push(`user_${customerEmail}`);
      if (agentEmail) targetRooms.push(`user_${agentEmail}`);

      io.to(targetRooms).emit("chat_reported", {
        conversation,
        systemMessage: systemMsg
      });

      io.to(targetRooms).emit("conversation_updated", {
        conversation
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat report submitted to Manager and conversation successfully archived",
      conversation
    });
  } catch (error) {
    console.error("Submit Chat Report Error:", error);
    return res.status(500).json({ error: "Failed to submit manager audit report" });
  }
};

// GET /api/chat/manager/reports
// Manager Quality Audit & Chat Reports Screen
export const getManagerChatReports = async (req, res) => {
  try {
    const { sentiment, resolutionStatus, search } = req.query;

    let query = {
      $or: [
        { status: "reported_to_manager" },
        { "report.summary": { $exists: true, $ne: "" } }
      ]
    };

    const targetSentiment = req.query.customerSentiment || req.query.sentiment;
    const targetStatus = req.query.resolvedStatus || req.query.resolutionStatus;

    if (targetSentiment) {
      query["$and"] = query["$and"] || [];
      query["$and"].push({
        $or: [
          { "report.sentiment": targetSentiment },
          { "report.customerSentiment": targetSentiment }
        ]
      });
    }
    if (targetStatus) {
      query["$and"] = query["$and"] || [];
      query["$and"].push({
        $or: [
          { "report.resolutionStatus": targetStatus },
          { "report.resolvedStatus": targetStatus }
        ]
      });
    }
    if (search) {
      const q = search.trim();
      query.$and = [
        {
          $or: [
            { customerName: { $regex: q, $options: "i" } },
            { customerEmail: { $regex: q, $options: "i" } },
            { agentName: { $regex: q, $options: "i" } },
            { "report.summary": { $regex: q, $options: "i" } }
          ]
        }
      ];
    }

    const reports = await Conversation.find(query).sort({ "report.submittedAt": -1, updatedAt: -1 });

    // Aggregate KPI metrics
    const totalAudited = reports.length;
    const positiveCount = reports.filter((r) => r.report?.sentiment === "Positive").length;
    const resolvedCount = reports.filter((r) => r.report?.resolutionStatus === "Resolved").length;
    const escalatedCount = reports.filter((r) => r.report?.resolutionStatus === "Escalated").length;

    return res.status(200).json({
      success: true,
      count: totalAudited,
      kpis: {
        totalAudited,
        positiveSentimentRate: totalAudited > 0 ? Math.round((positiveCount / totalAudited) * 100) : 0,
        resolvedRate: totalAudited > 0 ? Math.round((resolvedCount / totalAudited) * 100) : 0,
        escalatedCount
      },
      reports
    });
  } catch (error) {
    console.error("Manager Chat Reports Error:", error);
    return res.status(500).json({ error: "Failed to fetch manager chat audit reports" });
  }
};

// GET /api/chat/manager/transcripts/:id
// Manager "View Full Transcript" Drawer
export const getFullTranscript = async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: "Chat transcript not found" });
    }

    const messages = await Message.find({ conversationId: id }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    console.error("Get Full Transcript Error:", error);
    return res.status(500).json({ error: "Failed to load chat transcript" });
  }
};

// POST /api/chat/send (REST fallback)
export const sendMessageREST = async (req, res) => {
  try {
    const { conversationId, senderRole, senderName, senderEmail, text } = req.body;

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({ error: "conversationId and text are required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    if (conversation.status === "reported_to_manager") {
      return res.status(400).json({ error: "Session is concluded and reported. Messages are locked." });
    }

    const message = await Message.create({
      conversationId,
      senderRole: senderRole || "customer",
      senderName: senderName || "Anonymous",
      senderEmail: senderEmail || "",
      text: text.trim(),
      status: "sent",
      createdAt: new Date()
    });

    conversation.lastMessage = message.text;
    conversation.lastMessageAt = message.createdAt;
    conversation.messageCount = (conversation.messageCount || 0) + 1;
    await conversation.save();

    const io = getIO();
    if (io) {
      const convIdStr = String(conversation._id);
      const customerEmail = conversation.customerEmail ? conversation.customerEmail.toLowerCase().trim() : "";
      const agentEmail = conversation.agentEmail ? conversation.agentEmail.toLowerCase().trim() : "";

      const targetRooms = [convIdStr, `conversation_${convIdStr}`, "agents_room", "staff_room"];
      if (customerEmail) targetRooms.push(`user_${customerEmail}`);
      if (agentEmail) targetRooms.push(`user_${agentEmail}`);

      io.to(targetRooms).emit("new_msg", {
        message,
        conversation
      });

      io.to(targetRooms).emit("conversation_updated", {
        conversation,
        latestMessage: message
      });
    }

    return res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error("Send Message REST Error:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};
