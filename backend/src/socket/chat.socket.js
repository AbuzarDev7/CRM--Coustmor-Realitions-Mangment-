import { Server } from "socket.io";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

let ioInstance = null;

export const initChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          /^http:\/\/localhost:\d+$/.test(origin) ||
          /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH"]
    }
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    // console.log(`[Socket.io] Connected client: ${socket.id}`);

    // Helper to determine if role is agent / staff / manager / admin
    const checkIsStaffOrAgent = (roleStr) => {
      if (!roleStr) return false;
      const r = String(roleStr).toLowerCase().trim();
      return (
        r === "agent" ||
        r === "sales_agent" ||
        r === "sales representative" ||
        r === "sales rep" ||
        r === "account executive" ||
        r === "staff" ||
        r === "manager" ||
        r === "admin" ||
        r === "superadmin" ||
        r.includes("agent") ||
        r.includes("sales") ||
        r.includes("staff") ||
        r.includes("manager") ||
        r.includes("admin")
      );
    };

    // Register user identity and rooms
    socket.on("identify", (data) => {
      try {
        if (data?.userEmail) {
          const cleanEmail = String(data.userEmail).toLowerCase().trim();
          socket.join(`user_${cleanEmail}`);
        }
        const role = data?.role || "";
        if (checkIsStaffOrAgent(role)) {
          socket.join("agents_room");
          socket.join("staff_room");
        }
      } catch (err) {
        console.error("Socket identify error:", err);
      }
    });

    // Explicit event to join agents room without role ambiguity
    socket.on("join_agents_room", (data) => {
      try {
        socket.join("agents_room");
        socket.join("staff_room");
        if (data?.userEmail) {
          const cleanEmail = String(data.userEmail).toLowerCase().trim();
          socket.join(`user_${cleanEmail}`);
        }
      } catch (err) {
        console.error("Socket join_agents_room error:", err);
      }
    });

    // Join specific conversation room
    socket.on("join_conversation", async (data) => {
      try {
        const rawConvId = typeof data === "string" ? data : data?.conversationId;
        if (rawConvId) {
          const convIdStr = String(rawConvId);
          socket.join(convIdStr);
          socket.join(`conversation_${convIdStr}`);
          socket.emit("joined_conversation_success", { conversationId: convIdStr });
        }

        // If user info provided, join user room for targeted alerts
        if (data?.userEmail) {
          const cleanEmail = String(data.userEmail).toLowerCase().trim();
          socket.join(`user_${cleanEmail}`);
        }
        const role = data?.role || "";
        if (checkIsStaffOrAgent(role)) {
          socket.join("agents_room");
          socket.join("staff_room");
        }
      } catch (err) {
        console.error("Socket join_conversation error:", err);
      }
    });

    // Leave conversation room
    socket.on("leave_conversation", (data) => {
      try {
        const rawConvId = typeof data === "string" ? data : data?.conversationId;
        if (rawConvId) {
          const convIdStr = String(rawConvId);
          socket.leave(convIdStr);
          socket.leave(`conversation_${convIdStr}`);
        }
      } catch (err) {
        console.error("Socket leave_conversation error:", err);
      }
    });

    // Send and receive real-time messages
    socket.on("send_msg", async (payload, ackCallback) => {
      try {
        const { conversationId, senderRole, senderName, senderEmail, text } = payload || {};

        if (!conversationId || !text || !text.trim()) {
          if (typeof ackCallback === "function") {
            return ackCallback({ success: false, error: "Conversation ID and message text are required" });
          }
          return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          if (typeof ackCallback === "function") {
            return ackCallback({ success: false, error: "Conversation not found" });
          }
          return;
        }

        // Check if conversation is locked/reported
        if (conversation.status === "reported_to_manager") {
          socket.emit("chat_error", {
            message: "This conversation has been finalized and reported to the manager. New messages are locked."
          });
          if (typeof ackCallback === "function") {
            return ackCallback({ success: false, error: "Session is locked and reported" });
          }
          return;
        }

        // Save new message
        const message = await Message.create({
          conversationId: conversation._id,
          senderRole: senderRole || "customer",
          senderName: senderName || "Anonymous",
          senderEmail: senderEmail || "",
          text: text.trim(),
          status: "sent",
          createdAt: new Date()
        });

        // Update conversation metadata
        conversation.lastMessage = message.text;
        conversation.lastMessageAt = message.createdAt;
        conversation.messageCount = (conversation.messageCount || 0) + 1;
        if (conversation.status === "ended") {
          conversation.status = "active";
        }
        await conversation.save();

        const messageData = {
          _id: message._id,
          conversationId: message.conversationId,
          senderRole: message.senderRole,
          senderName: message.senderName,
          senderEmail: message.senderEmail,
          text: message.text,
          status: message.status,
          createdAt: message.createdAt
        };

        const convIdStr = String(conversation._id);
        const customerEmail = conversation.customerEmail ? conversation.customerEmail.toLowerCase().trim() : "";
        const agentEmail = conversation.agentEmail ? conversation.agentEmail.toLowerCase().trim() : "";

        // Collect all target rooms in an array so Socket.io delivers to EVERY room simultaneously
        const targetRooms = [
          convIdStr,
          `conversation_${convIdStr}`,
          "agents_room",
          "staff_room"
        ];
        if (customerEmail) targetRooms.push(`user_${customerEmail}`);
        if (agentEmail) targetRooms.push(`user_${agentEmail}`);

        // Broadcast new_msg to all target rooms
        io.to(targetRooms).emit("new_msg", {
          message: messageData,
          conversation
        });

        // Broadcast conversation_updated so agent queue moves conversation to top
        io.to(targetRooms).emit("conversation_updated", {
          conversation,
          latestMessage: messageData
        });

        if (typeof ackCallback === "function") {
          ackCallback({ success: true, message: messageData });
        }
      } catch (err) {
        console.error("Socket send_msg error:", err);
        if (typeof ackCallback === "function") {
          ackCallback({ success: false, error: err.message });
        }
      }
    });

    // Real-time typing indicators
    socket.on("typing", (data) => {
      const convId = data?.conversationId ? String(data.conversationId) : null;
      if (convId) {
        const targetRooms = [convId, `conversation_${convId}`, "agents_room", "staff_room"];
        socket.to(targetRooms).emit("user_typing", {
          conversationId: convId,
          senderName: data.senderName,
          senderRole: data.senderRole,
          isTyping: Boolean(data.isTyping)
        });
      }
    });

    socket.on("disconnect", () => {
      // console.log(`[Socket.io] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => ioInstance;
